import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const python = process.env.WHISPER_SETUP_PYTHON || (process.platform === "win32" ? "python" : "python3");
const script = fileURLToPath(new URL("./setup-whisper.py", import.meta.url));
const result = spawnSync(python, [script], { stdio: "inherit", windowsHide: true });

if (result.error) {
  console.error("Whisper setup requires Python 3.12 with venv support.", result.error.message);
}
process.exitCode = result.status ?? 1;
