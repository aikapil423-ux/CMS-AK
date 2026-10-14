import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { losslessCompressionService } from "@/services/losslessCompressionService";
import { UniversalEvidenceRecord } from "@/types/evidence";

const EVIDENCE_STORE_PATH = path.join(process.cwd(), "prisma", "processed-evidence-store.json");

export async function GET() {
  try {
    const stats = losslessCompressionService.getStorageOptimizationStats();

    // Read all records to return lightweight list for table view
    let recordsList: any[] = [];
    if (fs.existsSync(EVIDENCE_STORE_PATH)) {
      const raw = fs.readFileSync(EVIDENCE_STORE_PATH, "utf-8");
      const records: UniversalEvidenceRecord[] = JSON.parse(raw);
      recordsList = records.map((r) => ({
        id: r.id,
        fileId: r.fileId,
        caseId: r.caseId || null,
        caseNumber: r.caseNumber || "Unassigned",
        module: r.module,
        fileName: r.rawDocument.fileName,
        fileType: r.rawDocument.fileType,
        originalSizeBytes: r.rawDocument.fileSize,
        originalSha256: r.rawDocument.sha256Hash || "",
        uploadedAt: r.rawDocument.uploadedAt,
        uploadedBy: r.rawDocument.uploadedBy,
        compression: r.compression || {
          status: "PENDING_VERIFICATION",
          originalSizeBytes: r.rawDocument.fileSize,
          compressedSizeBytes: r.rawDocument.fileSize,
          savedBytes: 0,
          savedPercentage: 0,
          verifiedLossless: false,
          compressionMethod: "NONE_RETAINED",
        },
      }));
    }

    return NextResponse.json({
      success: true,
      stats,
      records: recordsList,
    });
  } catch (err: any) {
    console.error("[EvidenceCompressAPI] GET Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { recordId, batch, force } = body;

    if (batch) {
      // Trigger system-wide batch compression
      const batchResult = await losslessCompressionService.batchProcessAll(Boolean(force));
      const updatedStats = losslessCompressionService.getStorageOptimizationStats();

      return NextResponse.json({
        success: true,
        message: `Batch compression complete. Processed: ${batchResult.processed}, Verified: ${batchResult.verifiedLossless}, Retained: ${batchResult.originalRetained}, Failed: ${batchResult.failed}`,
        batchResult,
        stats: updatedStats,
      });
    }

    if (recordId) {
      const updatedRecord = await losslessCompressionService.compressEvidenceRecord(recordId);
      if (!updatedRecord) {
        return NextResponse.json(
          { success: false, error: `Evidence record ${recordId} not found or has no valid file content.` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        record: updatedRecord,
        compression: updatedRecord.compression,
      });
    }

    return NextResponse.json(
      { success: false, error: "Please provide either recordId or batch: true in the request body." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[EvidenceCompressAPI] POST Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
