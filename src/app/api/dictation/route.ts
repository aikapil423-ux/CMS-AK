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

function transcribe(audio: Buffer, language: string, signal: AbortSignal) {
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

export async function POST(request: NextRequest) {
  const user = await apiAccess(request);
  if (user instanceof Response) return user;

  const language = request.nextUrl.searchParams.get("language");
  if (language !== "hi" && language !== "en") {
    return Response.json({ error: "Unsupported dictation language." }, { status: 400 });
  }
  if (!/^(audio|video)\/(webm|mp4|ogg|wav)(;|$)/i.test(request.headers.get("content-type") ?? "")) {
    return Response.json({ error: "Unsupported dictation audio format." }, { status: 415 });
  }
  if (active) {
    return Response.json({ error: "Whisper is busy. Please try again." }, { status: 429 });
  }

  active = true;
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

    const result = await transcribe(Buffer.concat(chunks), language, request.signal);
    return Response.json(result, { status: result.error ? 422 : 200 });
  } catch {
    return Response.json({ error: "Local Whisper transcription failed. Check the Whisper installation and try again." }, { status: 503 });
  } finally {
    active = false;
  }
}
