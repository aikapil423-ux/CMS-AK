"""
actions/website_copilot.py — Parth CMS Police Copilot Actions
Auto-discovered by core.action_loader. Allows Parth to understand and explain
the exact page, logged-in officer ID, active case facts, and pending fields.
"""

from __future__ import annotations
from typing import Dict, Any, Optional
from core.website_context import context_store


def explain_current_page(focus_area: str = "", **kwargs) -> str:
    """
    Explains the currently active website page, the logged in officer's details,
    active case facts, and pending required fields.
    """
    summary = context_store.explain_page(lang="hinglish")
    if focus_area:
        summary += f"\n\n[Focus on '{focus_area}']: You can issue direct commands for this."
    return summary


def get_missing_fields(**kwargs) -> str:
    """
    Returns the required fields that are currently empty on the active screen.
    """
    missing = context_store.get_missing_fields()
    if not missing:
        return "Screen ke sabhi required fields bhare hue hain."
    
    lines = [f"- {m['label']} (Section: {m['section'] or 'General'})" for m in missing]
    return "Yeh required fields abhi khali hain:\n" + "\n".join(lines)


def get_current_case_facts(**kwargs) -> str:
    """
    Returns facts about the case currently open on the screen (FIR number, complainant, accused).
    """
    case = context_store.case_facts
    if not case or not case.get("firNumber"):
        return "Abhi screen par koi specific FIR/Case selected nahi hai."
    
    return (
        f"FIR Number: {case.get('firNumber')}\n"
        f"Complainant: {case.get('complainant', 'N/A')}\n"
        f"Accused: {', '.join(case.get('accused', [])) if case.get('accused') else 'N/A'}"
    )


TOOL = {
    "name": "explain_current_page",
    "description": (
        "Call this whenever the police officer asks about the current website screen, "
        "e.g. 'ye kaun sa page hai', 'is page ke baare me batao', 'main kaun hoon', "
        "'yahan kya karna hai', or 'forms me kya bharna baki hai'."
    ),
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "focus_area": {
                "type": "STRING",
                "description": "Specific aspect of the page to highlight (e.g. 'missing fields', 'case summary', 'actions')."
            }
        }
    },
    "handler": explain_current_page,
}
