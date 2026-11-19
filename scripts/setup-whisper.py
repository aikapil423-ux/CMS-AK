import hashlib
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import venv
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ENVIRONMENT = ROOT / ".whisper"
MODEL = ENVIRONMENT / "model"
REVISION = "0a363e9161cbc7ed1431c9597a8ceaf0c4f78fcf"
TAG = f"whisper-large-v3-turbo-{REVISION[:7]}"
REPOSITORIES = ("haryana-police/smart-CMS", "aikapil423-ux/CMS-AK")
REQUIREMENTS = (
    "faster-whisper==1.2.1",
    "ctranslate2==4.6.0",
    "av==15.1.0",
    "setuptools==80.9.0",
)
CHECKSUMS = {
    "config.json": "b0253ea6c0d3bea6b1e19e91a02acfd3b53f4467362efcb5a3e6b16c9b3a9b7e",
    "model.bin": "e76620f83d5f5b69efd3d87e3dc180c1bd21df9fbebacfd4335e5e1efcc018da",
    "tokenizer.json": "297b13372ac43916285644fb9687add3cc62ee2a1adb60da3dc25cc94c1871fd",
    "preprocessor_config.json": "7ccc62c6f2765af1f3b46c00c9b5894426835a05021c8b9c01eecb6dfb542711",
    "vocabulary.json": "c69260f2ab26d659b7c398f9a2b2b48ed0df16c3b47d7326782fd9cba71690c1",
}


def model_matches(directory):
    for name, expected in CHECKSUMS.items():
        file = directory / name
        if not file.is_file():
            return False
        with file.open("rb") as source:
            if hashlib.file_digest(source, "sha256").hexdigest() != expected:
                return False
    return True


def install_runtime():
    python = ENVIRONMENT / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    if not python.is_file():
        venv.create(ENVIRONMENT, with_pip=True)
    marker = ENVIRONMENT / "requirements-installed.txt"
    requirements = "\n".join(REQUIREMENTS)
    if not marker.is_file() or marker.read_text(encoding="utf-8") != requirements:
        subprocess.run([str(python), "-m", "pip", "install", *REQUIREMENTS], check=True)
        marker.write_text(requirements, encoding="utf-8")
    return python


def install_model(python):
    if model_matches(MODEL):
        return

    with tempfile.TemporaryDirectory(prefix="model-download-", dir=ENVIRONMENT) as temporary:
        staging = Path(temporary)
        archive = staging / "whisper.zip"
        for repository in REPOSITORIES:
            url = f"https://github.com/{repository}/releases/download/{TAG}/{TAG}.zip"
            print(f"Downloading Whisper Large-v3 Turbo from {repository}…", flush=True)
            try:
                with urllib.request.urlopen(url, timeout=60) as response, archive.open("wb") as output:
                    shutil.copyfileobj(response, output, length=1024 * 1024)
                with zipfile.ZipFile(archive) as bundle:
                    for name in CHECKSUMS:
                        with bundle.open(name) as source, (staging / name).open("wb") as output:
                            shutil.copyfileobj(source, output, length=1024 * 1024)
                if not model_matches(staging):
                    raise ValueError("Model checksum mismatch")
                break
            except (OSError, ValueError, KeyError, zipfile.BadZipFile) as error:
                print(f"Whisper release download failed: {error}", file=sys.stderr)
            finally:
                archive.unlink(missing_ok=True)
        else:
            print("Downloading the pinned Whisper revision from Hugging Face…", flush=True)
            with tempfile.TemporaryDirectory(dir=staging) as fallback:
                subprocess.run([
                    str(python), "-c",
                    "import sys; from huggingface_hub import snapshot_download; "
                    "snapshot_download(sys.argv[1], revision=sys.argv[2], "
                    "local_dir=sys.argv[3], allow_patterns=sys.argv[4:])",
                    "dropbox-dash/faster-whisper-large-v3-turbo", REVISION, fallback, *CHECKSUMS,
                ], check=True)
                if not model_matches(Path(fallback)):
                    raise ValueError("Pinned Whisper model checksum mismatch")
                for name in CHECKSUMS:
                    (Path(fallback) / name).replace(staging / name)

        MODEL.mkdir(parents=True, exist_ok=True)
        for name in CHECKSUMS:
            (staging / name).replace(MODEL / name)


if __name__ == "__main__":
    install_model(install_runtime())
    print(f"Whisper Large-v3 Turbo ({REVISION[:7]}) is ready.")
