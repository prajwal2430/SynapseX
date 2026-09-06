"""
Graph Agent (Investigation Knowledge Graph Synthesis).

Responsibilities:
- Synthesizes formal graph nodes:
  Person, Device, Account, IPAddress, File, USBDevice, Location, Evidence, Event.
- Establishes grounded relationships based on deterministic extraction and documented correlations:
  USED, ACCESSED, CONNECTED_TO, TRANSFERRED_TO, LOCATED_AT, RELATED_TO, OBSERVED_IN.
- Preserves references to source evidence IDs and event IDs across every node and relationship.
"""
import datetime
import json
import logging
from typing import Any, Dict, List, Set, Tuple
from app.agents.state import GraphEdge, GraphNode, GraphState, InvestigationState

logger = logging.getLogger("adeip.agents.graph")

_TYPE_LABEL_MAP = {
    "person": "Person",
    "device": "Device",
    "user_account": "Account",
    "account": "Account",
    "ip_address": "IPAddress",
    "file": "File",
    "usb_device": "USBDevice",
    "location": "Location",
    "file_hash": "FileHash",
    "domain": "Domain",
    "generic": "Entity",
}


def graph_agent(state: InvestigationState) -> Dict[str, Any]:
    """
    Graph Agent: Builds a structured, explainable knowledge graph topology.
    """
    case_id = state.get("case_id", 0)
    case_info = state.get("case_info", {})
    evidence_items = state.get("evidence_items", [])
    raw_events = state.get("raw_events", [])
    extracted_entities = state.get("extracted_entities", [])
    correlations = state.get("correlations", [])
    logs = list(state.get("agent_logs", []))

    logger.info(f"[GraphAgent] Constructing formal knowledge graph for Case #{case_id}.")

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    node_ids: Set[str] = set()
    edge_ids: Set[str] = set()

    def add_node(n_id: str, label: str, n_type: str, props: Dict[str, Any]):
        if n_id not in node_ids:
            nodes.append(GraphNode(id=n_id, label=label, node_type=n_type, properties=props).model_dump())
            node_ids.add(n_id)

    def add_edge(source_id: str, target_id: str, rel: str, props: Dict[str, Any]):
        if source_id in node_ids and target_id in node_ids:
            key = f"{source_id}->{rel}->{target_id}"
            if key not in edge_ids:
                edge_ids.add(key)
                edges.append(GraphEdge(source=source_id, target=target_id, relationship=rel, properties=props).model_dump())

    # 1. Root Case Node
    case_node_id = f"case_{case_id}"
    add_node(
        case_node_id,
        case_info.get("title") or f"Case #{case_id}",
        "Case",
        {"case_id": case_id, "case_number": case_info.get("case_number", "")},
    )

    # 2. Evidence Nodes & OBSERVED_IN
    for ev in evidence_items:
        ev_id = ev.get("id")
        ev_node_id = f"evidence_{ev_id}"
        add_node(
            ev_node_id,
            ev.get("original_filename") or f"Evidence #{ev_id}",
            "Evidence",
            {
                "evidence_id": ev_id,
                "evidence_number": ev.get("evidence_number"),
                "mime_type": ev.get("mime_type"),
                "sha256_hash": ev.get("sha256_hash"),
            },
        )
        add_edge(case_node_id, ev_node_id, "OBSERVED_IN", {"evidence_id": ev_id})

    # 3. Entity Nodes & OBSERVED_IN
    entity_node_map: Dict[Tuple[str, str], str] = {}
    for ent in extracted_entities:
        e_type = ent.get("entity_type", "generic").lower()
        val = ent.get("entity_value", "")
        norm_val = ent.get("normalized_value") or val.strip().lower()
        formal_label = _TYPE_LABEL_MAP.get(e_type, "Entity")

        ent_node_id = f"entity_{e_type}_{norm_val.replace(' ', '_').replace('/', '_').replace(':', '_')}"
        entity_node_map[(e_type, norm_val)] = ent_node_id

        ev_id = ent.get("evidence_id")
        ev_ids = [ev_id] if ev_id else []

        add_node(
            ent_node_id,
            val,
            formal_label,
            {
                "entity_type": e_type,
                "entity_value": val,
                "normalized_value": norm_val,
                "evidence_ids": ev_ids,
                "confidence": ent.get("confidence", 1.0),
            },
        )

        if ev_id:
            add_edge(ent_node_id, f"evidence_{ev_id}", "OBSERVED_IN", {"evidence_id": ev_id})

    # 4. Event Nodes (Sample for graph performance)
    for event in raw_events[:50]:
        e_id = event.get("id")
        ev_id = event.get("evidence_id")
        event_node_id = f"event_{e_id}"
        add_node(
            event_node_id,
            f"Event #{e_id} ({event.get('event_type')})",
            "Event",
            {
                "event_id": e_id,
                "event_type": event.get("event_type"),
                "timestamp": str(event.get("timestamp")),
                "evidence_id": ev_id,
            },
        )
        if ev_id:
            add_edge(event_node_id, f"evidence_{ev_id}", "OBSERVED_IN", {"evidence_id": ev_id, "event_id": e_id})

    # 5. Deterministic Event Relationship Synthesis (USED, ACCESSED, CONNECTED_TO, LOCATED_AT, TRANSFERRED_TO)
    for ev in raw_events:
        meta_raw = ev.get("metadata")
        if not meta_raw:
            continue
        try:
            meta = json.loads(meta_raw) if isinstance(meta_raw, str) else meta_raw
        except Exception:
            continue
        if not isinstance(meta, dict):
            continue

        ev_id = ev.get("evidence_id")
        event_id = ev.get("id")

        user_val = next((str(v).strip().lower() for k, v in meta.items() if k.lower() in ("user", "username", "account", "login_user")), None)
        ip_val = next((str(v).strip().lower() for k, v in meta.items() if k.lower() in ("ip", "src_ip", "dst_ip", "remote_ip", "client_ip")), None)
        device_val = next((str(v).strip().lower() for k, v in meta.items() if k.lower() in ("device", "hostname", "host", "computer_name")), None)
        usb_val = next((str(v).strip().lower() for k, v in meta.items() if k.lower() in ("usb", "usb_device", "vendor_id")), None)
        file_val = next((str(v).strip().replace("\\", "/").lower() for k, v in meta.items() if k.lower() in ("file", "filename", "file_path")), None)
        loc_val = next((str(v).strip().lower() for k, v in meta.items() if k.lower() in ("location", "country", "city", "region", "geo")), None)

        if user_val and device_val:
            u_node = entity_node_map.get(("user_account", user_val)) or entity_node_map.get(("person", user_val))
            d_node = entity_node_map.get(("device", device_val))
            if u_node and d_node:
                add_edge(u_node, d_node, "ACCESSED", {"evidence_ids": [ev_id], "event_ids": [event_id]})

        if user_val and ip_val:
            u_node = entity_node_map.get(("user_account", user_val)) or entity_node_map.get(("person", user_val))
            ip_node = entity_node_map.get(("ip_address", ip_val))
            if u_node and ip_node:
                add_edge(u_node, ip_node, "USED", {"evidence_ids": [ev_id], "event_ids": [event_id]})

        if device_val and ip_val:
            d_node = entity_node_map.get(("device", device_val))
            ip_node = entity_node_map.get(("ip_address", ip_val))
            if d_node and ip_node:
                add_edge(d_node, ip_node, "CONNECTED_TO", {"evidence_ids": [ev_id], "event_ids": [event_id]})

        if usb_val and device_val:
            usb_node = entity_node_map.get(("usb_device", usb_val))
            d_node = entity_node_map.get(("device", device_val))
            if usb_node and d_node:
                add_edge(usb_node, d_node, "CONNECTED_TO", {"evidence_ids": [ev_id], "event_ids": [event_id]})

        if file_val and device_val:
            f_node = entity_node_map.get(("file", file_val))
            d_node = entity_node_map.get(("device", device_val))
            if f_node and d_node:
                add_edge(d_node, f_node, "ACCESSED", {"evidence_ids": [ev_id], "event_ids": [event_id]})

        if loc_val:
            loc_node = entity_node_map.get(("location", loc_val))
            if loc_node:
                if device_val:
                    d_node = entity_node_map.get(("device", device_val))
                    if d_node:
                        add_edge(d_node, loc_node, "LOCATED_AT", {"evidence_ids": [ev_id], "event_ids": [event_id]})
                if ip_val:
                    ip_node = entity_node_map.get(("ip_address", ip_val))
                    if ip_node:
                        add_edge(ip_node, loc_node, "LOCATED_AT", {"evidence_ids": [ev_id], "event_ids": [event_id]})

    # 6. Documented Correlation Links (RELATED_TO)
    for corr in correlations:
        corr_ev_ids = corr.get("supporting_evidence_ids", [])
        corr_entities = corr.get("entities", [])

        corr_node_ids = []
        for ent_repr in corr_entities:
            parts = ent_repr.split(":", 1)
            if len(parts) == 2:
                e_type, e_val = parts[0].strip().lower(), parts[1].strip().lower()
                n_id = entity_node_map.get((e_type, e_val))
                if n_id:
                    corr_node_ids.append(n_id)

        if len(corr_node_ids) >= 2:
            for i in range(len(corr_node_ids) - 1):
                add_edge(
                    corr_node_ids[i],
                    corr_node_ids[i + 1],
                    "RELATED_TO",
                    {
                        "correlation_id": corr.get("correlation_id"),
                        "signal_type": corr.get("signal_type"),
                        "score": corr.get("correlation_score"),
                        "evidence_ids": corr_ev_ids,
                    },
                )

    graph_payload = GraphState(nodes=nodes, edges=edges).model_dump()

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    logs.append({
        "agent": "graph_agent",
        "timestamp": now_iso,
        "details": f"Constructed knowledge graph with {len(nodes)} nodes and {len(edges)} relationships.",
        "status": "completed",
    })

    return {
        "graph": graph_payload,
        "agent_logs": logs,
    }
