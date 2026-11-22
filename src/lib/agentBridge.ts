/**
 * Optional Parth / Jarvis desktop bridge (the local `127.0.0.1:8000` service that
 * some officers run beside the CMS for voice + page-context hand-off).
 *
 * The URL used to be hardcoded, so every deployed build fired requests at the
 * visitor's own machine — two dead calls per page and console noise on the
 * station server. The bridge is now opt-in: set
 *   NEXT_PUBLIC_CMS_AGENT_BRIDGE=http://127.0.0.1:8000
 * at build time to switch it back on.
 */
const rawBase = (process.env.NEXT_PUBLIC_CMS_AGENT_BRIDGE ?? "").trim();

export const agentBridgeBase = rawBase.replace(/\/+$/, "");
export const agentBridgeEnabled = agentBridgeBase.length > 0;

export function agentBridgeHttp(path: string): string {
  return agentBridgeEnabled ? `${agentBridgeBase}${path}` : "";
}

export function agentBridgeWs(path: string): string {
  if (!agentBridgeEnabled) return "";
  return `${agentBridgeBase.replace(/^http/i, "ws")}${path}`;
}
