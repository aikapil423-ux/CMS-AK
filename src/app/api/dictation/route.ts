import { spawn } from "node:child_process";
import path from "node:path";
import { createInterface } from "node:readline";
import type { NextRequest } from "next/server";
import { apiAccess } from "@/lib/apiSecurity";

export const runtime = "nodejs";

const maxAudioBytes = 4 * 1024 * 1024;
let active = false;

function startWorker() {
  const root = process.cwd();
  const python = path.join(root, ".whisper", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  const processHandle = spawn(python, [
    path.join(root, "scripts", "whisper-transcribe.py"),
    path.join(root, ".whisper", "model"),
    path.dirname(process.execPath),
  ], { stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
  const output = createInterface({ input: processHandle.stdout });
  const instance = { processHandle, output, idle: undefined as ReturnType<typeof setTimeout> | undefined };
  const reset = () => {
    clearTimeout(instance.idle);
    if (worker === instance) worker = undefined;
  };
  processHandle.once("error", reset);
  processHandle.once("close", reset);
  processHandle.stdin.on("error", () => processHandle.kill());
  return instance;
}

let worker: ReturnType<typeof startWorker> | undefined;

function transcribeWithWhisper(audio: Buffer, language: string, signal: AbortSignal) {
  signal.throwIfAborted();
  const { processHandle, output } = worker ??= startWorker();
  const instance = worker;
  clearTimeout(instance.idle);

  return new Promise<{ text?: string; error?: string }>((resolve, reject) => {
    const timeout = setTimeout(stop, 120_000);
    function cleanup() {
      clearTimeout(timeout);
      signal.removeEventListener("abort", stop);
      processHandle.off("close", fail);
      processHandle.off("error", fail);
      output.off("line", complete);
    }
    function fail() {
      cleanup();
      reject(new Error("Whisper worker stopped."));
    }
    function stop() {
      if (worker === instance) worker = undefined;
      processHandle.kill();
      fail();
    }
    function complete(line: string) {
      cleanup();
      instance.idle = setTimeout(() => {
        if (worker === instance) worker = undefined;
        processHandle.kill();
      }, 60_000);
      instance.idle.unref();
      try {
        resolve(JSON.parse(line));
      } catch (error) {
        reject(error);
      }
    }
    processHandle.once("close", fail);
    processHandle.once("error", fail);
    signal.addEventListener("abort", stop, { once: true });
    output.once("line", complete);
    processHandle.stdin.write(`${language} ${audio.length}\n`);
    processHandle.stdin.write(audio);
  });
}

/**
 * Priority 1: Cloud Gemini Multimodal Audio Transcription
 * Native high-speed speech-to-text with Hindi legal vocabulary support
 */
async function transcribeWithGemini(
  audio: Buffer,
  rawMime: string,
  language: string,
  signal: AbortSignal
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  // `gemini-3.5-flash-lite` was never a published model id, so every dictation
  // call 404'd and fell through to the (often unavailable) local Whisper.
  const model =
    process.env.CMS_DICTATION_MODEL?.trim() ||
    process.env.CMS_EVIDENCE_MODEL?.trim() ||
    "gemini-flash-latest";
  const mimeType = rawMime.includes("wav")
    ? "audio/wav"
    : rawMime.includes("mp4")
    ? "audio/mp4"
    : rawMime.includes("ogg")
    ? "audio/ogg"
    : "audio/webm";

  const prompt = language === "hi"
    ? "You are an official Hindi police stenographer. Transcribe the spoken audio verbatim in Hindi (Devanagari script) or English legal terms as spoken. Do NOT describe the audio, do NOT translate, do NOT add timestamps or preamble. Output ONLY the exact transcribed words. If there is no audible speech or silence, output nothing."
    : "You are an official police stenographer. Transcribe the spoken audio verbatim in English. Do NOT describe the audio, do NOT translate, do NOT add timestamps or preamble. Output ONLY the exact transcribed words. If there is no audible speech or silence, output nothing.";

  const timeoutSignal = AbortSignal.timeout(12_000);
  const combinedSignal = (AbortSignal as any).any ? (AbortSignal as any).any([signal, timeoutSignal]) : signal;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: audio.toString("base64") } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.0,
          maxOutputTokens: 1024,
        },
      }),
      signal: combinedSignal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gemini STT returned HTTP ${response.status}: ${errorText.slice(0, 150)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  return text;
}

/**
 * Priority 3: AI4Bharat IndicASR / IndicConformer
 * Indian Language Speech Recognition Architecture (IIT Madras / Bhashini)
 */
