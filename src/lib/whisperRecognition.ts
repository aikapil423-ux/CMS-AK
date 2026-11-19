type TranscriptEvent = { resultIndex: number; results: Array<[{ transcript: string }] & { isFinal: boolean }> };
type RecordingSession = {
  abort: AbortController;
  stream?: MediaStream;
  context?: AudioContext;
  recorder?: MediaRecorder;
  timer?: ReturnType<typeof setInterval>;
  pending: Promise<void>;
  queued: number;
  stopping: boolean;
};

export function supportsWhisperDictation() {
  return typeof MediaRecorder !== "undefined" && typeof AudioContext !== "undefined"
    && typeof navigator.mediaDevices?.getUserMedia === "function";
}

export class WhisperRecognition {
  lang = "hi-IN";
  continuous = true;
  onstart?: () => void;
  onspeechstart?: () => void;
  onend?: () => void;
  onresult?: (event: TranscriptEvent) => void;
  onerror?: (event: { error: string }) => void;
  private session?: RecordingSession;

  start() {
    if (this.session) return;
    const session: RecordingSession = {
      abort: new AbortController(), pending: Promise.resolve(), queued: 0, stopping: false,
    };
    this.session = session;
    void this.capture(session);
  }

  private async capture(session: RecordingSession) {
    try {
      const context = new AudioContext();
      session.context = context;
      const resumed = context.resume();
      void resumed.catch(() => undefined);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (this.session !== session) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      session.stream = stream;
      await resumed;
      if (this.session !== session) return;
      const analyser = context.createAnalyser();
      context.createMediaStreamSource(stream).connect(analyser);
      this.record(session, stream, analyser);
      this.onstart?.();
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      this.fail(session, name === "NotAllowedError" ? "not-allowed" : "audio-capture");
    }
  }

  private record(session: RecordingSession, stream: MediaStream, analyser: AnalyserNode) {
    const recorder = new MediaRecorder(stream);
    session.recorder = recorder;
    const audioChunks: Blob[] = [];
    const samples = new Float32Array(analyser.fftSize);
    const started = performance.now();
    let lastVoice = 0;
    recorder.ondataavailable = ({ data }) => {
      if (data.size) audioChunks.push(data);
    };
    recorder.onerror = () => this.fail(session, "audio-capture");
    recorder.onstop = () => {
      clearInterval(session.timer);
      if (this.session !== session) return;
      try {
        if (audioChunks.length && (lastVoice || session.stopping)) {
          const language = this.lang.startsWith("hi") ? "hi" : "en";
          this.transcribe(session, new Blob(audioChunks, { type: recorder.mimeType }), language);
        }
        if (this.session !== session) return;
        if (this.continuous && !session.stopping && !session.abort.signal.aborted) {
          this.record(session, stream, analyser);
        } else {
          this.release(session);
          void session.pending.then(() => this.finish(session));
        }
      } catch {
        if (this.continuous && !session.stopping) {
          this.record(session, stream, analyser);
        } else {
          this.fail(session, "audio-capture");
        }
      }
    };
    recorder.start();
    session.timer = setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      const power = samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length;
      const now = performance.now();
      if (power > 0.000064) {
        if (!lastVoice) this.onspeechstart?.();
        lastVoice = now;
      }
      if ((lastVoice && now - lastVoice >= 2000) || (now - started >= 25_000 && lastVoice)) {
        clearInterval(session.timer);
        if (recorder.state === "recording") recorder.stop();
      }
    }, 75);
  }

  private transcribe(session: RecordingSession, audio: Blob, language: string) {
    if (session.queued >= 10) return;
    session.queued++;
    session.pending = session.pending.then(async () => {
      if (session.abort.signal.aborted) return;
      try {
        const response = await fetch(`/api/dictation?language=${language}`, {
          method: "POST",
          body: audio,
          signal: session.abort.signal,
        });
        const result = await response.json();
        if (this.session === session && result.text) {
          this.onresult?.({
            resultIndex: 0,
            results: [Object.assign([{ transcript: result.text }] as [{ transcript: string }], { isFinal: true })],
          });
        }
      } catch (error) {
        console.warn("Dictation chunk transcription error:", error);
      }
    }).finally(() => { session.queued--; });
  }

  stop() {
    const session = this.session;
    if (!session) return;
    session.stopping = true;
    if (session.recorder?.state === "recording") {
      clearInterval(session.timer);
      session.recorder.stop();
      this.release(session);
    } else {
      this.abort();
      this.onend?.();
    }
  }

  abort() {
    const session = this.session;
    if (!session) return;
    this.session = undefined;
    session.abort.abort();
    if (session.recorder?.state === "recording") session.recorder.stop();
    this.release(session);
  }

  private release(session: RecordingSession) {
    clearInterval(session.timer);
    session.stream?.getTracks().forEach(track => track.stop());
    if (session.context && session.context.state !== "closed") {
      void session.context.close().catch(() => undefined);
    }
  }

  private finish(session: RecordingSession) {
    if (this.session !== session) return;
    this.session = undefined;
    this.onend?.();
  }

  private fail(session: RecordingSession, error: string) {
    if (this.session !== session) return;
    this.abort();
    this.onerror?.({ error });
    this.onend?.();
  }
}

export const supportsIndicConformerDictation = supportsWhisperDictation;
export const IndicConformerRecognition = WhisperRecognition;
