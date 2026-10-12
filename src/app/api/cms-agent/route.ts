import { NextRequest, NextResponse } from "next/server";
import { CmsCapabilityRegistry } from "@/services/agent/cmsCapabilityRegistry";
import { CmsAgentService } from "@/services/agent/cmsAgentService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "PROCESS_MESSAGE";

    if (action === "GET_CAPABILITIES" || action === "GET_APPLICATION_CAPABILITIES") {
      const capabilities = CmsCapabilityRegistry.getAll();
      const summary = CmsAgentService.getApplicationCapabilities();
      return NextResponse.json({ success: true, capabilities, summary });
    }

    if (action === "UNDERSTAND_PAGE_SCHEMA") {
      const schema = CmsAgentService.understandPageSchema(body.path || "/");
      return NextResponse.json({ success: true, schema });
    }

    if (action === "GET_FIELD_METADATA") {
      const field = CmsAgentService.getFieldMetadata(body.fieldId || "");
      return NextResponse.json({ success: true, field });
    }

    if (action === "GET_ACTION_METADATA") {
      const actionMeta = CmsAgentService.getActionMetadata(body.actionId || "");
      return NextResponse.json({ success: true, action: actionMeta });
    }

    if (action === "SEARCH_RECORDS") {
      const records = await CmsAgentService.searchAuthorisedRecords(body.module || "complaints", body.query || "", body.filters);
      return NextResponse.json({ success: true, records });
    }

    if (action === "GET_CONTEXT") {
      const context = CmsAgentService.getContext();
      const uiContext = CmsAgentService.getCurrentUIContext(body.currentPath);
      return NextResponse.json({ success: true, context, uiContext });
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