async function transcribeWithAI4Bharat(
  audio: Buffer,
  rawMime: string,
  language: string,
  signal: AbortSignal
): Promise<string | null> {
  const bhashiniKey = process.env.BHASHINI_API_KEY?.trim() || process.env.AI4BHARAT_API_KEY?.trim();
  const customUrl = process.env.AI4BHARAT_ASR_URL?.trim();
  const hfToken = process.env.HF_TOKEN?.trim() || process.env.HUGGINGFACE_TOKEN?.trim();

  const langCode = language.startsWith("hi") ? "hi" : "en";
  const timeoutSignal = AbortSignal.timeout(15_000);
  const combinedSignal = (AbortSignal as any).any ? (AbortSignal as any).any([signal, timeoutSignal]) : signal;

  // 1. Direct AI4Bharat / Bhashini Dhruva ASR Pipeline
  if (bhashiniKey || customUrl) {
    try {
      const apiUrl = customUrl || "https://dhruva-api.bhashini.gov.in/services/inference/asr";
      const payload = {
        pipelineTasks: [
          {
            taskType: "asr",
            config: {
              language: {
                sourceLanguage: langCode,
              },
              serviceId: "ai4bharat/indic-conformer-600m",
              audioFormat: "wav",
              samplingRate: 16000,
            },
          },
        ],
        inputData: {
          audio: [
            {
              audioContent: audio.toString("base64"),
            },
          ],
        },
      };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(bhashiniKey ? { Authorization: bhashiniKey, "ulcaApiKey": bhashiniKey } : {}),
        },
        body: JSON.stringify(payload),
        signal: combinedSignal,
      });

      if (res.ok) {
        const data = await res.json();
        const text =
          data?.pipelineResponse?.[0]?.output?.[0]?.source?.trim() ||
          data?.output?.[0]?.source?.trim() ||
          data?.text?.trim();
        if (text) return text;
      }
    } catch (dhruvaErr) {
      console.warn("AI4Bharat Dhruva inference error:", dhruvaErr);
    }
  }

  // 2. AI4Bharat Hugging Face Inference Router
  if (hfToken) {
    try {
      const hfModels = [
        "ai4bharat/indic-conformer-600m-multilingual",
        "ai4bharat/indicconformer_stt_hi_hybrid_rnnt_large",
      ];
      for (const model of hfModels) {
        const hfRes = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": rawMime || "audio/wav",
          },
          body: new Uint8Array(audio),
          signal: combinedSignal,
        });
        if (hfRes.ok) {
          const hfData = await hfRes.json();
          const text = hfData?.text?.trim() || (Array.isArray(hfData) ? hfData[0]?.text?.trim() : "");
          if (text) return text;
        }
      }
    } catch (hfErr) {
      console.warn("AI4Bharat Hugging Face inference error:", hfErr);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const user = await apiAccess(request);
  if (user instanceof Response) return user;

  const requestedLanguage = request.nextUrl.searchParams.get("language") ?? "";
  // The UI speaks BCP-47 tags (hi-IN / en-IN, plus "hinglish"); the engines want
  // the bare ISO code. Normalise instead of rejecting the browser's own value.
  const language = /^hi/i.test(requestedLanguage) || requestedLanguage === "hinglish"
    ? "hi"
    : /^en/i.test(requestedLanguage)
    ? "en"
    : null;
  if (!language) {
    return Response.json({ error: "Unsupported dictation language." }, { status: 400 });
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^(audio|video)\/(webm|mp4|ogg|wav)(;|$)/i.test(contentType)) {
    return Response.json({ error: "Unsupported dictation audio format." }, { status: 415 });
  }

  try {
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: "No recording supplied." }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxAudioBytes) {
        await reader.cancel();
        return Response.json({ error: "Recording is too large." }, { status: 413 });
      }
      chunks.push(value);
    }
    if (!size) return Response.json({ error: "No recording supplied." }, { status: 400 });

    const audioBuffer = Buffer.concat(chunks);

    // 1. PRIMARY PREFERENCE: Google Gemini STT
    try {
      const geminiText = await transcribeWithGemini(audioBuffer, contentType, language, request.signal);
      if (geminiText !== null) {
        return Response.json({ text: geminiText }, { status: 200 });
      }
    } catch (geminiError) {
      console.warn("Gemini STT failed, falling back to local Whisper Large-v3 Turbo:", geminiError);
    }

    // 2. SECONDARY PREFERENCE: Local Whisper Large-v3 Turbo (100% Offline CTranslate2 INT8)
    if (!active) {
      active = true;
      try {
        const whisperResult = await transcribeWithWhisper(audioBuffer, language, request.signal);
        if (whisperResult && typeof whisperResult.text === "string") {
          return Response.json({ text: whisperResult.text }, { status: 200 });
        }
      } catch (whisperError) {
        console.warn("Local Whisper Large-v3 Turbo error, trying AI4Bharat fallback:", whisperError);
      } finally {
        active = false;
      }
    }

    // 3. TERTIARY PREFERENCE: AI4Bharat IndicASR / IndicConformer Architecture
    try {
      const ai4bharatText = await transcribeWithAI4Bharat(audioBuffer, contentType, language, request.signal);
      if (ai4bharatText) {
        return Response.json({ text: ai4bharatText }, { status: 200 });
      }
    } catch (ai4bharatErr) {
      console.warn("AI4Bharat STT fallback error:", ai4bharatErr);
    }

    return Response.json({ text: "" }, { status: 200 });
  } catch (err) {
    console.error("Dictation route general error:", err);
    return Response.json({ text: "" }, { status: 200 });
  }
}
