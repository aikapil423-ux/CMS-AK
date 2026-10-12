import { NextRequest, NextResponse } from "next/server";
import { CmsCapabilityRegistry } from "@/services/agent/cmsCapabilityRegistry";
import { CmsAgentService } from "@/services/agent/cmsAgentService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "PROCESS_MESSAGE";

    if (action === "GET_CAPABILITIES") {
      const capabilities = CmsCapabilityRegistry.getAll();
      return NextResponse.json({ success: true, capabilities });
    }

    if (action === "GET_CONTEXT") {
      const context = CmsAgentService.getContext();
      return NextResponse.json({ success: true, context });
    }

    if (action === "EXECUTE_PLAN") {
      const planId = String(body.planId || "");
      if (!planId) {
        return NextResponse.json({ success: false, error: "Plan ID is required" }, { status: 400 });
      }
      const resultMessage = await CmsAgentService.executeActionPlan(planId);
      return NextResponse.json({ success: true, message: resultMessage });
    }

    if (action === "PROCESS_MESSAGE") {
      const userInput = String(body.text || body.message || "");
      const currentPath = body.currentPath ? String(body.currentPath) : undefined;
      const attachments = Array.isArray(body.attachments) ? body.attachments : [];

      const agentResponse = await CmsAgentService.processUserInput(userInput, currentPath, attachments);
      return NextResponse.json({ success: true, message: agentResponse });
    }

    return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
  } catch (error: any) {
    console.error("CMS Agent API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process AI request" },
      { status: 500 }
    );
  }
}
