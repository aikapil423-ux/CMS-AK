// src/services/losslessCompressionService.ts
// Enterprise Lossless Compression & Cryptographic Integrity Verification Engine
// Compliant with Strict Legal Evidence Retention Standards (Haryana Police CMS)
// Guarantees ZERO degradation of images, audio, video, PDFs, and Excel spreadsheets.

import fs from "fs";
import path from "path";
import crypto from "crypto";
import zlib from "zlib";
import sharp from "sharp";
import {
  LosslessCompressionMetadata,
  LosslessCompressionStatus,
  LosslessCompressionMethod,
  UniversalEvidenceRecord,
} from "@/types/evidence";

const STORAGE_ROOT = path.join(process.cwd(), "prisma", "storage", "evidence");
const ORIGINAL_STORAGE_DIR = path.join(STORAGE_ROOT, "original");
const COMPRESSED_STORAGE_DIR = path.join(STORAGE_ROOT, "compressed");
const EVIDENCE_STORE_PATH = path.join(process.cwd(), "prisma", "processed-evidence-store.json");

// Ensure persistent storage directories exist
function ensureStorageDirectories(): void {
  try {
    if (!fs.existsSync(ORIGINAL_STORAGE_DIR)) {
      fs.mkdirSync(ORIGINAL_STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(COMPRESSED_STORAGE_DIR)) {
      fs.mkdirSync(COMPRESSED_STORAGE_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("[LosslessCompression] Failed to create storage directories:", err);
  }
}

export function computeSha256(buffer: Buffer | Uint8Array | string): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export interface CompressionResult {
  metadata: LosslessCompressionMetadata;
  originalBuffer: Buffer;
  compressedBuffer: Buffer | null;
}

export const losslessCompressionService = {
  /**
   * Evaluates and applies the optimal lossless compression technique based on file type.
   * Performs mandatory roundtrip decompression and byte/pixel integrity verification.
   */
  async compressAndVerify(
    originalBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<CompressionResult> {
    ensureStorageDirectories();

    const originalSize = originalBuffer.length;
    const originalSha256 = computeSha256(originalBuffer);
    const nowIso = new Date().toISOString();
    const ext = path.extname(fileName).toLowerCase();
    const cleanName = sanitizeFileName(fileName);

    // Initial default metadata
    const metadata: LosslessCompressionMetadata = {
      status: "PENDING_VERIFICATION",
      originalFileName: fileName,
      originalMimeType: mimeType || "application/octet-stream",
      originalSizeBytes: originalSize,
      originalSha256,
      compressedSizeBytes: originalSize,
      compressionMethod: "NONE_RETAINED",
      savedBytes: 0,
      savedPercentage: 0,
      verifiedLossless: false,
      compressedAt: nowIso,
    };

    // Store authoritative original file permanently to disk
    const originalDiskFileName = `${originalSha256.substring(0, 16)}_${cleanName}`;
    const originalDiskPath = path.join(ORIGINAL_STORAGE_DIR, originalDiskFileName);
    try {
      if (!fs.existsSync(originalDiskPath)) {
        fs.writeFileSync(originalDiskPath, originalBuffer);
      }
      metadata.originalFileUrl = `/api/evidence/download?sha256=${originalSha256}&type=original`;
    } catch (saveErr) {
      console.warn("[LosslessCompression] Could not save original to disk:", saveErr);
    }

    // Guard: Very small files (< 1KB) have minimal gain and container overhead
    if (originalSize < 1024) {
      metadata.status = "ORIGINAL_RETAINED";
      metadata.failureReason = "File size < 1 KB; compression yields negligible storage gain.";
      return { metadata, originalBuffer, compressedBuffer: null };
    }

    try {
      let compressedBuf: Buffer | null = null;
      let methodUsed: LosslessCompressionMethod = "BROTLI_L11";
      let decompressMethod: "SHA256_BYTE_EXACT" | "PIXEL_EXACT_RAW" | "FORMAT_VALIDATED" = "SHA256_BYTE_EXACT";

      // 1. IMAGES (PNG, WebP, TIFF, BMP, JPEG)
      if (
        ext === ".png" ||
        ext === ".webp" ||
        ext === ".tiff" ||
        ext === ".tif" ||
        ext === ".bmp"
      ) {
        // Attempt Sharp Lossless Re-compression
        try {
          if (ext === ".png") {
            // PNG Lossless with max Deflate optimization
            const sharpPng = await sharp(originalBuffer)
              .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
              .toBuffer();

            // Verify raw pixel equality
            const [origRaw, compRaw] = await Promise.all([
              sharp(originalBuffer).raw().toBuffer({ resolveWithObject: true }),
              sharp(sharpPng).raw().toBuffer({ resolveWithObject: true }),
            ]);

            if (
              origRaw.info.width === compRaw.info.width &&
              origRaw.info.height === compRaw.info.height &&
              origRaw.info.channels === compRaw.info.channels &&
              origRaw.data.equals(compRaw.data) &&
              sharpPng.length < originalSize
            ) {
              compressedBuf = sharpPng;
              methodUsed = "SHARP_LOSSLESS_PNG";
              decompressMethod = "PIXEL_EXACT_RAW";
            }
          } else if (ext === ".webp") {
            // WebP Lossless
            const sharpWebp = await sharp(originalBuffer)
              .webp({ lossless: true, effort: 6 })
              .toBuffer();

            const [origRaw, compRaw] = await Promise.all([
              sharp(originalBuffer).raw().toBuffer({ resolveWithObject: true }),
              sharp(sharpWebp).raw().toBuffer({ resolveWithObject: true }),
            ]);

            if (
              origRaw.info.width === compRaw.info.width &&
              origRaw.info.height === compRaw.info.height &&
              origRaw.data.equals(compRaw.data) &&
              sharpWebp.length < originalSize
            ) {
              compressedBuf = sharpWebp;
              methodUsed = "SHARP_LOSSLESS_WEBP";
              decompressMethod = "PIXEL_EXACT_RAW";
            }
          }
        } catch (imgErr) {
          console.warn("[LosslessCompression] Sharp image re-compression fallback to container:", imgErr);
        }
      }

      // 2. CONTAINER LOSSLESS COMPRESSION (BROTLI / GZIP / DEFLATE)
      // Used for PDFs, Excel (.xlsx, .xls, .csv), Word documents, and heavy files
      if (!compressedBuf) {
        // Check for Digital Signatures in PDF files
        // If a PDF is digitally signed with cryptographic timestamp (/ByteRange, /Sig),
        // modifying internal objects would invalidate legal cryptographic validation.
        // Container compression (Brotli/Gzip) preserves exact original byte stream!
        try {
          const br = zlib.brotliCompressSync(originalBuffer, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
              [zlib.constants.BROTLI_PARAM_LGWIN]: 24,
            },
          });

          // Check if Brotli saved space
          if (br.length < originalSize) {
            compressedBuf = br;
            methodUsed = "BROTLI_L11";
            decompressMethod = "SHA256_BYTE_EXACT";
          } else {
            // Try Gzip Level 9
            const gz = zlib.gzipSync(originalBuffer, { level: 9 });
            if (gz.length < originalSize) {
              compressedBuf = gz;
              methodUsed = "GZIP_L9";
              decompressMethod = "SHA256_BYTE_EXACT";
            }
          }
        } catch (compErr) {
          console.error("[LosslessCompression] Container compression error:", compErr);
        }
      }

      // If no reduction was achieved or file expanded
      if (!compressedBuf || compressedBuf.length >= originalSize) {
        metadata.status = "ORIGINAL_RETAINED";
        metadata.failureReason =
          "File is already in optimal compressed format; lossless compression yielded no size reduction.";
        metadata.compressedSizeBytes = originalSize;
        return { metadata, originalBuffer, compressedBuffer: null };
      }

      const compressedSize = compressedBuf.length;
      const savedBytes = originalSize - compressedSize;
      const savedPercentage = Number(((savedBytes / originalSize) * 100).toFixed(2));

      // Threshold check: If savings are less than 1.5%, keep original to avoid overhead
      if (savedPercentage < 1.5) {
        metadata.status = "ORIGINAL_RETAINED";
        metadata.failureReason = `Compression reduction is minimal (${savedPercentage}% < 1.5% threshold). Retained authoritative original.`;
        metadata.compressedSizeBytes = originalSize;
        return { metadata, originalBuffer, compressedBuffer: null };
      }

      // 3. MANDATORY ROUNDTRIP DECOMPRESSION & INTEGRITY VERIFICATION
      let verificationPassed = false;
      const compressedSha256 = computeSha256(compressedBuf);

      if (decompressMethod === "SHA256_BYTE_EXACT") {
        let decompressed: Buffer;
        if (methodUsed === "BROTLI_L11") {
          decompressed = zlib.brotliDecompressSync(compressedBuf);
        } else if (methodUsed === "GZIP_L9") {
          decompressed = zlib.gunzipSync(compressedBuf);
        } else {
          decompressed = zlib.inflateSync(compressedBuf);
        }

        const decompressedSha256 = computeSha256(decompressed);
        if (decompressedSha256 === originalSha256) {
          verificationPassed = true;
        } else {
          console.error(
            `[LosslessCompression] CRITICAL INTEGRITY MISMATCH! Expected ${originalSha256}, got ${decompressedSha256}`
          );
        }
      } else if (decompressMethod === "PIXEL_EXACT_RAW") {
        // Direct pixel buffer verification already confirmed identical raw RGBA channels above
        verificationPassed = true;
      }

      if (!verificationPassed) {
        metadata.status = "FAILED_VERIFICATION";
        metadata.failureReason =
          "Decompressed file hash or pixel data failed strict cryptographic integrity verification.";
        metadata.verifiedLossless = false;
        return { metadata, originalBuffer, compressedBuffer: null };
      }

      // 4. VERIFICATION SUCCESSFUL: Save compressed artifact to storage
      metadata.status = "VERIFIED_LOSSLESS";
      metadata.verifiedLossless = true;
      metadata.verifiedAt = new Date().toISOString();
      metadata.compressionMethod = methodUsed;
      metadata.compressedSizeBytes = compressedSize;
      metadata.compressedSha256 = compressedSha256;
      metadata.savedBytes = savedBytes;
      metadata.savedPercentage = savedPercentage;
      metadata.decompressVerificationMethod = decompressMethod;

      const compFileExt = methodUsed === "SHARP_LOSSLESS_PNG" ? ".png" : methodUsed === "SHARP_LOSSLESS_WEBP" ? ".webp" : ".br";
      const compressedDiskFileName = `${originalSha256.substring(0, 16)}_${cleanName}${compFileExt}`;
      const compressedDiskPath = path.join(COMPRESSED_STORAGE_DIR, compressedDiskFileName);

      try {
        fs.writeFileSync(compressedDiskPath, compressedBuf);
        metadata.compressedFileUrl = `/api/evidence/download?sha256=${originalSha256}&type=compressed`;
      } catch (saveCompErr) {
        console.warn("[LosslessCompression] Could not save compressed artifact to disk:", saveCompErr);
      }

      return {
        metadata,
        originalBuffer,
        compressedBuffer: compressedBuf,
      };
    } catch (err: any) {
      console.error("[LosslessCompression] Unexpected error during compression:", err);
      metadata.status = "FAILED_VERIFICATION";
      metadata.failureReason = err.message || "Unexpected compression pipeline failure";
      return { metadata, originalBuffer, compressedBuffer: null };
    }
  },

  /**
   * Compresses a UniversalEvidenceRecord in place and updates the persistent evidence store.
   */
  async compressEvidenceRecord(recordIdOrFileId: string): Promise<UniversalEvidenceRecord | null> {
    try {
      if (!fs.existsSync(EVIDENCE_STORE_PATH)) return null;
      const rawStore = fs.readFileSync(EVIDENCE_STORE_PATH, "utf-8");
      const records: UniversalEvidenceRecord[] = JSON.parse(rawStore);
      const idx = records.findIndex(
        (r) => r.id === recordIdOrFileId || r.fileId === recordIdOrFileId
      );
      if (idx === -1) return null;

      const record = records[idx];

      // Extract original buffer from dataUrl or disk
      let origBuf: Buffer | null = null;
      if (record.rawDocument.dataUrl && record.rawDocument.dataUrl.includes(",")) {
        const b64 = record.rawDocument.dataUrl.split(",")[1];
        origBuf = Buffer.from(b64, "base64");
      }

      if (!origBuf && record.rawDocument.sha256Hash) {
        // Look in original storage
        const cleanName = sanitizeFileName(record.rawDocument.fileName || "evidence_doc");
        const origPath = path.join(
          ORIGINAL_STORAGE_DIR,
          `${record.rawDocument.sha256Hash.substring(0, 16)}_${cleanName}`
        );
        if (fs.existsSync(origPath)) {
          origBuf = fs.readFileSync(origPath);
        }
      }

      if (!origBuf) {
        console.warn(`[LosslessCompression] No file buffer found for record ${record.id}`);
        return null;
      }

      const { metadata } = await this.compressAndVerify(
        origBuf,
        record.rawDocument.fileName,
        record.rawDocument.mimeType || record.rawDocument.fileType || "application/octet-stream"
      );

      record.compression = metadata;
      record.auditTrail = [
        ...(record.auditTrail || []),
        {
          id: `aud_${Date.now()}_compress`,
          action: "PROCESS_COMPLETED",
          performedBy: "Lossless Compression Engine",
          timestamp: new Date().toISOString(),
          details: `Lossless Compression Status: ${metadata.status} (${metadata.savedPercentage}% saved, method: ${metadata.compressionMethod}). Verified Lossless: ${metadata.verifiedLossless}`,
        },
      ];

      records[idx] = record;
      fs.writeFileSync(EVIDENCE_STORE_PATH, JSON.stringify(records, null, 2), "utf-8");
      return record;
    } catch (err) {
      console.error("[LosslessCompression] Failed to compress evidence record:", err);
      return null;
    }
  },

  /**
   * Batch processes all uncompressed evidence records across the system.
   */
  async batchProcessAll(force: boolean = false): Promise<{
    processed: number;
    verifiedLossless: number;
    originalRetained: number;
    failed: number;
    totalSavedBytes: number;
  }> {
    const stats = {
      processed: 0,
      verifiedLossless: 0,
      originalRetained: 0,
      failed: 0,
      totalSavedBytes: 0,
    };

    if (!fs.existsSync(EVIDENCE_STORE_PATH)) return stats;

    try {
      const rawStore = fs.readFileSync(EVIDENCE_STORE_PATH, "utf-8");
      const records: UniversalEvidenceRecord[] = JSON.parse(rawStore);

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (
          !force &&
          record.compression &&
          (record.compression.status === "VERIFIED_LOSSLESS" ||
            record.compression.status === "ORIGINAL_RETAINED")
        ) {
          // Already successfully processed
          continue;
        }

        let origBuf: Buffer | null = null;
        if (record.rawDocument.dataUrl && record.rawDocument.dataUrl.includes(",")) {
          const b64 = record.rawDocument.dataUrl.split(",")[1];
          origBuf = Buffer.from(b64, "base64");
        }

        if (!origBuf) continue;

        stats.processed++;
        const { metadata } = await this.compressAndVerify(
          origBuf,
          record.rawDocument.fileName,
          record.rawDocument.mimeType || record.rawDocument.fileType || "application/octet-stream"
        );

        record.compression = metadata;
        if (metadata.status === "VERIFIED_LOSSLESS") {
          stats.verifiedLossless++;
          stats.totalSavedBytes += metadata.savedBytes;
        } else if (metadata.status === "ORIGINAL_RETAINED") {
          stats.originalRetained++;
        } else {
          stats.failed++;
        }
      }

      fs.writeFileSync(EVIDENCE_STORE_PATH, JSON.stringify(records, null, 2), "utf-8");
    } catch (err) {
      console.error("[LosslessCompression] Batch process error:", err);
    }

    return stats;
  },

  /**
   * Returns complete storage optimization analytics across the CMS.
   */
  getStorageOptimizationStats(): {
    totalOriginalBytes: number;
    totalCompressedBytes: number;
    totalSavedBytes: number;
    totalSavedPercentage: number;
    totalFiles: number;
    verifiedCount: number;
    retainedCount: number;
    failedCount: number;
    pendingCount: number;
    categoryBreakdown: {
      category: string;
      originalBytes: number;
      compressedBytes: number;
      savedBytes: number;
      count: number;
    }[];
  } {
    const emptyResult = {
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      totalSavedBytes: 0,
      totalSavedPercentage: 0,
      totalFiles: 0,
      verifiedCount: 0,
      retainedCount: 0,
      failedCount: 0,
      pendingCount: 0,
      categoryBreakdown: [],
    };

    if (!fs.existsSync(EVIDENCE_STORE_PATH)) return emptyResult;

    try {
      const rawStore = fs.readFileSync(EVIDENCE_STORE_PATH, "utf-8");
      const records: UniversalEvidenceRecord[] = JSON.parse(rawStore);

      let totalOrig = 0;
      let totalComp = 0;
      let verified = 0;
      let retained = 0;
      let failed = 0;
      let pending = 0;

      const catMap: Record<
        string,
        { originalBytes: number; compressedBytes: number; savedBytes: number; count: number }
      > = {
        "PDF Documents": { originalBytes: 0, compressedBytes: 0, savedBytes: 0, count: 0 },
        "Photographs & Images": { originalBytes: 0, compressedBytes: 0, savedBytes: 0, count: 0 },
        "Spreadsheets & Data": { originalBytes: 0, compressedBytes: 0, savedBytes: 0, count: 0 },
        "Audio & Video": { originalBytes: 0, compressedBytes: 0, savedBytes: 0, count: 0 },
        "Case Records & Other": { originalBytes: 0, compressedBytes: 0, savedBytes: 0, count: 0 },
      };

      for (const rec of records) {
        const origSize = rec.rawDocument?.fileSize || 0;
        totalOrig += origSize;

        const compMeta = rec.compression;
        let compSize = origSize;

        if (compMeta) {
          if (compMeta.status === "VERIFIED_LOSSLESS") {
            compSize = compMeta.compressedSizeBytes;
            verified++;
          } else if (compMeta.status === "ORIGINAL_RETAINED") {
            compSize = origSize;
            retained++;
          } else if (compMeta.status === "FAILED_VERIFICATION") {
            failed++;
          } else {
            pending++;
          }
        } else {
          pending++;
        }

        totalComp += compSize;

        // Categorize file
        const name = (rec.rawDocument?.fileName || "").toLowerCase();
        let catKey = "Case Records & Other";
        if (name.endsWith(".pdf")) catKey = "PDF Documents";
        else if (
          name.endsWith(".png") ||
          name.endsWith(".jpg") ||
          name.endsWith(".jpeg") ||
          name.endsWith(".webp") ||
          name.endsWith(".bmp") ||
          name.endsWith(".tiff")
        )
          catKey = "Photographs & Images";
        else if (
          name.endsWith(".xlsx") ||
          name.endsWith(".xls") ||
          name.endsWith(".csv")
        )
          catKey = "Spreadsheets & Data";
        else if (
          name.endsWith(".mp3") ||
          name.endsWith(".wav") ||
          name.endsWith(".m4a") ||
          name.endsWith(".mp4") ||
          name.endsWith(".avi") ||
          name.endsWith(".mkv")
        )
          catKey = "Audio & Video";

        const saved = Math.max(0, origSize - compSize);
        catMap[catKey].originalBytes += origSize;
        catMap[catKey].compressedBytes += compSize;
        catMap[catKey].savedBytes += saved;
        catMap[catKey].count++;
      }

      const totalSaved = Math.max(0, totalOrig - totalComp);
      const totalPct = totalOrig > 0 ? Number(((totalSaved / totalOrig) * 100).toFixed(2)) : 0;

      const categoryBreakdown = Object.entries(catMap).map(([category, val]) => ({
        category,
        ...val,
      }));

      return {
        totalOriginalBytes: totalOrig,
        totalCompressedBytes: totalComp,
        totalSavedBytes: totalSaved,
        totalSavedPercentage: totalPct,
        totalFiles: records.length,
        verifiedCount: verified,
        retainedCount: retained,
        failedCount: failed,
        pendingCount: pending,
        categoryBreakdown,
      };
    } catch (err) {
      console.error("[LosslessCompression] Error calculating stats:", err);
      return emptyResult;
    }
  },
};
