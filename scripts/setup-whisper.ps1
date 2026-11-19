$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    if (!(Test-Path -LiteralPath '.whisper/Scripts/python.exe')) {
        python -m venv .whisper
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the Whisper environment.' }
    }
    & .whisper/Scripts/python.exe -m pip install faster-whisper==1.2.1 ctranslate2==4.6.0 av==15.1.0 setuptools==80.9.0
    if ($LASTEXITCODE -ne 0) { throw 'Could not install faster-whisper.' }
    & .whisper/Scripts/python.exe -c "from huggingface_hub import snapshot_download; print(snapshot_download('dropbox-dash/faster-whisper-large-v3-turbo', revision='0a363e9161cbc7ed1431c9597a8ceaf0c4f78fcf', local_dir='.whisper/model', allow_patterns=['config.json','model.bin','tokenizer.json','preprocessor_config.json','vocabulary.json']))"
    if ($LASTEXITCODE -ne 0) { throw 'Could not download Whisper Large-v3 Turbo.' }
} finally {
    Pop-Location
}
