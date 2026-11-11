// src/app/api/telecom/route.ts
// Comprehensive Telecom Evidence & Forensic Intelligence Analysis API Endpoint (Phase 4)

import { NextRequest, NextResponse } from "next/server";
import { telecomAccess, validateTelecomReferences } from "@/services/telecomAccess";
import { apiAccess } from "@/lib/apiSecurity";
import { firService } from "@/services/firService";

import { TelecomCategory, TelecomOperator } from "@/types/telecom";

export async function GET(req: NextRequest) {
  try {
    const user = await apiAccess(req);
    if (user instanceof Response) return user;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const firId = searchParams.get("firId") || undefined;
    const { service: telecomService, firs: visibleFirs } = await telecomAccess(user, firId);
    const fileId = searchParams.get("fileId") || undefined;
    if (fileId && fileId !== "ALL" && !(await telecomService.getStore()).files.some(f => f.id === fileId)) return NextResponse.json({ error: "Evidence file not found" }, { status: 404 });
    const targetNumber = searchParams.get("targetNumber") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    // Sub-actions
    if (action === "first_last") {
      const numA = searchParams.get("numA") || "";
      const numB = searchParams.get("numB") || "";
      const result = await telecomService.getFirstLastContact(numA, numB, firId);
      return NextResponse.json({ success: true, result });
    }

    if (action === "gaps") {
      const gapHours = Number(searchParams.get("gapHours") ?? "24");
      if (!Number.isInteger(gapHours) || gapHours < 1 || gapHours > 8760) {
        return NextResponse.json({error:"Enter a minimum gap between 1 and 8760 hours."}, {status:400});
      }
      const numA = searchParams.get("numA") || undefined;
      const numB = searchParams.get("numB") || undefined;
      const gaps = await telecomService.getCommunicationGaps({
        gapHoursThreshold: gapHours,
        byContact: searchParams.get("byContact") === "true",
        numberA: numA,
        numberB: numB,
        firId,
      });
      return NextResponse.json({ success: true, gaps });
    }

    if (action === "spikes") {
      const multiplier = Number(searchParams.get("multiplier") ?? "2.5");
      if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 100) {
        return NextResponse.json({error:"Enter a multiplier between 1 and 100."}, {status:400});
      }
      const spikes = await telecomService.getSuddenActivitySpikes(firId, multiplier);
      return NextResponse.json({ success: true, spikes });
    }

    if (action === "reciprocal") {
      const numA = searchParams.get("numA") || "";
      const numB = searchParams.get("numB") || "";
      const result = await telecomService.getReciprocalAnalysis(numA, numB, firId);
      return NextResponse.json({ success: true, result });
    }

    if (action === "short_calls") {
      const maxSec = Number(searchParams.get("maxSec") ?? "30");
      if (!Number.isInteger(maxSec) || maxSec < 1 || maxSec > 3600) {
        return NextResponse.json({error:"Enter a duration between 1 and 3600 seconds."}, {status:400});
      }
      const calls = await telecomService.getShortDurationCalls(maxSec, firId);
      return NextResponse.json({ success: true, calls });
    }

    if (action === "sim_timeline") {
      const timeline = await telecomService.getSimChangeTimeline(firId);
      const store = await telecomService.getStore();
      const numbers = new Set(store.callRecords.filter(row => row.firId === firId)
        .flatMap(row => [row.sourceNumber,row.destinationNumber]));
      const mnpRecords = (store.mnpRecords || []).filter(record => numbers.has(record.msisdn));
      return NextResponse.json({ success: true, timeline, mnpRecords });
    }

    if (action === "cdr_ipdr_check") {
      if (!firId || firId === "ALL") return NextResponse.json({error:"Select one FIR."}, {status:400});
      const store = await telecomService.getStore();
      const excluded = new Set(store.files.filter(file=>file.isExcludedFromCalculations).map(file=>file.id));
      const voice = store.callRecords.some(row=>row.firId===firId && !row.isExcluded && !excluded.has(row.fileId)
        && (row.callType==="INCOMING" || row.callType==="OUTGOING") && row.durationSeconds>0);
      const sessions = store.ipdrRecords.some(row=>row.firId===firId && !excluded.has(row.fileId)
        && row.msisdn && Number.isFinite(Date.parse(row.sessionStart)));
      if (!voice || !sessions) {
        return NextResponse.json({error:"This check needs voice CDR records and IPDR sessions with subscriber numbers linked to the same FIR."},{status:400});
      }
      return NextResponse.json({success:true,report:await telecomService.getCdrIpdrConsistencyReport(firId)});
    }

    if (action === "data_quality") {
      const report = await telecomService.inspectDataQuality(fileId);
      return NextResponse.json({ success: true, report });
    }

    if (action === "reconciliation_summary") {
      const summary = await telecomService.runReconciliation(firId);
      return NextResponse.json({ success: true, summary });
    }

    if (action === "completeness") {
      const assessment = await telecomService.getEvidenceCompleteness(firId);
      return NextResponse.json({ success: true, assessment });
    }

    if (action === "timeline") {
      const timeline = await telecomService.getUnifiedTimeline(firId);
      return NextResponse.json({ success: true, timeline });
    }

    if (action === "before_after") {
      const eventId = searchParams.get("eventId") || "default";
      const windowMin = parseInt(searchParams.get("windowMinutes") || "60", 10);
      const comparison = await telecomService.getBeforeAfterComparison(firId || "ALL", eventId, windowMin);
      return NextResponse.json({ success: true, comparison });
    }

    if (action === "smart_search") {
      const q = searchParams.get("q") || "";
      const results = await telecomService.smartEvidenceSearch(firId || "ALL", q);
      return NextResponse.json({ success: true, results });
    }

    if (action === "report_validation") {
      const issues = await telecomService.validateReportQuality(firId || "ALL");
      return NextResponse.json({ success: true, issues });
    }

    // Default Full Master Payload
    const store = await telecomService.getStore();
    const cdrContacts = firId && firId !== "ALL"
      ? Object.fromEntries([...telecomService.getCdrTargetContacts(store, firId)]
        .map(([target, contacts]) => [target, [...contacts.keys()].sort()]))
      : {};
    const stats = await telecomService.getCdrStatistics({
      firId,
      fileId,
      targetNumber,
      dateFrom,
      dateTo,
    });

    const crossMatches = firId ? await telecomService.getCrossFirMatches(firId) : [];
    const simTimeline = await telecomService.getSimChangeTimeline(firId);
    const dataQuality = await telecomService.inspectDataQuality(fileId);
    const activitySpikes = await telecomService.getSuddenActivitySpikes(firId);
    const completeness = await telecomService.getEvidenceCompleteness(firId);
    const unifiedTimeline = await telecomService.getUnifiedTimeline(firId);
    const comparisonMatrix = await telecomService.getEvidenceComparisonMatrix(firId);
    const beforeAfter = await telecomService.getBeforeAfterComparison(firId || "ALL", "default", 60);

    // Phase 4 Payloads
    const effectiveFir = firId || "ALL";
    const hypotheses = await telecomService.getHypotheses(effectiveFir);
    const alternativeExpls = await telecomService.getAlternativeExplanations();
    const sourceReliability = await telecomService.getSourceReliabilityMatrix(effectiveFir);
    const consistencyReport = await telecomService.getCdrIpdrConsistencyReport(effectiveFir);
    const evidenceIndex = await telecomService.getEvidenceIndex(effectiveFir);
    const courtExhibits = await telecomService.getCourtExhibitPackages(effectiveFir);
    const aiContradictions = await telecomService.getAiContradictions(effectiveFir);
    const aiVerifications = await telecomService.getAiAnalysisVerifications(effectiveFir);
    const reviewQuestions = await telecomService.getReviewQuestions(effectiveFir);
    const reportValidationIssues = await telecomService.validateReportQuality(effectiveFir);
    const evidenceCertificates = await telecomService.getEvidenceCertificates(effectiveFir);
    const disclosureLogs = await telecomService.getDisclosureLogs(effectiveFir);
    const courtQueries = await telecomService.getCourtQueries(effectiveFir);
    const dualApprovals = await telecomService.getTwoPersonApprovals(effectiveFir);
    const knowledgeBase = await telecomService.getKnowledgeBase();
    const methodRegistry = await telecomService.getMethodRegistry();
    const qcDashboard = await telecomService.getQualityControlDashboard(effectiveFir);

    const allFirs = visibleFirs.map((f) => ({
      id: f.id,
      firNumber: f.firNumber,
      policeStation: f.policeStation,
      district: f.district,
      firDate: f.firDate,
      complainantName: f.complainantName,
      assignedIoName: f.assignedIoName,
      status: f.status,
    }));

    return NextResponse.json({
      success: true,
      files: store.files,
      stats,
      cdrContacts,
      crossMatches,
      simTimeline,
      dataQuality,
      activitySpikes,
      towers: store.towers,
      ipdrCount: store.ipdrRecords.length,
      towerDumpCount: store.towerDumpRecords.length,
      subscriberCount: store.subscribers.length,
      events: store.investigationEvents,
      savedFindings: store.savedFindings,
      statementChecks: store.statementChecks,
      reconciliations: store.reconciliations || [],
      mnpRecords: store.mnpRecords || [],
      contactAliases: store.contactAliases || [],
      evidenceRequests: (store.evidenceRequests || []).filter(r => !firId || firId === "ALL" || r.firId === firId),
      reviewChecklists: (store.reviewChecklists || []).filter(c => !firId || firId === "ALL" || c.firId === firId),
      customTableLayouts: store.customTableLayouts || [],
      investigationNotes: (store.investigationNotes || []).filter(n => !firId || firId === "ALL" || n.firId === firId),
      investigationBoards: (store.investigationBoards || []).filter(b => !firId || firId === "ALL" || b.firId === firId),
      savedViews: store.savedViews || [],
      supervisorWorkflows: (store.supervisorWorkflows || []).filter(w => !firId || firId === "ALL" || w.firId === firId),
      handoverRecords: (store.handoverRecords || []).filter(h => !firId || firId === "ALL" || h.firId === firId),
      reportVersions: (store.reportVersions || []).filter(r => !firId || firId === "ALL" || r.firId === firId),
      offlinePackages: (store.offlinePackages || []).filter(p => !firId || firId === "ALL" || p.firId === firId),
      retentionPolicy: await telecomService.getDataRetentionPolicy(effectiveFir),
      completeness,
      unifiedTimeline,
      comparisonMatrix,
      beforeAfter,
      // Phase 4 Collections
      hypotheses,
      alternativeExpls,
      sourceReliability,
      consistencyReport,
      evidenceIndex,
      courtExhibits,
      aiContradictions,
      aiVerifications,
      reviewQuestions,
      reportValidationIssues,
      evidenceCertificates,
      disclosureLogs,
      courtQueries,
      dualApprovals,
      knowledgeBase,
      methodRegistry,
      qcDashboard,
      firs: allFirs,
      currentUser: user?.name || "Authorized Officer",
    });
  } catch (error: any) {
    console.error("[Telecom API GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch telecom intelligence" },
      { status: error.message?.startsWith("Access denied") ? 403 : 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await apiAccess(req);
    if (user instanceof Response) return user;
    const body = await req.json();
    const action = body.action;
    const requestedFir = body.firId || body.finding?.firId || body.hypothesis?.firId || body.exhibit?.firId || body.query?.firId || body.disclosure?.firId || body.qc?.firId || body.record?.firId || body.alias?.firId || body.request?.firId || body.note?.firId || body.board?.firId || body.view?.firId || body.handover?.firId || body.package?.firId || body.policy?.firId;
    const { service: telecomService, firs:visibleFirs } = await telecomAccess(user, requestedFir);
    await validateTelecomReferences(telecomService, body);
    if (["dual_approval_process", "supervisor_update", "retention_update", "handover_perform"].includes(action) && !["SUPER_ADMIN", "SHO", "DSP_SUBDIV", "SP_DISTRICT", "ASP_HQ"].includes(user.role)) return NextResponse.json({ error: "Supervisor role required" }, { status: 403 });

    // Phase 4 Handlers
    if (action === "save_first_last") {
      const fir = visibleFirs.find(item => item.id === body.firId);
      if (!fir || typeof body.numA !== "string" || typeof body.numB !== "string" || body.numA === body.numB) {
        return NextResponse.json({error:"Select one FIR, its CDR target, and a recorded contact."}, {status:400});
      }
      const processed = await telecomService.analyzeAndSaveCdrContact(
        fir.id, fir.firNumber, body.numA, body.numB, user.name || user.id
      );
      return NextResponse.json({success:true, ...processed});
    }
    if (action === "run_auto_analysis") {
      const result = await telecomService.runAutoAnalysis(body.firId);
      const { PROCESSING_MODEL, processWithAI } = await import("@/lib/openRouter");
      const { totalCalls, incomingCalls, outgoingCalls, smsIncoming, smsOutgoing, daytimeCalls, nighttimeCalls, uniqueContactedNumbers } = result.stats;
      const aggregates = {
        totalCalls, incomingCalls, outgoingCalls, smsIncoming, smsOutgoing, daytimeCalls, nighttimeCalls, uniqueContactedNumbers,
        activitySpikes: result.spikes.length,
        savedFindings: result.findingsCreated,
      };
      try {
        const aiAnalysis = await processWithAI([{ text: `Write a short telecom analysis for investigator review from these aggregate counts. Describe observable patterns and limitations. Do not infer identities, intent, guilt or that any activity is suspicious from timing or volume alone. Do not fabricate dates or source records. Aggregate counts: ${JSON.stringify(aggregates)}` }], { maxTokens: 4096, timeout: 60000 });
        return NextResponse.json({ success: true, ...result, aiAnalysis, modelUsed: PROCESSING_MODEL });
      } catch {
        return NextResponse.json({ success: true, ...result, aiAnalysisError: "Telecom calculations were saved. GLM analysis is currently unavailable." });
      }
    }

    if (action === "hypothesis_save") {
      const hypo = await telecomService.saveHypothesis({
        ...body.hypothesis,
        createdBy: user?.name || "IO",
      });
      return NextResponse.json({ success: true, hypothesis: hypo });
    }

    if (action === "exhibit_save") {
      const exhibit = await telecomService.createOrUpdateExhibitPackage({
        ...body.exhibit,
        preparedBy: user?.name || "IO",
      });
      return NextResponse.json({ success: true, exhibit });
    }

    if (action === "reproduce_run") {
      const run = await telecomService.reproduceAnalysis(
        body.findingId,
        user?.name || "IO"
      );
      return NextResponse.json({ success: true, run });
    }

    if (action === "question_answer") {
      const question = await telecomService.answerReviewQuestion(
        body.firId,
        body.questionId,
        body.status,
        body.notes
      );
      return NextResponse.json({ success: true, question });
    }

    if (action === "certificate_generate") {
      const cert = await telecomService.generateSection63BsaCertificate({
        firId: body.firId,
        evidenceFileIds: body.evidenceFileIds || [],
        signatoryName: body.signatoryName || user?.name || "Authorized Nodal Officer",
        signatoryDesignation: body.signatoryDesignation || "Nodal Authority",
        signatoryOrganization: body.signatoryOrganization || "Telecom Service Provider",
      });
      return NextResponse.json({ success: true, certificate: cert });
    }

    if (action === "disclosure_log") {
      const log = await telecomService.logEvidenceDisclosure({
        ...body.disclosure,
        disclosedBy: user?.name || "IO",
      });
      return NextResponse.json({ success: true, log });
    }

    if (action === "court_query_save") {
      const query = await telecomService.saveCourtQueryResponse({
        ...body.query,
        assignedOfficer: user?.name || "IO",
      });
      return NextResponse.json({ success: true, query });
    }

    if (action === "dual_approval_process") {
      const approval = await telecomService.processDualApproval({
        firId: body.firId,
        actionType: body.actionType,
        targetId: body.targetId,
        approverName: `${user.id} (${user.name})`,
      });
      return NextResponse.json({ success: true, approval });
    }

    if (action === "qc_update") {
      const qc = await telecomService.updateQualityControlChecklist({
        ...body.qc,
        updatedBy: user?.name || "IO",
      });
      return NextResponse.json({ success: true, qc });
    }

    // Existing Actions
    if (action === "reconcile_run") {
      if (!requestedFir || requestedFir === "ALL") return NextResponse.json({error:"Select one FIR."}, {status:400});
      const summary = await telecomService.runReconciliation(requestedFir,true);
      return NextResponse.json({ success: true, summary });
    }

    if (action === "reconcile_update") {
      const item = await telecomService.updateReconciliationMatch(
        body.matchId,
        body.status,
        body.notes,
        user?.name || "IO"
      );
      return NextResponse.json({ success: true, item });
    }

    if (action === "mnp_add") {
      const record = await telecomService.addMnpRecord({
        ...body.record,
        recordedBy: user?.name || "IO",
      });
      return NextResponse.json({ success: true, record });
    }

    if (action === "alias_add") {
      const alias = await telecomService.addOrUpdateContactAlias({
        ...body.alias,
        createdBy: user?.name || "IO",
      });
      return NextResponse.json({ success: true, alias });
    }

    if (action === "alias_delete") {
      const deleted = await telecomService.deleteContactAlias(body.id);
      return NextResponse.json({ success: true, deleted });
    }

    if (action === "request_save") {
      const request = await telecomService.createOrUpdateTelecomRequest({
        ...body.request,
        requestedBy: user?.name || "IO",
      });
      return NextResponse.json({ success: true, request });
    }

    if (action === "checklist_update") {
      const items = await telecomService.updateChecklistItem(
        body.firId,
        body.key,
        body.isCompleted,
        user?.name || "IO",
        body.remarks
      );
      return NextResponse.json({ success: true, items });
    }

    if (action === "note_save") {
      const note = await telecomService.saveInvestigationNote({
        ...body.note,
        author: user?.name || "IO",
      });
      return NextResponse.json({ success: true, note });
    }

    if (action === "note_delete") {
      const deleted = await telecomService.deleteInvestigationNote(body.id);
      return NextResponse.json({ success: true, deleted });
    }

    if (action === "board_save") {
      const board = await telecomService.saveInvestigationBoard({
        ...body.board,
        savedBy: user?.name || "IO",
      });
      return NextResponse.json({ success: true, board });
    }

    if (action === "view_save") {
      const view = await telecomService.saveAnalysisView({
        ...body.view,
        createdBy: user?.name || "IO",
      });
      return NextResponse.json({ success: true, view });
    }

    if (action === "supervisor_update") {
      const wf = await telecomService.updateSupervisorWorkflow(
        body.firId,
        body.status,
        body.comment ? {
          ...body.comment,
          author: user?.name || "SHO",
          role: user?.role || "SHO",
        } : undefined
      );
      return NextResponse.json({ success: true, wf });
    }

    if (action === "handover_perform") {
      const handover = await telecomService.performInvestigationHandover(body.handover);
      return NextResponse.json({ success: true, handover });
    }

    if (action === "report_version_save") {
      const version = await telecomService.saveReportVersion(
        body.firId,
        body.title,
        body.contentHtml,
        user?.name || "IO",
        body.sourceDatasets || []
      );
      return NextResponse.json({ success: true, version });
    }

    if (action === "offline_package_generate") {
      const pkg = await telecomService.generateOfflineEvidencePackage({
        ...body.package,
        generatedBy: user?.name || "IO",
      });
      return NextResponse.json({ success: true, pkg });
    }

    if (action === "retention_update") {
      const policy = await telecomService.updateDataRetentionPolicy(body.policy);
      return NextResponse.json({ success: true, policy });
    }

    if (action === "toggle_exclude") {
      const updated = await telecomService.toggleExcludeRecord(body.recordId, body.isExcluded);
      return NextResponse.json({ success: true, updated });
    }

    if (action === "ai_query") {
      const plan = await telecomService.executeAiNaturalLanguageQuery(body.queryText, body.firId);
      return NextResponse.json({ success: true, plan });
    }

    if (action === "check_statement") {
      const result = await telecomService.checkStatementConsistency({
        statementText: body.statementText,
        witnessOrAccusedName: body.witnessOrAccusedName || "Witness",
        claimedDate: body.claimedDate,
        claimedTime: body.claimedTime,
        claimedTargetNumber: body.claimedTargetNumber,
        firId: body.firId,
      });
      return NextResponse.json({ success: true, result });
    }

    if (action === "save_finding") {
      const finding = await telecomService.saveFinding({
        ...body.finding,
        savedBy: user?.name || "IO",
      });
      return NextResponse.json({ success: true, finding });
    }

    // Standard File Upload Fallback
    const {
      fileName,
      base64Data,
      category = "CDR",
      operator = "AIRTEL",
      firId,
      firNumber,
      sourceReference,
      notes,
      columnMapping,
    } = body;

    if (!firId || firId === "ALL") return NextResponse.json({ error: "Select one FIR for the evidence upload" }, { status: 400 });
    if (!fileName || !base64Data) {
      return NextResponse.json(
        { success: false, error: "Missing required file content or filename." },
        { status: 400 }
      );
    }

    const base64Clean = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const buffer = Buffer.from(base64Clean, "base64");
    const uploadedBy = user?.name ? `${user.name} (${user.role})` : "Authorized Officer";

    let effectiveFirNumber = firNumber;
    if (firId) {
      const found = firService.getFirById(firId);
      if (found) effectiveFirNumber = found.firNumber;
    }

    const result = await telecomService.uploadAndProcessFile({
      fileBuffer: buffer,
      fileName,
      category: category as TelecomCategory,
      operator: operator as TelecomOperator,
      firId: firId && firId !== "ALL" ? firId : undefined,
      firNumber: effectiveFirNumber,
      uploadedBy,
      sourceReference,
      notes,
      columnMapping,
    });

    return NextResponse.json({
      success: true,
      file: result.file,
      recordCount: result.recordCount,
      message: `File processed successfully. ${result.recordCount} records normalized.`,
    });
  } catch (error: any) {
    console.error("[Telecom API POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process telecom operation" },
      { status: error.message?.startsWith("Access denied") ? 403 : 400 }
    );
  }
}
