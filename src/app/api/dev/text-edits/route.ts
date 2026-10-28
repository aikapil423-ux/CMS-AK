import { apiAccess } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PERMANENT_EDITS_FILE = path.join(process.cwd(), "src", "lib", "permanent_text_edits.json");

function ensureFile() {
  if (!fs.existsSync(PERMANENT_EDITS_FILE)) {
    fs.writeFileSync(PERMANENT_EDITS_FILE, JSON.stringify([]), "utf-8");
  }
}

/**
 * Replaces originalText with newText in physical source code (.tsx)
 */
function tryAutoReplaceInSourceCode(item: { originalText: string; newText: string; url?: string }) {
  try {
    const originalText = (item.originalText || "").trim();
    const newText = (item.newText || "").trim();
    if (!originalText || !newText || originalText === newText) return;

    let candidateFiles: string[] = [];

    if (item.url && item.url.startsWith("/complaints/")) {
      candidateFiles.push(path.join(process.cwd(), "src", "app", "complaints", "[id]", "page.tsx"));
    } else if (item.url && item.url.startsWith("/fir/")) {
      candidateFiles.push(path.join(process.cwd(), "src", "app", "fir", "[id]", "page.tsx"));
    } else if (item.url && item.url.startsWith("/general-diary")) {
      candidateFiles.push(path.join(process.cwd(), "src", "app", "general-diary", "page.tsx"));
    }

    for (const filePath of candidateFiles) {
      if (!fs.existsSync(filePath)) continue;

      let fileContent = fs.readFileSync(filePath, "utf-8");
      if (fileContent.includes(originalText)) {
        fileContent = fileContent.replaceAll(originalText, newText);
        fs.writeFileSync(filePath, fileContent, "utf-8");
        console.log(`[Auto-Text-Editor] Replaced text in source code: ${filePath}`);
      }
    }
  } catch (err) {
    console.warn("[Auto-Text-Editor] Could not replace in source file:", err);
  }
}

export async function GET(req: Request) {
 const apiUser=apiAccess(req);if(apiUser instanceof Response)return apiUser;
  try {
    ensureFile();
    const data = fs.readFileSync(PERMANENT_EDITS_FILE, "utf-8");
    return NextResponse.json({ edits: JSON.parse(data) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, edits: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    ensureFile();
    const body = await req.json();
    let current: any[] = [];
    try {
      current = JSON.parse(fs.readFileSync(PERMANENT_EDITS_FILE, "utf-8"));
    } catch {
      current = [];
    }

    const { originalText, newText, url, tagName, classes } = body;
    if (!originalText || !newText) {
      return NextResponse.json({ error: "Missing originalText or newText" }, { status: 400 });
    }

    // 1. Physical source code replacement
    tryAutoReplaceInSourceCode({ originalText, newText, url });

    // 2. Save in permanent edits JSON
    const existingIndex = current.findIndex(
      (e) => e.originalText === originalText && e.url === (url || "")
    );

    const editRecord = {
      id: Date.now().toString() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      url: url || "",
      originalText: originalText.trim(),
      newText: newText.trim(),
      tagName: tagName || "",
      classes: classes || "",
    };

    if (existingIndex >= 0) {
      current[existingIndex] = editRecord;
    } else {
      current.push(editRecord);
    }

    fs.writeFileSync(PERMANENT_EDITS_FILE, JSON.stringify(current, null, 2), "utf-8");
    return NextResponse.json({ success: true, record: editRecord });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
