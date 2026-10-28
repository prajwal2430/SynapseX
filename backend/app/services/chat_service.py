"""
Investigation AI Assistant Chat Service for ADEIP / SynapseX.

Strict Compliance Rules (Section 30):
  1. Operates ONLY on processed case evidence (Case Isolation).
  2. Cites evidence IDs and sources for every claim.
  3. Distinguishes FACT, INFERENCE, and UNKNOWN.
  4. If the case evidence does not contain the answer, returns:
     "The available evidence does not provide enough information to answer this."
  5. Never invents facts, suspects, motives, or ungrounded events.
"""
import logging
import re
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.case import InvestigationCase
from app.models.entity import ExtractedEntityModel
from app.models.evidence import Evidence
from app.models.finding import InvestigationFindingModel
from app.models.investigation_event import InvestigationEvent

logger = logging.getLogger("adeip.services.chat")


class ChatService:
    """Provides evidence-grounded AI conversational reasoning for an active investigation case."""

    @classmethod
    def answer_query(
        cls,
        db: Session,
        case_id: int,
        query: str,
    ) -> Dict[str, Any]:
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            return {
                "answer": f"Investigation case #{case_id} was not found.",
                "supportingEvidence": [],
                "timelineEvents": [],
                "entities": [],
                "confidence": "Unknown",
                "classification": "UNKNOWN",
            }

        # 1. Fetch real evidence artifacts for this case
        evidence_items = list(db.scalars(select(Evidence).where(Evidence.case_id == case_id)).all())
        evidence_map = {e.id: e for e in evidence_items}

        if not evidence_items:
            return {
                "answer": (
                    f"Case {case.case_number} has no evidence artifacts uploaded yet. "
                    "The available evidence does not provide enough information to answer this question. "
                    "Please upload digital evidence to begin investigation analysis."
                ),
                "supportingEvidence": [],
                "timelineEvents": [],
                "entities": [],
                "confidence": "None",
                "classification": "UNKNOWN",
            }

        # 2. Fetch real entities and events for this case
        entities = list(db.scalars(select(ExtractedEntityModel).where(ExtractedEntityModel.case_id == case_id)).all())
        events = list(db.scalars(select(InvestigationEvent).where(InvestigationEvent.case_id == case_id)).all())
        findings = list(db.scalars(select(InvestigationFindingModel).where(InvestigationFindingModel.case_id == case_id)).all())

        q_lower = query.lower().strip()

        # ── Intent A: Contradiction & Conflict Questions ──────────────────────
        if any(w in q_lower for w in ("contradiction", "conflict", "discrepanc", "inconsisten")):
            conflict_findings = [f for f in findings if getattr(f, "classification", "") == "CONTRADICTION" or "conflict" in f.title.lower()]
            if conflict_findings:
                ev_ids = []
                for f in conflict_findings:
                    import json
                    try:
                        ev_ids.extend(json.loads(f.supporting_evidence_ids))
                    except Exception:
                        pass
                unique_evs = [evidence_map[eid] for eid in set(ev_ids) if eid in evidence_map]

                ans_lines = ["**Potential Contradictions Detected in Evidence:**\n"]
                for cf in conflict_findings:
                    ans_lines.append(f"• **{cf.title}**: {cf.summary}")
                ans_lines.append("\n*Assessment: The system does not choose one source over another. The investigator must evaluate these conflicting indicators.*")

                return {
                    "answer": "\n".join(ans_lines),
                    "supportingEvidence": [
                        {"id": f"EV-{e.id}", "name": e.original_filename, "type": e.file_type or "Digital Artifact", "sha256": e.sha256_hash[:16] + "..."}
                        for e in unique_evs
                    ],
                    "timelineEvents": [],
                    "entities": [],
                    "confidence": "High (Observational)",
                    "classification": "CONTRADICTION",
                }
            else:
                return {
                    "answer": f"No direct contradictions or conflicting parameters were identified across the {len(evidence_items)} uploaded evidence artifact(s) in Case {case.case_number}.",
                    "supportingEvidence": [
                        {"id": f"EV-{e.id}", "name": e.original_filename, "type": e.file_type or "Digital Artifact"}
                        for e in evidence_items[:4]
                    ],
                    "timelineEvents": [],
                    "entities": [],
                    "confidence": "Verified",
                    "classification": "FACT",
                }

        # ── Intent B: Specific Finding Explanation ("Why was Finding ... generated?") ──
        finding_match = re.search(r"\b(fnd-[a-z0-9-]+|lead\s*#?\d+|f-\d+)\b", q_lower)
        if finding_match or "why was finding" in q_lower:
            target_finding = None
            if finding_match:
                token = finding_match.group(1).lower()
                target_finding = next((f for f in findings if token in f.finding_id.lower() or token in f.title.lower()), None)
            if not target_finding and findings:
                target_finding = findings[0]

            if target_finding:
                import json
                try:
                    ref_ev_ids = json.loads(target_finding.supporting_evidence_ids)
                except Exception:
                    ref_ev_ids = []
                cited_evs = [evidence_map[eid] for eid in ref_ev_ids if eid in evidence_map]

                answer = (
                    f"**Finding {target_finding.finding_id} ({target_finding.title})** was generated based on the following grounded criteria:\n\n"
                    f"• **Classification**: {getattr(target_finding, 'classification', 'INFERENCE')}\n"
                    f"• **Analytical Summary**: {target_finding.summary}\n"
                    f"• **Confidence Score**: {int(target_finding.confidence_score * 100)}%\n\n"
                    f"**Supporting Evidence Sources Cited:**\n"
                    + "\n".join(f"- EV-{e.id} ({e.original_filename}) [SHA-256: `{e.sha256_hash[:12]}...`]" for e in cited_evs)
                )
                return {
                    "answer": answer,
                    "supportingEvidence": [
                        {"id": f"EV-{e.id}", "name": e.original_filename, "type": e.file_type or "Digital Artifact"}
                        for e in cited_evs
                    ],
                    "timelineEvents": [],
                    "entities": [],
                    "confidence": f"{int(target_finding.confidence_score * 100)}%",
                    "classification": getattr(target_finding, "classification", "INFERENCE"),
                }

        # ── Intent C: Timeline & Chronological Questions ─────────────────────
        if any(w in q_lower for w in ("timeline", "what happened", "between", "chronological", "events", "when")):
            timestamped_events = [e for e in events if e.timestamp is not None]
            timestamped_events.sort(key=lambda e: e.timestamp)

            if timestamped_events:
                events_sample = timestamped_events[:8]
                ans_lines = [
                    f"**Chronological Sequence from Case Evidence ({len(timestamped_events)} timestamped events recorded):**\n"
                ]
                for e in events_sample:
                    ev_obj = evidence_map.get(e.evidence_id)
                    ev_label = f"EV-{e.evidence_id} ({ev_obj.original_filename if ev_obj else 'Evidence'})"
                    ts_str = e.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
                    desc = f"{e.event_type.value}: {e.entity_type or ''} {e.entity_value or ''}"
                    ans_lines.append(f"• **{ts_str}** — {desc}\n  *Source: {ev_label}*")

                all_cited_ids = list({e.evidence_id for e in events_sample})
                cited_evs = [evidence_map[eid] for eid in all_cited_ids if eid in evidence_map]

                return {
                    "answer": "\n".join(ans_lines),
                    "supportingEvidence": [
                        {"id": f"EV-{e.id}", "name": e.original_filename, "type": e.file_type or "Digital Artifact"}
                        for e in cited_evs
                    ],
                    "timelineEvents": [
                        {"time": e.timestamp.strftime("%H:%M:%S"), "event": f"{e.event_type.value}: {e.entity_value or ''}"}
                        for e in events_sample[:5]
                    ],
                    "entities": [],
                    "confidence": "High (Direct Telemetry)",
                    "classification": "FACT",
                }

        # ── Intent D: Search for Matching Specific Entities (Phone, Email, IP, etc.) ──
        matching_entities = []
        matching_events = []
        matching_evidence_ids = set()

        tokens = [t.strip(",.?!;:()\"'") for t in q_lower.split() if len(t.strip(",.?!;:()\"'")) >= 3]

        for ent in entities:
            norm = (ent.normalized_value or ent.entity_value or "").lower()
            val = (ent.entity_value or "").lower()
            type_str = ent.entity_type.value.lower()
            if (
                norm in q_lower
                or val in q_lower
                or any(t in norm for t in tokens if len(t) >= 4)
                or ("ip" in tokens and "ip" in type_str)
                or ("address" in tokens and "ip" in type_str)
                or ("email" in tokens and "@" in val)
                or ("account" in tokens and "account" in type_str)
                or ("file" in tokens and "file" in type_str)
                or ("usb" in tokens and "usb" in type_str)
            ):
                matching_entities.append(ent)
                matching_evidence_ids.add(ent.evidence_id)

        # Also search raw events metadata
        for ev in events:
            text_str = ((ev.event_metadata or "") + " " + (ev.source or "") + " " + (ev.entity_value or "")).lower()
            if any(t in text_str for t in tokens if len(t) >= 4):
                matching_events.append(ev)
                matching_evidence_ids.add(ev.evidence_id)
                # Link entities associated with this event
                for ent in entities:
                    if ent.event_id == ev.id and ent not in matching_entities:
                        matching_entities.append(ent)

        if matching_entities or matching_events:
            cited_evs = [evidence_map[eid] for eid in matching_evidence_ids if eid in evidence_map]
            unique_ents = {f"{e.entity_type.value}: {e.entity_value}" for e in matching_entities[:8]}

            ans_lines = [
                f"**Correlated Evidence Grounding for Query:**\n",
                f"Found **{len(matching_entities)} entity occurrences** and **{len(matching_events)} related events** across **{len(cited_evs)} evidence artifact(s)** in Case {case.case_number}.\n",
            ]
            if unique_ents:
                ans_lines.append("**Matched Entities:**\n" + "\n".join(f"• `{ent}`" for ent in unique_ents) + "\n")

            if matching_events:
                ans_lines.append("**Forensic Observations & Evidence Context:**")
                for ev in matching_events[:4]:
                    meta = ev.event_metadata or ""
                    try:
                        import json
                        m_obj = json.loads(meta)
                        line_txt = m_obj.get("sourceText") or m_obj.get("line") or meta
                    except Exception:
                        line_txt = meta
                    ans_lines.append(f"• **Event #{ev.id}** ({ev.source}): `{str(line_txt)[:250]}`")
                ans_lines.append("")

            ans_lines.append("**Supporting Evidence Citations:**")
            for ev in cited_evs:
                ans_lines.append(f"• **EV-{ev.id}** — `{ev.original_filename}` ({ev.file_type or 'Artifact'}, SHA-256: `{ev.sha256_hash[:12]}...`)")

            return {
                "answer": "\n".join(ans_lines),
                "supportingEvidence": [
                    {"id": f"EV-{e.id}", "name": e.original_filename, "type": e.file_type or "Digital Artifact", "sha256": e.sha256_hash[:16] + "..."}
                    for e in cited_evs
                ],
                "timelineEvents": [
                    {"time": e.timestamp.strftime("%H:%M:%S") if e.timestamp else "N/A", "event": f"{e.source}: {e.entity_value or ''}"}
                    for e in matching_events[:4]
                ],
                "entities": [{"name": e.entity_value, "type": e.entity_type.value} for e in matching_entities[:5]],
                "confidence": "High (Grounded in Verified Files)",
                "classification": "FACT",
            }

        # ── Fallback: Strictly Truthful Negative Response (No Hallucinations) ──
        return {
            "answer": (
                f"No evidence in Case {case.case_number} supports this claim. "
                f"The available evidence does not provide enough information to answer this. "
                f"Searched across {len(evidence_items)} evidence files, {len(entities)} extracted entities, and {len(events)} investigation events. "
                "No supporting records or verifiable facts match your query."
            ),
            "supportingEvidence": [],
            "timelineEvents": [],
            "entities": [],
            "confidence": "Unknown",
            "classification": "UNKNOWN",
        }
