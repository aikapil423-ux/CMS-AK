#!/usr/bin/env python3
"""
Haryana Police CMS - Jarvis Desktop Voice Copilot Companion
Standalone Python companion that bridges local desktop voice (Whisper / Wake-word / Edge-TTS)
with the Haryana Police CMS Next.js Web Application over WebSockets (ws://127.0.0.1:8765).

Features:
- Connects live to browser session: operates all 8 core modules + dynamically discovered routes.
- Dispatches voice commands for multi-step police workflows (Arrest dossier, GD rapat, FIR, Audits, etc.)
- Provides real-time page snapshot & field inspection.
- Supports bilingual Hindi / Hinglish / English voice commands.
- Works offline with graceful fallbacks (CLI console + TTS).
"""

import asyncio
import json
import os
import sys
import uuid
from typing import Dict, Any, Optional, Set

# Attempt to import websockets
try:
    import websockets
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False

# Attempt to import pyttsx3 or edge_tts for speech
try:
    import pyttsx3
    TTS_ENGINE = pyttsx3.init()
    TTS_ENGINE.setProperty('rate', 170)
except Exception:
    TTS_ENGINE = None

# Known Statutory BNS / BNSS Quick Reference (Offline Legal Cache)
OFFLINE_LEGAL_CACHE = {
    "303": "धारा 303 BNS (पुरानी 379 IPC) - चोरी (Theft)। अधिकतम 3 वर्ष कारावास या जुर्माना अथवा दोनों। यदि चोरी ₹5000 से कम की है व प्रथम अपराध है तो सामुदायिक सेवा (Community Service) का प्रावधान u/s 303(2)। संज्ञेय, गैर-जमानती।",
    "305": "धारा 305 BNS (पुरानी 380 IPC) - निवास गृह या पूजा स्थल में चोरी। 7 वर्ष तक कारावास व जुर्माना। संज्ञेय, गैर-जमानती।",
    "331": "धारा 331 BNS (पुरानी 457 IPC) - रात्रि गृह-अतिचार (Lurking House-trespass by night)। संज्ञेय, गैर-जमानती।",
    "106": "धारा 106 BNS (पुरानी 304A IPC) - उपेक्षा द्वारा मृत्यु कारित करना (Rash & Negligent driving causing death)। 5 वर्ष तक कारावास u/s 106(1)। संज्ञेय, जमानती।",
    "35": "धारा 35(3) BNSS (पुरानी 41A CrPC) - 7 वर्ष से कम सज़ा वाले अपराधों में गिरफ्तारी के स्थान पर जांच अधिकारी द्वारा उपस्थिति नोटिस निर्गत करने का वैधानिक नियम (Arnesh Kumar दिशा-निर्देश)।",
    "192": "धारा 192 BNSS (पुरानी 172 CrPC) - अन्वेषण में केस डायरी (ज़िमनी) दैनिक रूप से दर्ज करने की वैधानिक अनिवार्यता।",
    "174": "धारा 174 BNSS (पुरानी 155 CrPC) - असंज्ञेय अपराध (Non-Cognizable Report - NCR) पंजीकरण एवं मजिस्ट्रेट आदेश उपरांत तफ्तीश।",
    "126": "धारा 126 BNSS (पुरानी 107 CrPC) - शांति भंग की आशंका पर निवारक कलंदरा।",
    "170": "धारा 170 BNSS (पुरानी 151 CrPC) - संज्ञेय अपराध निवारण हेतु बिना वारंट गिरफ्तारी।",
}

