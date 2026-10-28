"""
Investigation Knowledge Graph Service for ADEIP.

Requirements:
1. PostgreSQL is the primary system of record.
2. Neo4j is used for high-performance relationship exploration.
3. Every graph node and relationship preserves references to source evidence IDs and event IDs.
4. Only creates graph relationships from deterministic extraction or documented correlation results.
"""
import datetime
import json
import logging
from typing import Any, Dict, List, Optional, Set, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.neo4j import Neo4jClient
from app.models.case import InvestigationCase
from app.models.correlation import InvestigationCorrelation
from app.models.entity import EntityType, ExtractedEntityModel
from app.models.evidence import Evidence
from app.models.investigation_event import InvestigationEvent
from app.schemas.graph import (
    CaseKnowledgeGraphResponse,
    GraphEdgeItem,
    GraphNodeItem,
    GraphSyncResultResponse,
)

logger = logging.getLogger("adeip.services.graph")

# Taxonomy mapping from entity_type to display label and typeKey
_ENTITY_TYPE_MAP = {
    EntityType.PERSON.value: ("Person", "person", "high", 80),
    EntityType.DEVICE.value: ("Device", "device", "critical", 90),
    EntityType.USER_ACCOUNT.value: ("Account", "account", "high", 85),
    EntityType.IP_ADDRESS.value: ("IP Address", "ip", "critical", 92),
    EntityType.FILE.value: ("File", "file", "critical", 95),
    EntityType.USB_DEVICE.value: ("USB Device", "usb", "critical", 94),
    EntityType.LOCATION.value: ("Location", "location", "medium", 70),
    EntityType.FILE_HASH.value: ("File Hash", "file_hash", "critical", 90),
    EntityType.DOMAIN.value: ("Domain", "domain", "high", 82),
    EntityType.NETWORK_PORT.value: ("Port", "port", "info", 50),
    EntityType.GENERIC.value: ("Entity", "generic", "info", 40),
}


