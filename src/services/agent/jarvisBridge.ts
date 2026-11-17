/**
 * Solo CMS Agent Voice Bridge (Legacy Jarvis Shim)
 * Redirects all calls to the browser-native CmsVoiceEngine.
 * Eliminates all external Python and WebSocket dependencies.
 */

import { CmsVoiceEngine, CmsVoiceStatus } from "./cmsVoiceEngine";
import { OperatorAction, WebsiteSnapshot, LiveWebsiteBridge } from "./websiteOperator";
import { DynamicModuleRegistry } from "./dynamicModuleRegistry";

export interface JarvisMessage {
  type: "identify" | "command" | "action" | "snapshot_request" | "legal_lookup" | "approval" | "ping";
  id?: string;
  commandText?: string;
  action?: OperatorAction;
  approved?: boolean;
  sectionQuery?: string;
  payload?: any;
}

export interface JarvisResponse {
  type: "identify_ack" | "command_result" | "action_result" | "snapshot" | "legal_result" | "error" | "pong";
  id?: string;
  success: boolean;
  message: string;
  speakText?: string;
  snapshot?: WebsiteSnapshot;
  availableModules?: Array<{ id: string; title: string; path: string; category: string }>;
  routes?: Array<{ path: string; title: string }>;
  data?: any;
}

export type JarvisStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "LISTENING" | "SPEAKING" | "ERROR";

type StatusListener = (status: JarvisStatus, info?: string) => void;
type CommandHandler = (command: string) => Promise<string>;
type ActionHandler = (action: OperatorAction, approved?: boolean) => Promise<string>;
type NavigationHandler = (path: string) => void;

class JarvisBridgeClass {
  private liveBridge = new LiveWebsiteBridge();
  private commandHandler: CommandHandler | null = null;
  private actionHandler: ActionHandler | null = null;
  private navigationHandler: NavigationHandler | null = null;
  private statusListeners: Set<StatusListener> = new Set();

  constructor() {
    // Forward CmsVoiceEngine status changes
    if (typeof window !== "undefined") {
      CmsVoiceEngine.subscribeStatus((cmsStatus, info) => {
        const mappedStatus = this.mapCmsStatus(cmsStatus);
        this.statusListeners.forEach((l) => l(mappedStatus, info));
      });
    }
  }

  private mapCmsStatus(status: CmsVoiceStatus): JarvisStatus {
    switch (status) {
      case "SPEAKING":
        return "SPEAKING";
      case "LISTENING":
      case "PLANNING":
      case "EXECUTING":
        return "LISTENING";
      case "STANDBY":
        return "CONNECTED";
      case "OFF":
        return "DISCONNECTED";
      case "ERROR":
        return "ERROR";
      default:
        return "CONNECTED";
    }
  }

  public setHandlers(handlers: {
    onCommand?: CommandHandler;
    onAction?: ActionHandler;
    onNavigate?: NavigationHandler;
  }): void {
    if (handlers.onCommand) {
      this.commandHandler = handlers.onCommand;
      CmsVoiceEngine.setCommandCallback(handlers.onCommand);
    }
    if (handlers.onAction) this.actionHandler = handlers.onAction;
    if (handlers.onNavigate) {
      this.navigationHandler = handlers.onNavigate;
      CmsVoiceEngine.setNavigationHandler(handlers.onNavigate);
    }
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.mapCmsStatus(CmsVoiceEngine.getStatus()));
    return () => this.statusListeners.delete(listener);
  }

  public getStatus(): JarvisStatus {
    return this.mapCmsStatus(CmsVoiceEngine.getStatus());
  }

  public isConnected(): boolean {
    return CmsVoiceEngine.isEnabled();
  }

  public isEnabled(): boolean {
    return CmsVoiceEngine.isEnabled();
  }

  public setEnabled(enabled: boolean): void {
    CmsVoiceEngine.setEnabled(enabled);
  }

  public connect(url?: string): void {
    // Native engine: start continuous listening directly
    CmsVoiceEngine.setEnabled(true);
    CmsVoiceEngine.startContinuousListening();
  }

  public disconnect(): void {
    CmsVoiceEngine.setEnabled(false);
  }

  public send(response: JarvisResponse): void {
    // Local in-memory pass-through
    if (response.speakText) {
      void CmsVoiceEngine.speak(response.speakText);
    }
  }

  public async broadcastEvent(eventType: string, payload: any): Promise<void> {
    // Local pass-through
  }
}

export const JarvisBridge = new JarvisBridgeClass();
