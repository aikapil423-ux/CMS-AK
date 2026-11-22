import io
import json
import os
import sys
import torch
import av
import numpy as np
from transformers import AutoModel
from hindi_itn import apply_hindi_itn

# Resolve HF Token from environment
token = os.environ.get("HF_TOKEN")
device = "cuda" if torch.cuda.is_available() else "cpu"

try:
    model = AutoModel.from_pretrained(
        "ARTPARK-IISc/SraVaani-1.0",
        trust_remote_code=True,
        token=token,
        local_files_only=True,
    ).to(device).eval()
except Exception:
    # If local cache lookup needs online token verification
    model = AutoModel.from_pretrained(
        "ARTPARK-IISc/SraVaani-1.0",
        trust_remote_code=True,
        token=token,
    ).to(device).eval()

def decode_audio_bytes(raw_bytes: bytes):
    try:
        container = av.open(io.BytesIO(raw_bytes))
        resampler = av.AudioResampler(format="fltp", layout="mono", rate=16000)
        frames = []
        for frame in container.decode(audio=0):
            for resampled in resampler.resample(frame):
                frames.append(resampled.to_ndarray())
        if not frames:
            return None
        audio = np.concatenate(frames, axis=1).squeeze(0)
        return torch.from_numpy(audio).float()
    except Exception:
        return None

stream = sys.stdin.buffer
while header := stream.readline():
    parts = header.decode("ascii").split()
    if len(parts) < 2:
        break
    language, length = parts[0], int(parts[1])
    audio_data = stream.read(length)
    if len(audio_data) != length:
        break

    try:
        waveform = decode_audio_bytes(audio_data)
        if waveform is None or waveform.shape[0] == 0:
            print(json.dumps({"text": ""}), flush=True)
            continue

        results = model.transcribe([waveform])
        raw_text = results[0] if results and isinstance(results[0], str) else ""
        formatted_text = apply_hindi_itn(raw_text.strip()) if language.startswith("hi") else raw_text.strip()
        print(json.dumps({"text": formatted_text}), flush=True)
    except Exception as e:
        print(json.dumps({"error": f"SraVaani transcription error: {str(e)}"}), flush=True)
