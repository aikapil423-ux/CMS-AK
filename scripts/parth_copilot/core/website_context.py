"""
core/website_context.py — Live Website & User Context Store for CMS Police Copilot (Parth)
Keeps real-time awareness of the active user session, opened page, form controls, and case facts.
"""

from __future__ import annotations
import threading
import time
from typing import Any, Dict, List, Optional


class WebsiteContextStore:
    _instance: Optional[WebsiteContextStore] = None
    _lock = threading.Lock()

    def __new__(cls) -> WebsiteContextStore:
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._init_state()
            return cls._instance

    def _init_state(self) -> None:
        self.user: Dict[str, Any] = {
            "id": "",
            "name": "Officer",
            "role": "Police Officer",
            "station": "Police Station",
            "district": "Haryana",
            "badgeNumber": ""
        }
        self.path: str = "/"
        self.title: str = "Dashboard"
        self.controls: List[Dict[str, Any]] = []
        self.errors: List[str] = []
        self.case_facts: Dict[str, Any] = {}
        self.last_updated: float = time.time()

    def update(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Update snapshot from CMS AK website frontend."""
        if not isinstance(payload, dict):
            return self.get_summary()

        if "user" in payload and isinstance(payload["user"], dict):
            u = payload["user"]
            self.user = {
                "id": str(u.get("id") or u.get("badgeNumber") or self.user.get("id") or ""),
                "name": str(u.get("name") or self.user.get("name") or "Officer"),
                "role": str(u.get("role") or self.user.get("role") or "Police Officer"),
                "station": str(u.get("station") or u.get("policeStation") or self.user.get("station") or "Police Station"),
                "district": str(u.get("district") or self.user.get("district") or "Haryana"),
                "badgeNumber": str(u.get("badgeNumber") or self.user.get("badgeNumber") or "")
            }

        if "path" in payload:
            self.path = str(payload.get("path") or "/")
        if "title" in payload:
            self.title = str(payload.get("title") or "Haryana Police CMS")
        if "controls" in payload and isinstance(payload["controls"], list):
            self.controls = payload["controls"]
        if "errors" in payload and isinstance(payload["errors"], list):
            self.errors = payload["errors"]
        if "caseFacts" in payload and isinstance(payload["caseFacts"], dict):
            self.case_facts = payload["caseFacts"]

        self.last_updated = time.time()
        return self.get_summary()

    def get_summary(self) -> Dict[str, Any]:
        return {
            "user": self.user,
            "path": self.path,
            "title": self.title,
            "totalControls": len(self.controls),
            "errors": self.errors,
            "caseFacts": self.case_facts,
            "lastUpdated": self.last_updated
        }

    def get_missing_fields(self) -> List[Dict[str, str]]:
        missing = []
        for c in self.controls:
            if c.get("kind") == "field" and c.get("required") and not c.get("disabled"):
                val = str(c.get("value") or "").strip()
                if not val or val.lower() == "false":
                    missing.append({
                        "id": c.get("id", ""),
                        "label": c.get("label", "Field"),
                        "section": c.get("section", "")
                    })
        return missing

    def explain_page(self, lang: str = "hinglish") -> str:
        """
        Generate a clear, respectful, context-rich explanation of the currently
        opened page, logged-in officer ID/role, active case, and available actions.
        """
        user_name = self.user.get("name") or "Officer"
        user_role = self.user.get("role") or "Police Officer"
        station = self.user.get("station") or "Police Station"
        user_id = self.user.get("id") or self.user.get("badgeNumber") or ""
        path = self.path or "/"
        title = self.title or "CMS Dashboard"
        missing = self.get_missing_fields()
        case = self.case_facts or {}

        # Identify module context
        page_intent = self._describe_route(path, title)

        if lang == "hi-IN":
            greeting = f"जय हिन्द {user_name} जी ({user_role})"
            if user_id:
                greeting += f", बैज/आईडी: {user_id}"
            greeting += f", {station}।"

            explanation = [
                greeting,
                f"वर्तमान में आपकी स्क्रीन पर **'{title}'** (URL: `{path}`) खुला हुआ है।",
                f"**पेज का उद्देश्य:** {page_intent['hi']}"
            ]

            if case.get("firNumber"):
                fir_no = case.get("firNumber")
                comp = case.get("complainant", "एन/ए")
                accused = ", ".join(case.get("accused", [])) if case.get("accused") else "एन/ए"
                explanation.append(f"**सक्रिय केस विवरण:** FIR नं. {fir_no} | शिकायतकर्ता: {comp} | नामजद आरोपी: {accused}")

            if missing:
                missing_labels = ", ".join([m["label"] for m in missing[:5]])
                extra = f" और {len(missing) - 5} अन्य" if len(missing) > 5 else ""
                explanation.append(f"⚠️ **आवश्यक फील्ड जो अभी खाली हैं ({len(missing)}):** {missing_labels}{extra}।")
            else:
                fields_count = len([c for c in self.controls if c.get("kind") == "field"])
                if fields_count > 0:
                    explanation.append(f"✅ इस फॉर्म के सभी आवश्यक फील्ड भरे जा चुके हैं।")

            if self.errors:
                explanation.append(f"❌ **पेज पर त्रुटि (Errors):** {'; '.join(self.errors[:3])}")

            explanation.append("आप मुझे किसी भी फील्ड को भरने, धाराएं खोजने या अगला पेज खोलने का निर्देश दे सकते हैं।")
            return "\n\n".join(explanation)

        else: # Hinglish / en-IN default
            greeting = f"Jai Hind {user_name} ji ({user_role})"
            if user_id:
                greeting += f", ID/Badge: {user_id}"
            greeting += f", {station}."

            explanation = [
                greeting,
                f"Aapki screen par abhi **'{title}'** (Path: `{path}`) khula hua hai.",
                f"**Page ka maksad:** {page_intent['hinglish']}"
            ]

            if case.get("firNumber"):
                fir_no = case.get("firNumber")
                comp = case.get("complainant", "N/A")
                accused = ", ".join(case.get("accused", [])) if case.get("accused") else "N/A"
                explanation.append(f"**Active Case Facts:** FIR No. {fir_no} | Complainant: {comp} | Accused: {accused}")

            if missing:
                missing_labels = ", ".join([m["label"] for m in missing[:5]])
                extra = f" aur {len(missing) - 5} anya" if len(missing) > 5 else ""
                explanation.append(f"⚠️ **Pending Required Fields ({len(missing)}):** {missing_labels}{extra}.")
            else:
                fields_count = len([c for c in self.controls if c.get("kind") == "field"])
                if fields_count > 0:
                    explanation.append("✅ Is form ke sabhi required fields bhare hue hain.")

            if self.errors:
                explanation.append(f"❌ **Screen Warnings/Errors:** {'; '.join(self.errors[:3])}")

            explanation.append("Aap mujhe koi bhi field bharne, BNS/BNSS dhara check karne ya save karne ka aadesh de sakte hain.")
            return "\n\n".join(explanation)

    def _describe_route(self, path: str, title: str) -> Dict[str, str]:
        p = path.lower()
        if "fir" in p:
            return {
                "hi": "यहाँ प्राथमिक सूचना रिपोर्ट (FIR) का पंजीकरण, धाराओं का चयन और संबंधित नोटिस ड्राफ्ट किए जाते हैं।",
                "hinglish": "Yahan FIR registration, sections linking aur investigation proforma draft kiya jata hai."
            }
        elif "complaint" in p:
            return {
                "hi": "यह नागरिक शिकायतों (Complaints/112 calls) का रजिस्टर है जहाँ शिकायतों की प्राथमिक जांच और स्टेटस अपडेट होता है।",
                "hinglish": "Yeh public complaints ka register hai jahan enquiry assign aur track ki jaati hai."
            }
        elif "general-diary" in p or "gd" in p:
            return {
                "hi": "यह थाना रोजनामचा (General Diary) है जहाँ थाने की 24 घंटे की सभी गतिविधियों, रवानगी, आमद और ड्यूटी का रिकॉर्ड दर्ज होता है।",
                "hinglish": "Yeh Thana General Diary (Rojnamcha) hai jahan daily police movement aur duty log hoti hai."
            }
        elif "enquiry" in p:
            return {
                "hi": "यह जाँच कार्यक्षेत्र (Enquiry Workspace) है जहाँ मौका मुआयना और गवाहों के बयान दर्ज किए जाते हैं।",
                "hinglish": "Yeh Enquiry Workspace hai jahan field investigation aur statements prepare hote hain."
            }
        elif "acts" in p or "section" in p:
            return {
                "hi": "यह कानूनी संदर्भ केंद्र (Acts & Sections) है जहाँ BNS, BNSS, BSA, IPC और विशेष अधिनियमों की धाराएं और सज़ा खोजी जा सकती हैं।",
                "hinglish": "Yeh Legal Acts & Sections lookup hai jahan BNS, BNSS aur IPC sections search kiye jaate hain."
            }
        elif "prosecution" in p:
            return {
                "hi": "यह अभियोजन और कोर्ट कार्यक्षेत्र (Prosecution Workspace) है जहाँ चालान, चार्जशीट और स्क्रूटनी की जाती है।",
                "hinglish": "Yeh Prosecution workspace hai jahan Chargesheet aur court scrutiny manage hoti hai."
            }
        elif "audit" in p:
            return {
                "hi": "यह निरीक्षण व ऑडिट विंग (Supervisory Audits) है जहाँ केस प्रोग्रेस और थाना रिकॉर्ड का मुआयना किया जाता है।",
                "hinglish": "Yeh Supervisory Audits hai jahan investigation quality aur compliance verify hoti hai."
            }
        elif "telecom" in p or "cdr" in p:
            return {
                "hi": "यह दूरसंचार विश्लेषण विंग (Telecom / CDR) है जहाँ मोबाइल नंबर, CDR और लोकेशन टावर डेटा विश्लेषित होता है।",
                "hinglish": "Yeh Telecom & CDR analysis desk hai jahan phone numbers aur location verify hoti hai."
            }
        elif "malkhana" in p:
            return {
                "hi": "यह मालखाना रजिस्टर है जहाँ केस प्रॉपर्टी, ज़ब्त हथियार, वाहन और मुद्द नंबर का लेखा-जोखा रखा जाता है।",
                "hinglish": "Yeh Malkhana register hai jahan seized property aur mudd articles manage hote hain."
            }
        return {
            "hi": f"यह हरियाणा पुलिस CMS का '{title}' अनुभाग है।",
            "hinglish": f"Yeh Haryana Police CMS ka '{title}' section hai."
        }


# Global Singleton
context_store = WebsiteContextStore()
