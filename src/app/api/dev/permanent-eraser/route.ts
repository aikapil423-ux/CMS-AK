import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PERMANENT_RULES_FILE = path.join(process.cwd(), "src", "lib", "permanent_erased_rules.json");

function ensureFile() {
  if (!fs.existsSync(PERMANENT_RULES_FILE)) {
    fs.writeFileSync(PERMANENT_RULES_FILE, JSON.stringify([]), "utf-8");
  }
}

/**
 * Searches a .tsx file for JSX elements matching the text snippet or class and removes them.
 */
function tryAutoRemoveFromSourceCode(item: { textSnippet: string; tagName?: string; classes?: string; url?: string }) {
  try {
    const textSnippet = (item.textSnippet || "").trim();
    if (!textSnippet || textSnippet.length < 5) return;

    // Extract search keywords (ignore dynamic parts like dates/IDs)
    // e.g. "Findings: FINAL ENQUIRY REPORT" -> look for "Findings:"
    let candidateFiles: string[] = [];

    if (item.url && item.url.startsWith("/complaints/")) {
      candidateFiles.push(path.join(process.cwd(), "src", "app", "complaints", "[id]", "page.tsx"));
    } else if (item.url && item.url.startsWith("/fir/")) {
      candidateFiles.push(path.join(process.cwd(), "src", "app", "fir", "[id]", "page.tsx"));
    } else if (item.url && item.url.startsWith("/general-diary")) {
      candidateFiles.push(path.join(process.cwd(), "src", "app", "general-diary", "page.tsx"));
    }

    // Always check general complaint page if url is complaint
    for (const filePath of candidateFiles) {
      if (!fs.existsSync(filePath)) continue;

      let fileContent = fs.readFileSync(filePath, "utf-8");
      let modified = false;

      // Special Pattern 1: Findings: {report.conclusionSummary}
      if (textSnippet.startsWith("Findings:")) {
        const regex1 = /\{report\.conclusionSummary\s*&&\s*\(\s*<div[^>]*>[\s\S]*?Findings:[\s\S]*?<\/div>\s*\)\}/g;
        if (regex1.test(fileContent)) {
          fileContent = fileContent.replace(regex1, "");
          modified = true;
        }
      }

      // Pattern 2: Matching exact class and text substring
      if (!modified && item.classes) {
        const firstClass = item.classes.split(" ")[0];
        if (firstClass && firstClass.length > 3) {
          // Check if snippet prefix is in file
          const prefix = textSnippet.slice(0, 30);
          if (fileContent.includes(prefix)) {
            // Find surrounding element
            const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const elementRegex = new RegExp(`<(${item.tagName || "[a-z0-9]+"}|div|p|span)[^>]*>[^<]*${escapedPrefix}[\\s\\S]*?<\\/\\1>`, "i");
            if (elementRegex.test(fileContent)) {
              fileContent = fileContent.replace(elementRegex, "");
              modified = true;
            }
          }
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, fileContent, "utf-8");
        console.log(`[Auto-Eraser] Successfully cleaned from source code: ${filePath}`);
      }
    }
  } catch (err) {
    console.warn("[Auto-Eraser] Could not auto-modify source file:", err);
  }
}

export async function GET() {
  try {
    ensureFile();
    const data = fs.readFileSync(PERMANENT_RULES_FILE, "utf-8");
    return NextResponse.json({ rules: JSON.parse(data) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, rules: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureFile();
    const body = await req.json();
    let current: any[] = [];
    try {
      current = JSON.parse(fs.readFileSync(PERMANENT_RULES_FILE, "utf-8"));
    } catch {
      current = [];
    }

    const items = Array.isArray(body) ? body : [body];

    for (const item of items) {
      const text = (item.textSnippet || "").trim();
      if (!text) continue;

      // 1. Try immediate physical source-code file deletion
      tryAutoRemoveFromSourceCode(item);

      // 2. Also register in permanent rules
      const alreadyExists = current.some(
        (r) => r.textSnippet === text && r.url === (item.url || "")
      );

      if (!alreadyExists) {
        current.push({
          id: Date.now().toString() + "_" + Math.random().toString(36).substring(2, 6),
          timestamp: new Date().toISOString(),
          url: item.url || "",
          textSnippet: text,
          tagName: item.tagName || "",
          classes: item.classes || "",
        });
      }
    }

    fs.writeFileSync(PERMANENT_RULES_FILE, JSON.stringify(current, null, 2), "utf-8");
    return NextResponse.json({ success: true, count: current.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    ensureFile();
    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get("id");

    if (!ruleId) {
      fs.writeFileSync(PERMANENT_RULES_FILE, JSON.stringify([]), "utf-8");
      return NextResponse.json({ success: true, message: "Cleared all rules" });
    }

    let current: any[] = JSON.parse(fs.readFileSync(PERMANENT_RULES_FILE, "utf-8"));
    current = current.filter((r) => r.id !== ruleId);
    fs.writeFileSync(PERMANENT_RULES_FILE, JSON.stringify(current, null, 2), "utf-8");
    return NextResponse.json({ success: true, rules: current });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
