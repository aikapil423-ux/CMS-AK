import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { UniversalEvidenceRecord } from "@/types/evidence";

const EVIDENCE_STORE_PATH = path.join(process.cwd(), "prisma", "processed-evidence-store.json");
const STORAGE_ROOT = path.join(process.cwd(), "prisma", "storage", "evidence");
const ORIGINAL_STORAGE_DIR = path.join(STORAGE_ROOT, "original");
const COMPRESSED_STORAGE_DIR = path.join(STORAGE_ROOT, "compressed");

function readStore(): UniversalEvidenceRecord[] {
  try {
    if (fs.existsSync(EVIDENCE_STORE_PATH)) {
      return JSON.parse(fs.readFileSync(EVIDENCE_STORE_PATH, "utf-8"));
    }
  } catch {}
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const sha256 = searchParams.get("sha256");
    const type = (searchParams.get("type") || "original").toLowerCase(); // 'original' | 'compressed'

    if (!id && !sha256) {
      return NextResponse.json({ error: "Missing evidence id or sha256 hash parameter." }, { status: 400 });
    }

    const store = readStore();
    const record = store.find((r) => r.id === id || r.fileId === id || r.rawDocument?.sha256Hash === sha256);

    if (!record) {
      return NextResponse.json({ error: "Evidence record not found in system." }, { status: 404 });
    }

    const origFileName = record.rawDocument.fileName || "evidence_document.bin";
    const mimeType = record.rawDocument.mimeType || record.rawDocument.fileType || "application/octet-stream";
    const originalHash = record.rawDocument.sha256Hash || "";

    // 1. Authoritative Original Download
    if (type === "original" || !record.compression || record.compression.status !== "VERIFIED_LOSSLESS") {
      let origBuf: Buffer | null = null;

      // Check disk storage first
      if (originalHash) {
        const cleanName = origFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const diskPath = path.join(ORIGINAL_STORAGE_DIR, `${originalHash.substring(0, 16)}_${cleanName}`);
        if (fs.existsSync(diskPath)) {
          origBuf = fs.readFileSync(diskPath);
        }
      }

      // Check dataUrl
      if (!origBuf && record.rawDocument.dataUrl && record.rawDocument.dataUrl.includes(",")) {
        const b64 = record.rawDocument.dataUrl.split(",")[1];
        origBuf = Buffer.from(b64, "base64");
      }

      if (!origBuf) {
        return NextResponse.json({ error: "Original file content could not be located." }, { status: 404 });
      }

      return new NextResponse(new Uint8Array(origBuf), {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(origFileName)}"`,
          "Content-Length": origBuf.length.toString(),
          "X-Evidence-Type": "AUTHORITATIVE_ORIGINAL",
          "X-Evidence-SHA256": originalHash,
          "X-Evidence-Case": encodeURIComponent(record.caseNumber || record.caseId || "N/A"),
          "Cache-Control": "private, max-age=86400",
        },
      });
    }

    // 2. Verified Lossless Compressed Download
    const cleanName = origFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const compMethod = record.compression.compressionMethod;
    const compExt = compMethod === "SHARP_LOSSLESS_PNG" ? ".png" : compMethod === "SHARP_LOSSLESS_WEBP" ? ".webp" : ".br";
    const compDiskPath = path.join(COMPRESSED_STORAGE_DIR, `${originalHash.substring(0, 16)}_${cleanName}${compExt}`);

    let compBuf: Buffer | null = null;
    if (fs.existsSync(compDiskPath)) {
      compBuf = fs.readFileSync(compDiskPath);
    }

    if (!compBuf) {
      // Re-generate on the fly if needed
      let origBuf: Buffer | null = null;
      if (record.rawDocument.dataUrl && record.rawDocument.dataUrl.includes(",")) {
        origBuf = Buffer.from(record.rawDocument.dataUrl.split(",")[1], "base64");
      }
      if (origBuf) {
        compBuf = zlib.brotliCompressSync(origBuf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } });
      }
    }

    if (!compBuf) {
      return NextResponse.json({ error: "Lossless compressed copy not found." }, { status: 404 });
    }

    // Determine download filename and content type
    let downloadFileName = `${path.parse(origFileName).name}.lossless${compExt}`;
    let compMime = mimeType;
    if (compExt === ".br") compMime = "application/x-brotli";
    else if (compExt === ".webp") compMime = "image/webp";
    else if (compExt === ".png") compMime = "image/png";

    return new NextResponse(new Uint8Array(compBuf), {
      status: 200,
      headers: {
        "Content-Type": compMime,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFileName)}"`,
        "Content-Length": compBuf.length.toString(),
        "X-Evidence-Type": "VERIFIED_LOSSLESS_COMPRESSED",
        "X-Evidence-Original-SHA256": originalHash,
        "X-Evidence-Compressed-SHA256": record.compression.compressedSha256 || "",
        "X-Space-Saved-Percent": `${record.compression.savedPercentage}%`,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err: any) {
    console.error("[EvidenceDownloadAPI] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