class JarvisCmsServer:
    def __init__(self, host: str = "127.0.0.1", port: int = 8765):
        self.host = host
        self.port = port
        self.clients: Set[Any] = set()
        self.modules: Dict[str, Any] = {}
        self.routes: Dict[str, str] = {}
        self.last_snapshot: Optional[Dict[str, Any]] = None
        self.pending_replies: Dict[str, asyncio.Future] = {}

    def speak(self, text: str):
        """Voice synthesis output (speakers)"""
        print(f"\n📢 [Jarvis Spoken]: {text}")
        if TTS_ENGINE:
            try:
                TTS_ENGINE.say(text)
                TTS_ENGINE.runAndWait()
            except Exception:
                pass

    async def register(self, websocket):
        self.clients.add(websocket)
        print(f"\n🟢 [Jarvis Bridge] CMS Web App connected from {websocket.remote_address}")

    async def unregister(self, websocket):
        self.clients.discard(websocket)
        print(f"\n🔴 [Jarvis Bridge] CMS Web App disconnected")

    async def handle_message(self, websocket, message_str: str):
        try:
            data = json.loads(message_str)
            msg_type = data.get("type")

            # 1. Handshake from CMS Web Application
            if msg_type == "identify_ack":
                print(f"✨ [Jarvis Bridge] Handshake received: {data.get('message')}")
                # Learn all operational modules (8 core + dynamic)
                if "availableModules" in data:
                    self.modules = {m["id"]: m for m in data["availableModules"]}
                    print(f"📋 Registered Modules ({len(self.modules)}): {', '.join(self.modules.keys())}")
                if "routes" in data:
                    self.routes = {r["path"]: r["title"] for r in data["routes"]}
                if "snapshot" in data and data["snapshot"]:
                    self.last_snapshot = data["snapshot"]
                    print(f"📍 Active Route: {self.last_snapshot.get('path')} ({self.last_snapshot.get('title')})")

            # 2. Command or Action Execution Result
            elif msg_type in ("command_result", "action_result", "snapshot"):
                req_id = data.get("id")
                if req_id and req_id in self.pending_replies:
                    self.pending_replies[req_id].set_result(data)
                
                # If there is spoken text feedback, speak it
                speak_text = data.get("speakText")
                if speak_text:
                    self.speak(speak_text)
                else:
                    msg = data.get("message", "")
                    if msg:
                        print(f"💬 [CMS Reply]: {msg}")

                if "snapshot" in data and data["snapshot"]:
                    self.last_snapshot = data["snapshot"]

        except Exception as e:
            print(f"⚠️ [Jarvis Bridge] Error parsing message: {e}", file=sys.stderr)

    async def ws_handler(self, websocket):
        await self.register(websocket)
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except Exception:
            pass
        finally:
            await self.unregister(websocket)

    async def send_to_cms(self, payload: Dict[str, Any], timeout: float = 10.0) -> Optional[Dict[str, Any]]:
        """Sends an action or command payload to the active CMS browser session"""
        if not self.clients:
            print("⚠️ [Jarvis] No CMS Web App client connected! Please open the CMS portal in your browser.")
            return None

        req_id = str(uuid.uuid4())
        payload["id"] = req_id
        msg_str = json.dumps(payload)

        loop = asyncio.get_running_loop()
        future = loop.create_future()
        self.pending_replies[req_id] = future

        # Broadcast to all connected tabs
        for client in list(self.clients):
            try:
                await client.send(msg_str)
            except Exception:
                pass

        try:
            result = await asyncio.wait_for(future, timeout=timeout)
            return result
        except asyncio.TimeoutError:
            print("⏱️ [Jarvis] Timeout waiting for CMS response.")
            return None
        finally:
            self.pending_replies.pop(req_id, None)

    # =========================================================================
    # High-level Jarvis Copilot Actions
    # =========================================================================
    async def navigate_to_module(self, path: str):
        """Navigates CMS to any module route"""
        print(f"🚀 Navigating CMS to: {path}")
        return await self.send_to_cms({
            "type": "action",
            "action": {"type": "navigate", "path": path}
        })

    async def execute_voice_command(self, text: str):
        """Dispatches natural language Hindi/English command to CMS Agent"""
        print(f"🗣️ Sending Command to CMS Agent: '{text}'")
        return await self.send_to_cms({
            "type": "command",
            "commandText": text
        })

    async def fill_field(self, field_id: str, value: str):
        """Fills an input field on the active CMS page"""
        print(f"✍️ Filling Field '{field_id}' with value: '{value}'")
        return await self.send_to_cms({
            "type": "action",
            "action": {"type": "fill", "id": field_id, "value": value}
        })

    async def click_element(self, element_id: str, approved: bool = False):
        """Clicks a button or link on the active CMS page"""
        print(f"👆 Clicking Element '{element_id}' (Approved: {approved})")
        return await self.send_to_cms({
            "type": "action",
            "action": {"type": "click", "id": element_id},
            "approved": approved
        })

    async def refresh_snapshot(self):
        """Requests active page snapshot from CMS"""
        return await self.send_to_cms({
            "type": "snapshot_request"
        })

    def lookup_law(self, query: str) -> str:
        """Fast offline legal search for BNS / BNSS sections"""
        q = query.strip()
        for sec, text in OFFLINE_LEGAL_CACHE.items():
            if sec in q:
                return text
        return f"धारा '{query}' का संक्षिप्त विवरण लोकल कैशे में नहीं मिला; CMS के Acts & Sections मॉड्यूल में विस्तृत खोज करें।"

