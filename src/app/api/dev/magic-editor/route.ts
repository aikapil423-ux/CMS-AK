import { apiAccess } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MODIFICATIONS_FILE = path.join(process.cwd(), "src", "lib", "magic_modifications.json");

export interface MagicModification {
  id: string;
  timestamp: string;
  url: string;
  actionType: "RENAME_TEXT" | "RESIZE" | "DELETE_ELEMENT" | "ADD_BUTTON" | "MOVE_POSITION" | "CUSTOM_STYLE";
  selector?: string;
  tagName: string;
  originalText?: string;
  newText?: string;
  width?: string;
  height?: string;
  fontSize?: string;
  classes?: string;
  styles?: Record<string, string>;
  parentContext?: string;
  isApplied?: boolean;
}

function ensureFile() {
  if (!fs.existsSync(MODIFICATIONS_FILE)) {
    fs.writeFileSync(MODIFICATIONS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readModifications(): MagicModification[] {
  ensureFile();
  try {
    const raw = fs.readFileSync(MODIFICATIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeModifications(data: MagicModification[]) {
  ensureFile();
  fs.writeFileSync(MODIFICATIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// GET: Return all modifications (or filtered by url)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const urlFilter = searchParams.get("url");
    const all = readModifications();

    if (urlFilter) {
      const filtered = all.filter((m) => m.url === urlFilter || m.url === "*");
      return NextResponse.json({ success: true, modifications: filtered, allCount: all.length });
    }

    return NextResponse.json({ success: true, modifications: all });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, modifications: [] }, { status: 500 });
  }
}

// POST: Add new modifications (supports single or array)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = readModifications();
    const incoming: MagicModification[] = Array.isArray(body.modifications)
      ? body.modifications
      : body.modification
      ? [body.modification]
      : Array.isArray(body.actions)
      ? body.actions
      : body.action
      ? [body.action]
      : [];

    for (const item of incoming) {
      if (!item || !item.actionType) continue;

      // Check if duplicate modification exists for same target on same url
      const existingIdx = current.findIndex(
        (m) =>
          m.url === item.url &&
          m.tagName === item.tagName &&
          (m.originalText === item.originalText || (item.selector && m.selector === item.selector)) &&
          m.actionType === item.actionType
      );

      const entry: MagicModification = {
        id: item.id || `mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        url: item.url || "*",
        actionType: item.actionType,
        selector: item.selector || "",
        tagName: item.tagName || "div",
        originalText: item.originalText || "",
        newText: item.newText || "",
        width: item.width,
        height: item.height,
        fontSize: item.fontSize,
        classes: item.classes || "",
        styles: item.styles || {},
        parentContext: item.parentContext || "",
        isApplied: true,
      };

      if (existingIdx >= 0) {
        current[existingIdx] = { ...current[existingIdx], ...entry };
      } else {
        current.push(entry);
      }
    }

    writeModifications(current);
    return NextResponse.json({ success: true, count: current.length, modifications: current });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Undo/delete a specific modification by id, or clear all for URL
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const modId = searchParams.get("id");
    const urlFilter = searchParams.get("url");
    const clearAll = searchParams.get("clearAll") === "true";

    let current = readModifications();

    if (modId) {
      const beforeCount = current.length;
      current = current.filter((m) => m.id !== modId);
      writeModifications(current);
      return NextResponse.json({
        success: true,
        removedId: modId,
        count: current.length,
        modifications: current,
      });
    }

    if (urlFilter) {
      current = current.filter((m) => m.url !== urlFilter);
      writeModifications(current);
      return NextResponse.json({
        success: true,
        clearedUrl: urlFilter,
        count: current.length,
        modifications: current,
      });
    }

    if (clearAll) {
      writeModifications([]);
      return NextResponse.json({ success: true, message: "All modifications cleared", modifications: [] });
    }

    return NextResponse.json({ error: "No id or url specified to delete." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
