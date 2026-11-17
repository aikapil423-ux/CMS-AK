"""
web_server.py — Parth AI Police Copilot Web & API Server
Connects Haryana Police CMS AK website (Next.js) directly to Parth AI Engine.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from core.website_context import context_store
from core.gemini import text as gemini_text, FAST, SMART

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ParthWebServer")

BASE_DIR = Path(__file__).resolve().parent
PROMPT_FILE = BASE_DIR / "core" / "prompt.txt"

app = FastAPI(title="Parth AI Police Copilot API", version="2.0.0")

# Enable CORS for Next.js website
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connected_websockets: List[WebSocket] = []


def load_system_prompt() -> str:
    try:
        if PROMPT_FILE.exists():
            return PROMPT_FILE.read_text(encoding="utf-8")
    except Exception as e:
        logger.error(f"Failed to read prompt file: {e}")
    return "You are Parth, AI Police Copilot for Haryana Police Crime Management System (CMS)."


@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "active",
        "agent": "Parth AI Police Copilot",
        "version": "2.0-web",
        "features": [
            "page_awareness",
            "officer_session_context",
            "bns_legal_advisor",
            "realtime_voice_streaming",
            "case_facts_inspector"
        ],
        "activePage": context_store.path,
        "activeUser": context_store.user.get("name") or "Officer",
        "timestamp": time.time()
    }


@app.post("/api/context")
async def update_context(req: Request):
    """Receive live website snapshot and user ID from CMS AK frontend."""
    try:
        data = await req.json()
        summary = context_store.update(data)
        logger.info(f"Updated context: User={summary['user'].get('name')} | Page={summary['path']} | Controls={summary['totalControls']}")
        return {"success": True, "summary": summary}
    except Exception as e:
        logger.error(f"Context update failed: {e}")
        return JSONResponse({"success": False, "error": str(e)}, status_code=400)


@app.get("/api/context")
async def get_context():
    """Retrieve the current page, user ID, active case, and form controls."""
    return {"success": True, "context": context_store.get_summary()}


@app.post("/api/explain-page")
async def explain_page(req: Request):
    """Generate an instant, police-contextual explanation of the currently open page."""
    try:
        data = await req.json().catch(lambda: {}) if req.headers.get("content-type") == "application/json" else {}
    except Exception:
        data = {}
    
    lang = data.get("lang", "hinglish")
    explanation = context_store.explain_page(lang=lang)
    return {
        "success": True,
        "explanation": explanation,
        "path": context_store.path,
        "user": context_store.user
    }


@app.get("/api/voices")
async def get_available_voices():
    """List available police copilot and AI voices."""
    try:
        from memory.config_manager import get_voice
        cur = get_voice()
    except Exception:
        cur = "male-parth"

    return {
        "success": True,
        "currentVoice": cur,
        "availableVoices": [
            {"id": "male-parth", "name": "Parth Copilot (Male / शांत व स्पष्ट)", "gender": "male"},
            {"id": "male-ravi", "name": "Inspector Ravi (Male Deep)", "gender": "male"},
            {"id": "female-swara", "name": "Officer Swara (Female / महिला)", "gender": "female"},
            {"id": "gemini-charon", "name": "Gemini Charon (AI Deep Male)", "gender": "male"},
            {"id": "gemini-fenrir", "name": "Gemini Fenrir (AI Resonant Male)", "gender": "male"},
            {"id": "gemini-aoede", "name": "Gemini Aoede (AI Female Confident)", "gender": "female"}
        ]
    }


@app.post("/api/voice")
async def set_active_voice(req: Request):
    """Change active voice preference."""
    try:
        data = await req.json()
        voice = str(data.get("voice") or "").strip()
        from memory.config_manager import save_voice
        if voice:
            save_voice(voice)
            logger.info(f"Updated active voice to: {voice}")
            return {"success": True, "voice": voice}
    except Exception as e:
        logger.error(f"Failed to update voice: {e}")
    return {"success": False, "error": "Invalid voice selection"}


@app.post("/api/chat")
async def chat_endpoint(req: Request):
    """
    Handle user natural language queries with full awareness of the open website page,
    the officer's ID/rank, and case records.
    """
    try:
        data = await req.json()
    except Exception:
        return JSONResponse({"success": False, "error": "Invalid JSON"}, status_code=400)

    query = str(data.get("message") or "").strip()
    lang = str(data.get("lang") or "hinglish").strip()
    history = data.get("history") or []

    if not query:
        return {"success": False, "reply": "Kripya koi prashn ya aadesh bolein."}

    # Fast-path for page explanation queries
    lower_q = query.lower()
    page_patterns = [
        "kaun sa page", "kon sa page", "what page", "explain page", "ye kya hai",
        "page ke baare", "is page par kya", "page details", "main kahan hoon"
    ]
    if any(p in lower_q for p in page_patterns):
        explanation = context_store.explain_page(lang=lang)
        return {"success": True, "reply": explanation}

    # Fast-path for officer ID/user info
    user_patterns = ["main kaun hoon", "meri id", "my id", "who am i", "user info", "officer info"]
    if any(p in lower_q for p in user_patterns):
        u = context_store.user
        reply = (
            f"Jai Hind Sir! Aap **{u.get('name')}** ({u.get('role')}) ke roop me logged in hain. "
            f"Aapki ID/Badge: **{u.get('id') or u.get('badgeNumber') or 'N/A'}**, "
            f"Station: **{u.get('station')}**, District: **{u.get('district')}**."
        )
        return {"success": True, "reply": reply}

    # Fast-path for missing fields
    missing_patterns = ["kya bharna", "kya baki", "missing field", "incomplete", "khali field"]
    if any(p in lower_q for p in missing_patterns):
        missing = context_store.get_missing_fields()
        if not missing:
            return {"success": True, "reply": "Screen par sabhi anivarya (mandatory) fields bhare hue hain."}
        fields_str = "\n".join([f"- **{m['label']}** ({m['section'] or 'General'})" for m in missing[:8]])
        return {"success": True, "reply": f"Is page par nimnlikhit {len(missing)} fields bharna baki hai:\n{fields_str}"}

    # Construct context-enriched prompt for Gemini
    system_prompt = load_system_prompt()
    page_summary = context_store.explain_page(lang=lang)
    case_summary = json.dumps(context_store.case_facts, ensure_ascii=False) if context_store.case_facts else "None"
    
    context_block = (
        f"[CURRENT LOGGED-IN OFFICER]\n"
        f"Name: {context_store.user.get('name')}, Role: {context_store.user.get('role')}, "
        f"ID: {context_store.user.get('id')}, Station: {context_store.user.get('station')}\n\n"
        f"[CURRENT ACTIVE SCREEN]\n"
        f"Path: {context_store.path}, Title: {context_store.title}\n"
        f"Summary: {page_summary}\n"
        f"Case Facts: {case_summary}\n\n"
        f"[RECENT ERRORS ON SCREEN]\n{', '.join(context_store.errors) if context_store.errors else 'None'}\n"
    )

    full_prompt = (
        f"{system_prompt}\n\n"
        f"{context_block}\n\n"
        f"Officer Query: {query}\n"
        f"Instruction: Answer concisely and accurately in {lang}. If suggesting an action, be direct."
    )

    try:
        reply = gemini_text(full_prompt, tier=FAST)
        if not reply:
            reply = "Maaf kijiye, main abhi is request ko process nahi kar pa raha hoon. Kripya punah prayas karein."
        return {"success": True, "reply": reply}
    except Exception as e:
        logger.error(f"Gemini generation error: {e}")
        return {"success": False, "reply": f"AI service me samasya aayi: {e}"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Full-duplex WebSocket connection with CMS AK frontend."""
    await websocket.accept()
    connected_websockets.append(websocket)
    logger.info("New CMS AK client connected to WebSocket.")

    try:
        # Send initial identify/ready greeting
        await websocket.send_json({
            "type": "ready",
            "message": "Parth AI Police Copilot connected successfully.",
            "user": context_store.user,
            "path": context_store.path
        })

        while True:
            raw_msg = await websocket.receive_text()
            try:
                msg = json.loads(raw_msg)
            except Exception:
                continue

            msg_type = msg.get("type")

            if msg_type == "ping":
                await websocket.send_json({"type": "pong", "time": time.time()})

            elif msg_type == "context" or msg_type == "snapshot":
                payload = msg.get("payload") or msg.get("snapshot") or {}
                context_store.update(payload)
                await websocket.send_json({
                    "type": "context_ack",
                    "success": True,
                    "summary": context_store.get_summary()
                })

            elif msg_type == "explain_page":
                lang = msg.get("lang", "hinglish")
                explanation = context_store.explain_page(lang=lang)
                await websocket.send_json({
                    "type": "command_result",
                    "success": True,
                    "message": explanation,
                    "speakText": explanation
                })

            elif msg_type == "command":
                cmd = str(msg.get("commandText") or msg.get("text") or "").strip()
                lang = msg.get("lang", "hinglish")
                
                # Check for explain page patterns
                if any(p in cmd.lower() for p in ["kaun sa page", "kon sa page", "what page", "explain page", "page ke baare"]):
                    ans = context_store.explain_page(lang=lang)
                else:
                    # Enrich and process
                    page_summary = context_store.explain_page(lang=lang)
                    prompt = (
                        f"{load_system_prompt()}\n\n"
                        f"Officer Name: {context_store.user.get('name')}, Role: {context_store.user.get('role')}\n"
                        f"Active Page: {context_store.title} ({context_store.path})\n"
                        f"Screen Context: {page_summary}\n\n"
                        f"Officer Command: {cmd}\n"
                        f"Respond in {lang}."
                    )
                    ans = gemini_text(prompt, tier=FAST, default="Command process ho gaya.")

                await websocket.send_json({
                    "type": "command_result",
                    "success": True,
                    "message": ans,
                    "speakText": ans
                })

    except WebSocketDisconnect:
        logger.info("CMS AK WebSocket client disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)


def start_server():
    print("=" * 60)
    print("  Starting Parth AI Police Copilot Server (Web Edition)")
    print("  Host: 127.0.0.1  Port: 8000")
    print("  Website Awareness & Gemini Live: ACTIVE")
    print("=" * 60)
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")


if __name__ == "__main__":
    start_server()