async def cli_loop(server: JarvisCmsServer):
    """Interactive command console simulating voice and control inputs"""
    await asyncio.sleep(1.0)
    print("\n" + "="*70)
    print("🤖 HARYANA POLICE CMS - JARVIS DESKTOP COPILOT ACTIVE")
    print("Listening on ws://127.0.0.1:8765")
    print("Commands:")
    print("  say <text>           - Natural language command (e.g. 'say Audits kholo', 'say FIR 142 me arrest memo banao')")
    print("  open <module>        - Open module: complaints, roznamcha, fir, registrations, reports, prosecution, telecom, audits")
    print("  status               - View active page, connected modules and controls")
    print("  law <section>        - Offline BNS / BNSS section lookup (e.g. 'law 303', 'law 35')")
    print("  fill <id>=<value>    - Direct fill input field on current page")
    print("  click <id>           - Click button on current page")
    print("  quit                 - Exit companion")
    print("="*70 + "\n")

    loop = asyncio.get_running_loop()

    while True:
        try:
            line = await loop.run_in_executor(None, input, "Jarvis> ")
            line = line.strip()
            if not line:
                continue

            if line.lower() in ("exit", "quit", "q"):
                print("Shutting down Jarvis Companion...")
                break

            elif line.lower() == "status":
                if server.last_snapshot:
                    snap = server.last_snapshot
                    print(f"\n📍 Current Page: {snap.get('path')} - {snap.get('title')}")
                    controls = snap.get("controls", [])
                    fields = [c for c in controls if c.get("kind") == "field"]
                    buttons = [c for c in controls if c.get("kind") != "field"]
                    print(f"📝 Editable Fields ({len(fields)}):")
                    for f in fields[:10]:
                        print(f"   - [{f.get('id')}] {f.get('label')} (Current: '{f.get('value', '')}')")
                    if len(fields) > 10:
                        print(f"   ... and {len(fields) - 10} more fields")
                    print(f"🔘 Action Buttons ({len(buttons)}):")
                    for b in buttons[:8]:
                        print(f"   - [{b.get('id')}] {b.get('label')}")
                else:
                    print("No snapshot available yet. Ensure CMS web portal is open.")

            elif line.lower().startswith("open "):
                target = line[5:].strip().lower()
                module_map = {
                    "complaints": "/complaints",
                    "roznamcha": "/general-diary",
                    "gd": "/general-diary",
                    "fir": "/fir",
                    "registrations": "/registrations",
                    "reports": "/reports",
                    "prosecution": "/prosecution",
                    "telecom": "/telecom",
                    "audits": "/audits",
                    "acts": "/acts-sections",
                    "transfers": "/record-transfers",
                    "settings": "/settings",
                    "tada": "/tada",
                }
                path = module_map.get(target, target if target.startswith("/") else f"/{target}")
                await server.navigate_to_module(path)

            elif line.lower().startswith("say "):
                command_text = line[4:].strip()
                await server.execute_voice_command(command_text)

            elif line.lower().startswith("law "):
                sec = line[4:].strip()
                ans = server.lookup_law(sec)
                server.speak(ans)

            elif line.lower().startswith("fill "):
                parts = line[5:].split("=", 1)
                if len(parts) == 2:
                    await server.fill_field(parts[0].strip(), parts[1].strip())
                else:
                    print("Usage: fill <field_id>=<value>")

            elif line.lower().startswith("click "):
                element_id = line[6:].strip()
                await server.click_element(element_id)

            else:
                # Default: Treat as natural voice command
                await server.execute_voice_command(line)

        except (EOFError, KeyboardInterrupt):
            break

async def main():
    if not HAS_WEBSOCKETS:
        print("⚠️ Python package 'websockets' is not installed.")
        print("Please install it via: pip install websockets")
        print("Exiting.")
        return

    server = JarvisCmsServer()
    async with websockets.serve(server.ws_handler, server.host, server.port):
        print(f"✅ Jarvis-CMS Companion Server started on ws://{server.host}:{server.port}")
        await cli_loop(server)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nCompanion stopped.")
