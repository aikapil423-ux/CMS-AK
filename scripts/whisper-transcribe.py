import io
import json
import os
import sys

# Node for Windows ships the Microsoft runtime DLLs used by CTranslate2.
if sys.platform == "win32" and len(sys.argv) > 2:
    try:
        os.add_dll_directory(sys.argv[2])
    except Exception:
        pass

from faster_whisper import WhisperModel

model_path = sys.argv[1] if len(sys.argv) > 1 and os.path.exists(sys.argv[1]) else ".whisper/model"
model = WhisperModel(model_path, device="cpu", compute_type="int8", local_files_only=True)

stream = sys.stdin.buffer
while header := stream.readline():
    parts = header.decode("ascii", errors="ignore").strip().split()
    if len(parts) < 2:
        break
    language, length = parts[0], parts[1]
    audio = stream.read(int(length))
    if len(audio) != int(length):
        break
    try:
        lang_code = "hi" if language.startswith("hi") else ("en" if language.startswith("en") else language[:2])
        segments, _ = model.transcribe(
            io.BytesIO(audio),
            language=lang_code,
            task="transcribe",
            beam_size=1,
            vad_filter=True,
            condition_on_previous_text=False,
        )
        text = " ".join(segment.text.strip() for segment in segments).strip()
        print(json.dumps({"text": text}), flush=True)
    except Exception as err:
        print(json.dumps({"error": str(err)}), flush=True)
