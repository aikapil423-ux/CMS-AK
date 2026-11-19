import io
import json
import os
import sys

# Node for Windows ships the Microsoft runtime DLLs used by CTranslate2.
node_dlls = os.add_dll_directory(sys.argv[2]) if sys.platform == "win32" else None
from faster_whisper import WhisperModel


model = WhisperModel(sys.argv[1], device="cpu", compute_type="int8", local_files_only=True)
stream = sys.stdin.buffer
while header := stream.readline():
    language, length = header.decode("ascii").split()
    audio = stream.read(int(length))
    if len(audio) != int(length):
        break
    try:
        segments, _ = model.transcribe(
            io.BytesIO(audio),
            language=language,
            task="transcribe",
            beam_size=1,
            vad_filter=True,
            condition_on_previous_text=False,
        )
        print(json.dumps({"text": " ".join(segment.text.strip() for segment in segments).strip()}), flush=True)
    except (ValueError, EOFError, OSError):
        print(json.dumps({"error": "The recording could not be decoded."}), flush=True)