class GraphService:
    """
    Forensic service synthesizing the multi-source Investigation Knowledge Graph
    and synchronizing graph topology into Neo4j.
    """

    @classmethod
    def build_case_knowledge_graph(
        cls,
        db: Session,
        case_id: int,
        sync_to_neo4j: bool = False,
        max_nodes: Optional[int] = None,
    ) -> CaseKnowledgeGraphResponse:
        """
        Builds the unified Investigation Knowledge Graph for a case from PostgreSQL records,
        preserving all source evidence IDs and event IDs on every node and relationship.
        Optionally synchronizes with Neo4j.
        """
        # 1. Fetch Case (System of Record)
        case = db.scalars(select(InvestigationCase).where(InvestigationCase.id == case_id)).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Investigation case #{case_id} not found.",
            )

        # 2. Fetch Evidence, Events, Entities, Correlations from PostgreSQL
        evidence_records = list(db.scalars(select(Evidence).where(Evidence.case_id == case_id)).all())
        event_records = list(db.scalars(select(InvestigationEvent).where(InvestigationEvent.case_id == case_id)).all())
        entity_records = list(db.scalars(select(ExtractedEntityModel).where(ExtractedEntityModel.case_id == case_id)).all())
        correlation_records = list(db.scalars(select(InvestigationCorrelation).where(InvestigationCorrelation.case_id == case_id)).all())

        nodes: List[GraphNodeItem] = []
        edges: List[GraphEdgeItem] = []
        node_id_set: Set[str] = set()
        edge_id_set: Set[str] = set()
        breakdown: Dict[str, int] = {}

        evidence_lookup = {ev.id: ev for ev in evidence_records}
        event_lookup = {e.id: e for e in event_records}

        def add_node(
            n_id: str,
            label: str,
            n_type: str,
            type_key: str,
            risk: str = "info",
            risk_score: int = 50,
            details: Optional[str] = None,
            ev_ids: Optional[List[int]] = None,
            event_ids: Optional[List[int]] = None,
            props: Optional[Dict[str, Any]] = None,
            timeline: Optional[List[Dict[str, Any]]] = None,
        ) -> str:
            if n_id not in node_id_set:
                node_id_set.add(n_id)
                ev_ids = ev_ids or []
                event_ids = event_ids or []
                ev_labels = [
                    f"E-{ev_id} ({evidence_lookup[ev_id].original_filename})"
                    for ev_id in ev_ids
                    if ev_id in evidence_lookup
                ]
                breakdown[n_type] = breakdown.get(n_type, 0) + 1

                nodes.append(
                    GraphNodeItem(
                        id=n_id,
                        label=label,
                        type=n_type,
                        typeKey=type_key,
                        risk=risk,
                        riskScore=risk_score,
                        details=details,
                        evidence=ev_labels,
                        evidence_ids=ev_ids,
                        event_ids=event_ids,
                        timeline=timeline or [],
                        properties=props or {},
                    )
                )
            return n_id

        def add_edge(
            source_id: str,
            target_id: str,
            label: str,
            rel_type: str = "data",
            risk: str = "medium",
            ev_ids: Optional[List[int]] = None,
            event_ids: Optional[List[int]] = None,
            corr_id: Optional[str] = None,
            score: Optional[float] = None,
            reasons: Optional[List[str]] = None,
            props: Optional[Dict[str, Any]] = None,
        ):
            if source_id not in node_id_set or target_id not in node_id_set:
                return

            edge_key = f"{source_id}->{label}->{target_id}"
            if edge_key not in edge_id_set:
                edge_id_set.add(edge_key)
                edges.append(
                    GraphEdgeItem(
                        id=f"e_{len(edges)+1}",
                        source=source_id,
                        target=target_id,
                        from_node=source_id,
                        to_node=target_id,
                        label=label,
                        relationship=label,
                        type=rel_type,
                        risk=risk,
                        evidence_ids=ev_ids or [],
                        event_ids=event_ids or [],
                        correlation_id=corr_id,
                        score=score,
                        reasons=reasons or [],
                        properties=props or {},
                    )
                )

        # ── Phase 1: Case Root Node ─────────────────────────────────────────
        case_node_id = f"case_{case.id}"
        add_node(
            n_id=case_node_id,
            label=case.title,
            n_type="Case",
            type_key="case",
            risk="critical" if case.priority.value == "critical" else "high",
            risk_score=95 if case.priority.value == "critical" else 75,
            details=f"Investigation Case #{case.id} ({case.case_number}): {case.description or 'No description'}",
            ev_ids=[ev.id for ev in evidence_records],
            props={"case_number": case.case_number, "status": case.status.value, "priority": case.priority.value},
        )

        # ── Phase 2: Evidence Nodes (OBSERVED_IN) ───────────────────────────
        for ev in evidence_records:
            ev_node_id = f"evidence_{ev.id}"
            add_node(
                n_id=ev_node_id,
                label=ev.original_filename,
                n_type="Evidence",
                type_key="evidence",
                risk="high" if ev.integrity_status.value != "verified" else "info",
                risk_score=85 if ev.integrity_status.value != "verified" else 50,
                details=f"Evidence artifact #{ev.id} ({ev.evidence_number}), SHA-256: {ev.sha256_hash[:16]}...",
                ev_ids=[ev.id],
                props={
                    "evidence_number": ev.evidence_number,
                    "mime_type": ev.mime_type,
                    "sha256_hash": ev.sha256_hash,
                    "file_size": ev.file_size,
                    "integrity_status": ev.integrity_status.value,
                },
            )
            add_edge(
                source_id=case_node_id,
                target_id=ev_node_id,
                label="OBSERVED_IN",
                rel_type="physical",
                ev_ids=[ev.id],
                reasons=[f"Evidence #{ev.id} is registered to Case #{case.id}"],
            )

        # ── Phase 3: Extracted Entity Nodes ─────────────────────────────────
        # Group entities by (entity_type, normalized_value) to merge occurrences
        entity_groups: Dict[Tuple[str, str], List[ExtractedEntityModel]] = {}
        for ent in entity_records:
            key = (ent.entity_type.value, ent.normalized_value)
            entity_groups.setdefault(key, []).append(ent)

        # Sort entity groups by relevance:
        # 1. Number of evidence files containing the entity
        # 2. Base risk score of the entity type
        # 3. Total occurrence count
        sorted_groups = sorted(
            entity_groups.items(),
            key=lambda item: (
                len({i.evidence_id for i in item[1] if i.evidence_id}),
                _ENTITY_TYPE_MAP.get(item[0][0], ("", "", "", 50))[3],
                len(item[1]),
            ),
            reverse=True,
        )

        if max_nodes is not None and max_nodes > 0:
            sorted_groups = sorted_groups[:max_nodes]

        entity_node_map: Dict[Tuple[str, str], str] = {}

        for (e_type, norm_val), items in sorted_groups:
            first = items[0]
            display_info = _ENTITY_TYPE_MAP.get(e_type, ("Entity", "generic", "info", 50))
            n_type, type_key, risk, base_score = display_info

            ev_ids = sorted(list({i.evidence_id for i in items if i.evidence_id}))
            event_ids = sorted(list({i.event_id for i in items if i.event_id}))

            ent_node_id = f"entity_{e_type}_{norm_val.replace(' ', '_').replace('/', '_').replace(':', '_')}"
            entity_node_map[(e_type, norm_val)] = ent_node_id

            score = min(99, base_score + (len(ev_ids) * 5))

            # Build mini-timeline for entity from associated events
            node_timeline = []
            for eid in event_ids[:5]:
                evt = event_lookup.get(eid)
                if evt:
                    t_str = evt.timestamp.strftime("%H:%M:%S") if evt.timestamp else "Logged"
                    node_timeline.append({
                        "time": t_str,
                        "event": f"Observed in {evt.source or 'evidence'} ({evt.event_type.value})"
                    })

            add_node(
                n_id=ent_node_id,
                label=first.entity_value,
                n_type=n_type,
                type_key=type_key,
                risk="critical" if score >= 90 else "high" if score >= 75 else risk,
                risk_score=score,
                details=f"{n_type} '{first.entity_value}' observed across {len(ev_ids)} evidence file(s). Context: {first.context or 'Extracted entity'}",
                ev_ids=ev_ids,
                event_ids=event_ids,
                props={
                    "entity_type": e_type,
                    "entity_value": first.entity_value,
                    "normalized_value": norm_val,
                    "occurrences": len(items),
                },
                timeline=node_timeline,
            )

            # Link entity to originating evidence (OBSERVED_IN)
            for ev_id in ev_ids:
                add_edge(
                    source_id=ent_node_id,
                    target_id=f"evidence_{ev_id}",
                    label="OBSERVED_IN",
                    rel_type="access",
                    ev_ids=[ev_id],
                    event_ids=[i.event_id for i in items if i.evidence_id == ev_id and i.event_id],
                    reasons=[f"Entity '{first.entity_value}' ({n_type}) was extracted from Evidence #{ev_id}"],
                )

        # ── Phase 4: Deterministic Event-Level Relationships ────────────────
        # Inspect structured metadata inside each event to build verified links
        for ev in event_records:
            if not ev.event_metadata:
                continue

            try:
                meta = json.loads(ev.event_metadata) if isinstance(ev.event_metadata, str) else ev.event_metadata
            except Exception:
                continue

            if not isinstance(meta, dict):
                continue

            ev_id = ev.evidence_id
            event_id = ev.id

            # Extract active identifiers in this single event
            user_val = next((str(v).strip().lower() for k, v in meta.items() if k.lower() in ("user", "username", "account", "login_user")), None)
            ip_val = next((str(v).strip().lower() for k, v in meta.items() if k.lower() in ("ip", "src_ip", "dst_ip", "remote_ip", "client_ip")), None)
            device_val = next((str(v).strip().upper() for k, v in meta.items() if k.lower() in ("device", "hostname", "host", "computer_name")), None)
            usb_val = next((str(v).strip() for k, v in meta.items() if k.lower() in ("usb", "usb_device", "vendor_id")), None)
            file_val = next((str(v).strip().replace("\\", "/").lower() for k, v in meta.items() if k.lower() in ("file", "filename", "file_path")), None)
            loc_val = next((str(v).strip() for k, v in meta.items() if k.lower() in ("location", "country", "city", "region", "geo")), None)

            # 1. ACCESSED: User/Account -> Device
            if user_val and device_val:
                u_node = entity_node_map.get((EntityType.USER_ACCOUNT.value, user_val)) or entity_node_map.get((EntityType.PERSON.value, user_val))
                d_node = entity_node_map.get((EntityType.DEVICE.value, device_val))
                if u_node and d_node:
                    add_edge(u_node, d_node, "ACCESSED", "auth", "critical", [ev_id], [event_id], reasons=[f"Event #{event_id} logs user '{user_val}' authenticated on device '{device_val}'"])

            # 2. USED: User/Account -> IPAddress
            if user_val and ip_val:
                u_node = entity_node_map.get((EntityType.USER_ACCOUNT.value, user_val)) or entity_node_map.get((EntityType.PERSON.value, user_val))
                ip_node = entity_node_map.get((EntityType.IP_ADDRESS.value, ip_val))
                if u_node and ip_node:
                    add_edge(u_node, ip_node, "USED", "network", "high", [ev_id], [event_id], reasons=[f"Event #{event_id} associates user '{user_val}' with IP address '{ip_val}'"])

            # 3. CONNECTED_TO: Device -> IPAddress
            if device_val and ip_val:
                d_node = entity_node_map.get((EntityType.DEVICE.value, device_val))
                ip_node = entity_node_map.get((EntityType.IP_ADDRESS.value, ip_val))
                if d_node and ip_node:
                    add_edge(d_node, ip_node, "CONNECTED_TO", "network", "high", [ev_id], [event_id], reasons=[f"Event #{event_id} establishes socket communication between '{device_val}' and '{ip_val}'"])

            # 4. CONNECTED_TO: USBDevice -> Device
            if usb_val and device_val:
                usb_node = entity_node_map.get((EntityType.USB_DEVICE.value, usb_val))
                d_node = entity_node_map.get((EntityType.DEVICE.value, device_val))
                if usb_node and d_node:
                    add_edge(usb_node, d_node, "CONNECTED_TO", "hardware", "critical", [ev_id], [event_id], reasons=[f"Event #{event_id} records USB hardware insertion on device '{device_val}'"])

            # 5. TRANSFERRED_TO / ACCESSED: Device -> File
            if file_val and device_val:
                f_node = entity_node_map.get((EntityType.FILE.value, file_val))
                d_node = entity_node_map.get((EntityType.DEVICE.value, device_val))
                if f_node and d_node:
                    add_edge(d_node, f_node, "ACCESSED", "data", "critical", [ev_id], [event_id], reasons=[f"Event #{event_id} records file I/O operations on '{file_val}' via host '{device_val}'"])

            # 6. LOCATED_AT: Device/Person/IP -> Location
            if loc_val:
                loc_node = entity_node_map.get((EntityType.LOCATION.value, loc_val))
                if loc_node:
                    if device_val:
                        d_node = entity_node_map.get((EntityType.DEVICE.value, device_val))
                        if d_node:
                            add_edge(d_node, loc_node, "LOCATED_AT", "physical", "medium", [ev_id], [event_id], reasons=[f"Event #{event_id} positions device '{device_val}' at '{loc_val}'"])
                    if ip_val:
                        ip_node = entity_node_map.get((EntityType.IP_ADDRESS.value, ip_val))
                        if ip_node:
                            add_edge(ip_node, loc_node, "LOCATED_AT", "network", "medium", [ev_id], [event_id], reasons=[f"Event #{event_id} geolocates IP '{ip_val}' to '{loc_val}'"])

        # ── Phase 5: Documented Correlation Links (RELATED_TO) ──────────────
        for corr in correlation_records:
            corr_ev_ids = json.loads(corr.supporting_evidence_ids) if corr.supporting_evidence_ids else []
            corr_event_ids = json.loads(corr.related_event_ids) if corr.related_event_ids else []
            corr_reasons = json.loads(corr.reasons) if corr.reasons else [corr.description]

            # Find matching entity nodes referenced by this correlation
            matching_nodes = [
                n.id for n in nodes
                if any(ev_id in n.evidence_ids for ev_id in corr_ev_ids)
                and n.type not in ("Case", "Evidence")
            ]

            # Link pairs of correlated entity nodes
            if len(matching_nodes) >= 2:
                for i in range(len(matching_nodes) - 1):
                    src_id = matching_nodes[i]
                    tgt_id = matching_nodes[i + 1]
                    add_edge(
                        source_id=src_id,
                        target_id=tgt_id,
                        label="RELATED_TO",
                        rel_type="correlation",
                        risk="critical" if corr.correlation_score >= 0.90 else "high",
                        ev_ids=corr_ev_ids,
                        event_ids=corr_event_ids,
                        corr_id=corr.correlation_id,
                        score=corr.correlation_score,
                        reasons=corr_reasons,
                        props={"signal_type": corr.signal_type, "score": corr.correlation_score},
                    )

        # ── Phase 6: Neo4j Synchronization (Optional / Background) ─────────
        neo4j_synced = False
        if sync_to_neo4j:
            try:
                sync_res = cls.sync_case_to_neo4j(case, nodes, edges)
                neo4j_synced = sync_res.get("neo4j_status") == "synced"
            except Exception as exc:
                logger.warning(f"[GraphService] Neo4j background sync skipped: {exc}")

        summary = {
            "case_id": case.id,
            "case_title": case.title,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "evidence_count": len(evidence_records),
            "breakdown_by_type": breakdown,
            "neo4j_synced": neo4j_synced,
        }

        return CaseKnowledgeGraphResponse(
            case_id=case.id,
            case_title=case.title,
            case_number=case.case_number,
            neo4j_synced=neo4j_synced,
            node_count=len(nodes),
            edge_count=len(edges),
            nodes=nodes,
            edges=edges,
            links=edges,
            breakdown_by_type=breakdown,
            summary=summary,
        )

    @classmethod
    def sync_case_to_neo4j(
        cls,
        case: InvestigationCase,
        nodes: List[GraphNodeItem],
        edges: List[GraphEdgeItem],
    ) -> Dict[str, Any]:
        """
        Synchronizes the PostgreSQL graph representation into Neo4j via parameterized Cypher.
        """
        driver = Neo4jClient.get_driver()
        if not driver:
            return {"neo4j_status": "offline", "nodes_synced": 0, "relationships_synced": 0, "message": "Neo4j driver offline."}

        try:
            with driver.session() as session:
                # 1. Upsert Nodes
                for node in nodes:
                    # Sanitize label for Cypher
                    cypher_label = "".join(c for c in node.type if c.isalnum()) or "Entity"
                    query = f"""
                    MERGE (n:{cypher_label} {{id: $id}})
                    SET n.label = $label,
                        n.case_id = $case_id,
                        n.typeKey = $typeKey,
                        n.risk = $risk,
                        n.riskScore = $riskScore,
                        n.details = $details,
                        n.evidence_ids = $evidence_ids,
                        n.event_ids = $event_ids
                    """
                    session.run(
                        query,
                        id=node.id,
                        label=node.label,
                        case_id=case.id,
                        typeKey=node.typeKey,
                        risk=node.risk,
                        riskScore=node.riskScore,
                        details=node.details or "",
                        evidence_ids=node.evidence_ids,
                        event_ids=node.event_ids,
                    )

                # 2. Upsert Relationships
                for edge in edges:
                    cypher_rel = "".join(c for c in edge.label if c.isalnum() or c == "_").upper() or "RELATED_TO"
                    rel_query = f"""
                    MATCH (a {{id: $source_id}}), (b {{id: $target_id}})
                    MERGE (a)-[r:{cypher_rel}]->(b)
                    SET r.type = $rel_type,
                        r.risk = $risk,
                        r.evidence_ids = $evidence_ids,
                        r.event_ids = $event_ids,
                        r.score = $score,
                        r.correlation_id = $correlation_id
                    """
                    session.run(
                        rel_query,
                        source_id=edge.source,
                        target_id=edge.target,
                        rel_type=edge.type,
                        risk=edge.risk,
                        evidence_ids=edge.evidence_ids,
                        event_ids=edge.event_ids,
                        score=edge.score or 0.0,
                        correlation_id=edge.correlation_id or "",
                    )

            logger.info(f"[GraphService] Synced {len(nodes)} nodes and {len(edges)} edges to Neo4j for Case #{case.id}.")
            return {
                "neo4j_status": "synced",
                "nodes_synced": len(nodes),
                "relationships_synced": len(edges),
                "message": f"Successfully synchronized {len(nodes)} nodes and {len(edges)} relationships to Neo4j.",
            }
        except Exception as exc:
            logger.error(f"[GraphService] Failed to sync to Neo4j: {exc}")
            return {
                "neo4j_status": "error",
                "nodes_synced": 0,
                "relationships_synced": 0,
                "message": f"Neo4j sync failed: {str(exc)}",
            }
