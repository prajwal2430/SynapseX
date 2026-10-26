"""
SynapseX (ADEIP) — Comprehensive Forensic Intelligence Demo Data Seeder.

Populates the local SQLite database (adeip.db) with rich, realistic, enterprise-grade
digital forensic investigation data across:
- 3 Realistic Forensic Cases
- Digital Evidence Artifacts (EVTX, PCAP, USB Image, Memory Dump, CCTV, CloudTrail)
- Tamper-evident Chain of Custody records
- Chronological Normalized Timeline Events
- Extracted Entities (Persons, Devices, Accounts, IPs, Hashes, USBs, Domains)
- Multi-Signal Explainable Correlations
- AI-Assisted Findings & Hypotheses (with human-in-the-loop review statuses)
- Investigative Gap Recommendations
- Connected Data Sources
- Complete Investigation Reports
- Background Processing Jobs & Audit Events
"""
import datetime
import hashlib
import json
import logging

from app.database.session import SessionLocal
from app.models import (
    AnalysisJob,
    AnalysisStatus,
    AuditEvent,
    CasePriority,
    CaseStatus,
    ChainOfCustody,
    CorrelationSignalType,
    CustodyAction,
    DataSource,
    EntityType,
    Evidence,
    EventType,
    ExtractionMethod,
    ExtractedEntityModel,
    FindingReviewStatus,
    IntegrityStatus,
    InvestigationCase,
    InvestigationCorrelation,
    InvestigationEvent,
    InvestigationFindingModel,
    InvestigationRecommendationModel,
    InvestigationReportModel,
    JobStatus,
    ProcessingJob,
    ProcessingStatus,
    RecommendationPriority,
    ReportFormat,
    SourceStatus,
    SourceType,
    User,
    UserRole,
)
from app.security.password import hash_password

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("synapsex.seeder")


def seed():
    with SessionLocal() as db:
        logger.info("Starting SynapseX Forensic Intelligence demo data seeding...")

        # 1. Ensure Default Users Exist
        lead_analyst = db.query(User).filter_by(email="analyst@adeip.local").first()
        if not lead_analyst:
            lead_analyst = User(
                full_name="Sr. Analyst (Lead Investigator)",
                email="analyst@adeip.local",
                password_hash=hash_password("Investigator123!"),
                role=UserRole.INVESTIGATOR,
                is_active=True,
            )
            db.add(lead_analyst)
            db.flush()
            logger.info("Created lead analyst user: analyst@adeip.local")

        supervisor = db.query(User).filter_by(email="supervisor@adeip.local").first()
        if not supervisor:
            supervisor = User(
                full_name="Director of Digital Forensics",
                email="supervisor@adeip.local",
                password_hash=hash_password("Investigator123!"),
                role=UserRole.SUPERVISOR,
                is_active=True,
            )
            db.add(supervisor)
            db.flush()
            logger.info("Created supervisor user: supervisor@adeip.local")

        now = datetime.datetime.now(datetime.timezone.utc)
        base_time = now - datetime.timedelta(days=2)

        # 2. Seed Cases
        cases_data = [
            {
                "case_number": "SYN-2026-0842",
                "title": "Operation Chimera — Exfiltration of Source Code & Core IP",
                "description": "Multi-vector investigation into lateral movement from compromised DMZ host, Kerberos ticket forgery, and encrypted archive staging to adversary C2 infrastructure (198.51.100.42).",
                "status": CaseStatus.ACTIVE,
                "priority": CasePriority.CRITICAL,
                "created_by": lead_analyst.id,
                "assigned_to_id": lead_analyst.id,
            },
            {
                "case_number": "SYN-2026-0791",
                "title": "BlackLotus UEFI Bootkit & Host Compromise",
                "description": "Triage of compromised endpoint WS-CORP-FIN-09 following detection of bypassed Secure Boot and abnormal Windows Event Log clearing activity.",
                "status": CaseStatus.UNDER_REVIEW,
                "priority": CasePriority.HIGH,
                "created_by": lead_analyst.id,
                "assigned_to_id": supervisor.id,
            },
            {
                "case_number": "SYN-2026-0650",
                "title": "Insider Threat — Unauthorized USB Media Extraction",
                "description": "Investigation into unauthorized SanDisk Ultra USB insertion into server SRV-DEV-DB02 during off-business hours (02:45 AM).",
                "status": CaseStatus.ACTIVE,
                "priority": CasePriority.MEDIUM,
                "created_by": lead_analyst.id,
                "assigned_to_id": lead_analyst.id,
            },
        ]

        created_cases = {}
        for c in cases_data:
            existing = db.query(InvestigationCase).filter_by(case_number=c["case_number"]).first()
            if not existing:
                existing = InvestigationCase(**c)
                db.add(existing)
                db.flush()
                logger.info(f"Seeded case: {existing.case_number} - {existing.title}")
            created_cases[c["case_number"]] = existing

        primary_case = created_cases["SYN-2026-0842"]
        case2 = created_cases["SYN-2026-0791"]
        case3 = created_cases["SYN-2026-0650"]

        # 3. Seed Evidence Artifacts for Primary Case
        evidence_data = [
            {
                "case_id": primary_case.id,
                "evidence_number": "EVD-2026-001",
                "original_filename": "dc01_security_events_4624_4769.evtx",
                "stored_filename": "dc01_security_events_4624_4769_vault.evtx",
                "storage_path": "storage/evidence_vault/dc01_security_events_4624_4769_vault.evtx",
                "mime_type": "application/x-ms-evtx",
                "file_size": 48291040,
                "sha256_hash": hashlib.sha256(b"dc01_evtx_evidence_payload_mock_data").hexdigest(),
                "processing_status": ProcessingStatus.COMPLETED,
                "integrity_status": IntegrityStatus.VERIFIED,
                "last_verified_at": now,
                "uploaded_by": lead_analyst.id,
            },
            {
                "case_id": primary_case.id,
                "evidence_number": "EVD-2026-002",
                "original_filename": "perimeter_firewall_egress_traffic.pcap",
                "stored_filename": "perimeter_firewall_egress_traffic_vault.pcap",
                "storage_path": "storage/evidence_vault/perimeter_firewall_egress_traffic_vault.pcap",
                "mime_type": "application/vnd.tcpdump.pcap",
                "file_size": 134217728,
                "sha256_hash": hashlib.sha256(b"pcap_firewall_traffic_payload").hexdigest(),
                "processing_status": ProcessingStatus.COMPLETED,
                "integrity_status": IntegrityStatus.VERIFIED,
                "last_verified_at": now,
                "uploaded_by": lead_analyst.id,
            },
            {
                "case_id": primary_case.id,
                "evidence_number": "EVD-2026-003",
                "original_filename": "sandisk_ultra_usb_forensic_dd.raw",
                "stored_filename": "sandisk_ultra_usb_forensic_dd_vault.raw",
                "storage_path": "storage/evidence_vault/sandisk_ultra_usb_forensic_dd_vault.raw",
                "mime_type": "application/octet-stream",
                "file_size": 8589934592,
                "sha256_hash": hashlib.sha256(b"sandisk_usb_raw_image_data").hexdigest(),
                "processing_status": ProcessingStatus.COMPLETED,
                "integrity_status": IntegrityStatus.VERIFIED,
                "last_verified_at": now,
                "uploaded_by": lead_analyst.id,
            },
            {
                "case_id": primary_case.id,
                "evidence_number": "EVD-2026-004",
                "original_filename": "cctv_server_room_vault_b_0245utc.mp4",
                "stored_filename": "cctv_server_room_vault_b_0245utc_vault.mp4",
                "storage_path": "storage/evidence_vault/cctv_server_room_vault_b_0245utc_vault.mp4",
                "mime_type": "video/mp4",
                "file_size": 268435456,
                "sha256_hash": hashlib.sha256(b"cctv_surveillance_mp4_camera_vault").hexdigest(),
                "processing_status": ProcessingStatus.COMPLETED,
                "integrity_status": IntegrityStatus.VERIFIED,
                "last_verified_at": now,
                "uploaded_by": lead_analyst.id,
            },
            {
                "case_id": primary_case.id,
                "evidence_number": "EVD-2026-005",
                "original_filename": "memory_dump_srv_app01.raw",
                "stored_filename": "memory_dump_srv_app01_vault.raw",
                "storage_path": "storage/evidence_vault/memory_dump_srv_app01_vault.raw",
                "mime_type": "application/octet-stream",
                "file_size": 17179869184,
                "sha256_hash": hashlib.sha256(b"memory_dump_srv_app01_sample_data").hexdigest(),
                "processing_status": ProcessingStatus.PROCESSING,
                "integrity_status": IntegrityStatus.VERIFIED,
                "last_verified_at": now,
                "uploaded_by": lead_analyst.id,
            },
        ]

        created_evidence = []
        for ev in evidence_data:
            existing = db.query(Evidence).filter_by(evidence_number=ev["evidence_number"]).first()
            if not existing:
                existing = Evidence(**ev)
                db.add(existing)
                db.flush()
                logger.info(f"Seeded evidence: {existing.evidence_number} - {existing.original_filename}")
            created_evidence.append(existing)

        ev_evtx = created_evidence[0]
        ev_pcap = created_evidence[1]
        ev_usb = created_evidence[2]
        ev_cctv = created_evidence[3]
        ev_mem = created_evidence[4]

        # 4. Chain of Custody Log
        for ev in created_evidence:
            existing_custody = db.query(ChainOfCustody).filter_by(evidence_id=ev.id).first()
            if not existing_custody:
                actions = [
                    (CustodyAction.EVIDENCE_UPLOADED, "Artifact acquired from scene and ingested into SynapseX Vault.", base_time + datetime.timedelta(hours=1)),
                    (CustodyAction.INTEGRITY_VERIFIED, f"Cryptographic verification passed. SHA-256: {ev.sha256_hash}", base_time + datetime.timedelta(hours=1, minutes=5)),
                    (CustodyAction.PROCESSING_STARTED, "Automated parsing and entity extraction initiated by AI Pipeline worker.", base_time + datetime.timedelta(hours=1, minutes=10)),
                    (CustodyAction.PROCESSING_COMPLETED, "Event extraction and timeline correlation complete.", base_time + datetime.timedelta(hours=1, minutes=25)),
                ]
                for act, detail, ts in actions:
                    rec = ChainOfCustody(
                        evidence_id=ev.id,
                        actor_id=lead_analyst.id,
                        action=act,
                        details=detail,
                        created_at=ts,
                    )
                    db.add(rec)
        db.flush()

        # 5. Timeline Investigation Events
        events_data = [
            {
                "case_id": primary_case.id,
                "evidence_id": ev_evtx.id,
                "event_type": EventType.AUTH_EVENT,
                "timestamp": base_time + datetime.timedelta(hours=2, minutes=15),
                "source": "Windows Security EventLog (DC01)",
                "entity_type": "user_account",
                "entity_value": "svc-backup",
                "metadata": json.dumps({
                    "event_id": 4624,
                    "logon_type": 3,
                    "workstation": "WS-FIN-09",
                    "ip_address": "10.0.4.15",
                    "status": "Successful Kerberos Ticket Request (TGS: krbtgt/CORP)",
                }),
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_evtx.id,
                "event_type": EventType.ALERT,
                "timestamp": base_time + datetime.timedelta(hours=2, minutes=22),
                "source": "Windows Defender Real-Time Protection",
                "entity_type": "device",
                "entity_value": "SRV-APP01",
                "metadata": json.dumps({
                    "threat_id": "Trojan:Win64/Meterpreter.enc",
                    "action_taken": "Tamper Protection alert: Set-MpPreference -DisableRealtimeMonitoring $true executed via PowerShell PID 4412",
                }),
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_cctv.id,
                "event_type": EventType.MEDIA_REGISTERED,
                "timestamp": base_time + datetime.timedelta(hours=2, minutes=41),
                "source": "CCTV Vault Corridor Camera 04",
                "entity_type": "location",
                "entity_value": "Server Room Vault B - West Wing",
                "metadata": json.dumps({
                    "badge_id": "BADGE-8842",
                    "person_detected": "Elena Rostova",
                    "camera_id": "CAM-WEST-04",
                    "status": "Badge entry outside normal shift hours",
                }),
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_usb.id,
                "event_type": EventType.FILE_OPERATION,
                "timestamp": base_time + datetime.timedelta(hours=2, minutes=44),
                "source": "USN Journal & Registry ShellBags",
                "entity_type": "file",
                "entity_value": "C:\\ProgramData\\Temp\\confidential_source_tree_v4.7z",
                "metadata": json.dumps({
                    "file_size": "1.42 GB",
                    "operation": "7z multi-volume archive created with AES-256 header encryption",
                    "origin_path": "D:\\Repository\\CoreEngine\\src\\",
                }),
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_usb.id,
                "event_type": EventType.SYSTEM_METRIC,
                "timestamp": base_time + datetime.timedelta(hours=2, minutes=45),
                "source": "SetupAPI.dev.log (Plug-and-Play)",
                "entity_type": "usb_device",
                "entity_value": "SanDisk Ultra USB 3.0 (SN: 4C5300012209141)",
                "metadata": json.dumps({
                    "vid": "0781",
                    "pid": "5581",
                    "drive_letter": "E:",
                    "action": "USB storage volume mounted on host SRV-APP01",
                }),
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_pcap.id,
                "event_type": EventType.NETWORK_CONNECTION,
                "timestamp": base_time + datetime.timedelta(hours=3, minutes=2),
                "source": "Palo Alto Perimeter Gateway",
                "entity_type": "ip_address",
                "entity_value": "198.51.100.42",
                "metadata": json.dumps({
                    "src_ip": "10.0.4.15",
                    "dst_ip": "198.51.100.42",
                    "dst_port": 443,
                    "protocol": "TLSv1.3",
                    "bytes_sent": 1524389012,
                    "domain": "api-telemetry-cdn.com",
                    "detection": "Long-lived encrypted data stream with zero certificate SAN match",
                }),
            },
        ]

        created_events = []
        for e_dict in events_data:
            existing = (
                db.query(InvestigationEvent)
                .filter_by(
                    case_id=e_dict["case_id"],
                    timestamp=e_dict["timestamp"],
                    entity_value=e_dict["entity_value"],
                )
                .first()
            )
            if not existing:
                existing = InvestigationEvent(**e_dict)
                db.add(existing)
                db.flush()
                logger.info(f"Seeded timeline event: {existing.timestamp} | {existing.entity_value}")
            created_events.append(existing)

        # 6. Extracted Entities
        entities_data = [
            {
                "case_id": primary_case.id,
                "evidence_id": ev_evtx.id,
                "event_id": created_events[0].id,
                "entity_type": EntityType.USER_ACCOUNT,
                "entity_value": "svc-backup",
                "normalized_value": "svc-backup@corp.internal",
                "extraction_method": ExtractionMethod.STRUCTURED_FIELD.value,
                "confidence": 0.98,
                "context": "Privileged service account utilized during unusual off-hours authentication.",
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_cctv.id,
                "event_id": created_events[2].id,
                "entity_type": EntityType.PERSON,
                "entity_value": "Elena Rostova",
                "normalized_value": "Elena Rostova (Staff Systems Engineer)",
                "extraction_method": ExtractionMethod.METADATA_INSPECTOR.value,
                "confidence": 0.88,
                "context": "Physical badge holder logged entering Server Vault Corridor B at 02:41 UTC.",
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_evtx.id,
                "event_id": created_events[1].id,
                "entity_type": EntityType.DEVICE,
                "entity_value": "SRV-APP01",
                "normalized_value": "srv-app01.corp.internal",
                "extraction_method": ExtractionMethod.STRUCTURED_FIELD.value,
                "confidence": 0.99,
                "context": "Core application server hosting production microservice containers and repository access.",
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_pcap.id,
                "event_id": created_events[5].id,
                "entity_type": EntityType.IP_ADDRESS,
                "entity_value": "198.51.100.42",
                "normalized_value": "198.51.100.42",
                "extraction_method": ExtractionMethod.REGEX_IPV4.value,
                "confidence": 1.0,
                "context": "Suspect external C2 server hosted in Seychelles (ASN 39821). Receiver of 1.42 GB stream.",
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_usb.id,
                "event_id": created_events[3].id,
                "entity_type": EntityType.FILE,
                "entity_value": "confidential_source_tree_v4.7z",
                "normalized_value": "confidential_source_tree_v4.7z",
                "extraction_method": ExtractionMethod.FILENAME_PARSER.value,
                "confidence": 0.95,
                "context": "Encrypted 7-Zip archive containing core proprietary algorithmic source files.",
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_usb.id,
                "event_id": created_events[4].id,
                "entity_type": EntityType.USB_DEVICE,
                "entity_value": "SanDisk Ultra USB 3.0 (SN: 4C5300012209141)",
                "normalized_value": "SanDisk Ultra USB 3.0",
                "extraction_method": ExtractionMethod.REGEX_USB.value,
                "confidence": 0.96,
                "context": "64GB external USB flash storage volume physically attached during staging window.",
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_cctv.id,
                "event_id": created_events[2].id,
                "entity_type": EntityType.LOCATION,
                "entity_value": "Server Room Vault B - West Wing",
                "normalized_value": "Server Room Vault B",
                "extraction_method": ExtractionMethod.STRUCTURED_FIELD.value,
                "confidence": 0.92,
                "context": "Restricted physical server enclosure containing direct terminal access console.",
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_pcap.id,
                "event_id": created_events[5].id,
                "entity_type": EntityType.DOMAIN,
                "entity_value": "api-telemetry-cdn.com",
                "normalized_value": "api-telemetry-cdn.com",
                "extraction_method": ExtractionMethod.STRUCTURED_FIELD.value,
                "confidence": 0.94,
                "context": "Adversarial domain mimicking legitimate Cloudflare telemetry endpoint.",
            },
            {
                "case_id": primary_case.id,
                "evidence_id": ev_usb.id,
                "event_id": created_events[3].id,
                "entity_type": EntityType.FILE_HASH,
                "entity_value": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "normalized_value": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "extraction_method": ExtractionMethod.REGEX_HASH.value,
                "confidence": 1.0,
                "context": "Cryptographic SHA-256 checksum of staged exfiltration bundle.",
            },
        ]

        for ent_dict in entities_data:
            existing = (
                db.query(ExtractedEntityModel)
                .filter_by(
                    case_id=ent_dict["case_id"],
                    entity_value=ent_dict["entity_value"],
                )
                .first()
            )
            if not existing:
                existing = ExtractedEntityModel(**ent_dict)
                db.add(existing)
                db.flush()
                logger.info(f"Seeded entity: [{existing.entity_type}] {existing.entity_value}")

        # 7. AI Findings & Structured Hypotheses
        findings_data = [
            {
                "case_id": primary_case.id,
                "finding_id": "FIND-2026-001",
                "title": "Staged Source Code Archive Transferred to Adversary Infrastructure",
                "category": "Data Exfiltration",
                "confidence_score": 0.94,
                "summary": "Multi-source evidence reveals that user account 'svc-backup' accessed confidential repository paths, created an encrypted archive ('confidential_source_tree_v4.7z'), and transferred 1.42 GB to external IP 198.51.100.42.",
                "observations": json.dumps([
                    "Outbound TLS transmission of 1,524,389,012 bytes observed in perimeter firewall capture.",
                    "7z archive creation timestamp exactly matches disk IO spike on SRV-APP01.",
                    "Target IP 198.51.100.42 is categorized as malicious in AbuseIPDB with 100% confidence.",
                ]),
                "potential_hypotheses": json.dumps([
                    "Targeted adversary breach leveraging compromised service credentials for intellectual property exfiltration.",
                    "Disgruntled insider operating under cover of service account privileges.",
                ]),
                "supporting_evidence_ids": json.dumps([ev_pcap.id, ev_usb.id, ev_evtx.id]),
                "supporting_event_ids": json.dumps([created_events[3].id, created_events[5].id]),
                "alternative_explanations": json.dumps([
                    "Automated cloud disaster recovery sync script improperly configured by DevOps team.",
                ]),
                "recommended_verification": json.dumps([
                    "Subpoena WHOIS and hosting logs for api-telemetry-cdn.com.",
                    "Acquire memory dump of SRV-APP01 to inspect process memory for active C2 beacon payloads.",
                ]),
                "limitations": json.dumps([
                    "Encrypted TLS payload contents cannot be read without server private key or TLS session keys.",
                ]),
                "review_status": FindingReviewStatus.ACCEPTED_AS_LEAD,
                "reviewed_by": supervisor.id,
                "reviewer_notes": "Corroborated by network team. Priority investigation lead.",
                "reviewed_at": now,
            },
            {
                "case_id": primary_case.id,
                "finding_id": "FIND-2026-002",
                "title": "Defense Evasion via Windows Defender Real-Time Disablement",
                "category": "Defense Evasion",
                "confidence_score": 0.89,
                "summary": "PowerShell command execution disabled real-time monitoring on SRV-APP01 immediately preceding the staging of exfiltration tools.",
                "observations": json.dumps([
                    "Defender Tamper Protection event recorded at 02:22 UTC.",
                    "PowerShell process tree indicates launch via parent WmiPrvSE.exe (WMI lateral execution).",
                ]),
                "potential_hypotheses": json.dumps([
                    "Adversary lateral movement via WMI/WinRM with administrative credentials.",
                ]),
                "supporting_evidence_ids": json.dumps([ev_evtx.id]),
                "supporting_event_ids": json.dumps([created_events[1].id]),
                "alternative_explanations": json.dumps([
                    "Authorized administrative maintenance window execution.",
                ]),
                "recommended_verification": json.dumps([
                    "Correlate with IT Change Management system tickets for maintenance schedule.",
                ]),
                "limitations": json.dumps([
                    "PowerShell Script Block Logging (EventID 4104) was partially truncated.",
                ]),
                "review_status": FindingReviewStatus.ACCEPTED_AS_LEAD,
                "reviewed_by": lead_analyst.id,
                "reviewer_notes": "Confirmed unauthorized; no change ticket was registered for this window.",
                "reviewed_at": now,
            },
            {
                "case_id": primary_case.id,
                "finding_id": "FIND-2026-003",
                "title": "Physical Entry into Server Vault B Correlating with USB Storage Attachment",
                "category": "Physical-Cyber Convergence",
                "confidence_score": 0.79,
                "summary": "Physical badge log entries in Corridor B coincide within 3 minutes of USB Mass Storage mount on local terminal in Vault B.",
                "observations": json.dumps([
                    "Badge swipe by Elena Rostova recorded at 02:41 UTC.",
                    "SanDisk Ultra USB mounted on console at 02:45 UTC.",
                ]),
                "potential_hypotheses": json.dumps([
                    "Physical access was used to attach physical drive and bypass perimeter network controls.",
                ]),
                "supporting_evidence_ids": json.dumps([ev_cctv.id, ev_usb.id]),
                "supporting_event_ids": json.dumps([created_events[2].id, created_events[4].id]),
                "alternative_explanations": json.dumps([
                    "Routine emergency on-call hardware replacement procedure.",
                ]),
                "recommended_verification": json.dumps([
                    "Conduct formal interview with badge holder Elena Rostova.",
                    "Inspect full CCTV sequence for secondary individuals in corridor.",
                ]),
                "limitations": json.dumps([
                    "CCTV camera angle does not show exact hand placement on rear USB ports.",
                ]),
                "review_status": FindingReviewStatus.NEEDS_MORE_ANALYSIS,
                "reviewed_by": lead_analyst.id,
                "reviewer_notes": "Requires interview and forensic extraction of workstation ShellBags.",
                "reviewed_at": now,
            },
            {
                "case_id": primary_case.id,
                "finding_id": "FIND-2026-004",
                "title": "Kerberos Service Ticket Forgery (Silver Ticket Potential)",
                "category": "Credential Access",
                "confidence_score": 0.84,
                "summary": "Kerberos TGS request issued with encryption type 0x17 (RC4-HMAC) while domain standard enforces AES-256.",
                "observations": json.dumps([
                    "Event 4769 logged on DC01 with Ticket Encryption Type 0x17.",
                    "Service Name cifs/srv-app01 requested without prior TGT renewal.",
                ]),
                "potential_hypotheses": json.dumps([
                    "Forged Silver Ticket constructed using compromised computer account NTLM hash.",
                ]),
                "supporting_evidence_ids": json.dumps([ev_evtx.id]),
                "supporting_event_ids": json.dumps([created_events[0].id]),
                "alternative_explanations": json.dumps([
                    "Legacy application client incapable of AES Kerberos negotiation.",
                ]),
                "recommended_verification": json.dumps([
                    "Check Kerberos policy audit flags across domain.",
                ]),
                "limitations": json.dumps([
                    "Key version number (kvno) validation required from Kerberos trace.",
                ]),
                "review_status": FindingReviewStatus.PENDING_REVIEW,
                "reviewed_by": None,
                "reviewer_notes": None,
                "reviewed_at": None,
            },
        ]

        for f_dict in findings_data:
            existing = db.query(InvestigationFindingModel).filter_by(finding_id=f_dict["finding_id"]).first()
            if not existing:
                existing = InvestigationFindingModel(**f_dict)
                db.add(existing)
                db.flush()
                logger.info(f"Seeded finding: {existing.finding_id} - {existing.title}")

        # 8. Correlations (Explainable Evidence Links)
        correlations_data = [
            {
                "case_id": primary_case.id,
                "correlation_id": "CORR-2026-001",
                "signal_type": CorrelationSignalType.MULTI_SIGNAL_CONVERGENCE.value,
                "title": "USB Storage Mount Converges with Archive Creation",
                "description": "Within a 58-second window, SanDisk USB volume mounted (02:45:00 UTC) and 7z multi-part archive written to disk (02:44:02 UTC).",
                "correlation_score": 0.92,
                "related_event_ids": json.dumps([created_events[3].id, created_events[4].id]),
                "related_entity_ids": json.dumps(["confidential_source_tree_v4.7z", "SanDisk Ultra USB 3.0 (SN: 4C5300012209141)"]),
                "supporting_evidence_ids": json.dumps([ev_usb.id]),
                "reasons": json.dumps([
                    "Exact temporal proximity (< 1 minute)",
                    "Shared file system target partition",
                    "Coincident process PID 3318 executing file copy",
                ]),
            },
            {
                "case_id": primary_case.id,
                "correlation_id": "CORR-2026-002",
                "signal_type": CorrelationSignalType.SAME_DEVICE.value,
                "title": "Service Account Session & Tamper Protection Evasion on SRV-APP01",
                "description": "Host SRV-APP01 logged both unauthorized Defender disabling and concurrent Kerberos ticket generation for 'svc-backup'.",
                "correlation_score": 0.88,
                "related_event_ids": json.dumps([created_events[0].id, created_events[1].id]),
                "related_entity_ids": json.dumps(["SRV-APP01", "svc-backup"]),
                "supporting_evidence_ids": json.dumps([ev_evtx.id]),
                "reasons": json.dumps([
                    "Identical destination hostname",
                    "Overlapping logon session GUID",
                ]),
            },
            {
                "case_id": primary_case.id,
                "correlation_id": "CORR-2026-003",
                "signal_type": CorrelationSignalType.TIMESTAMP_PROXIMITY.value,
                "title": "Corridor Badge Swipe Immediately Precedes Console Logon",
                "description": "Badge swipe at Server Room Vault B occurred 3 minutes and 50 seconds prior to interactive session creation.",
                "correlation_score": 0.78,
                "related_event_ids": json.dumps([created_events[2].id, created_events[4].id]),
                "related_entity_ids": json.dumps(["Elena Rostova", "Server Room Vault B - West Wing"]),
                "supporting_evidence_ids": json.dumps([ev_cctv.id, ev_usb.id]),
                "reasons": json.dumps([
                    "Physical presence aligns with subsequent keyboard console input",
                    "Off-hours anomaly",
                ]),
            },
        ]

        for corr_dict in correlations_data:
            existing = db.query(InvestigationCorrelation).filter_by(correlation_id=corr_dict["correlation_id"]).first()
            if not existing:
                existing = InvestigationCorrelation(**corr_dict)
                db.add(existing)
                db.flush()
                logger.info(f"Seeded correlation: {existing.correlation_id} - {existing.title}")

        # 9. Investigative Gap Recommendations
        recommendations_data = [
            {
                "case_id": primary_case.id,
                "recommendation_id": "REC-2026-001",
                "recommendation": "Acquire router NetFlow/IPFIX telemetry for Core Router RTR-01",
                "reason": "Verify whether additional data exfiltration streams were directed to alternative autonomous systems outside the 198.51.100.0/24 subnet.",
                "gap_type": "timeline_gap",
                "priority": RecommendationPriority.HIGH,
                "related_finding_id": "FIND-2026-001",
                "suggested_source": "Cisco Catalyst NetFlow v9 Collector",
            },
            {
                "case_id": primary_case.id,
                "recommendation_id": "REC-2026-002",
                "recommendation": "Extract and analyze Volatility 3 memory artifacts from SRV-APP01",
                "reason": "Recover unencrypted command-line strings and injected DLL payloads from LSASS process memory.",
                "gap_type": "missing_context",
                "priority": RecommendationPriority.CRITICAL,
                "related_finding_id": "FIND-2026-002",
                "suggested_source": "memory_dump_srv_app01.raw",
            },
            {
                "case_id": primary_case.id,
                "recommendation_id": "REC-2026-003",
                "recommendation": "Perform full BitLocker key audit on suspect USB media",
                "reason": "Confirm whether SanDisk Ultra device was provisioned by corporate IT or represents unauthorized personal hardware.",
                "gap_type": "unsupported_hypothesis",
                "priority": RecommendationPriority.MEDIUM,
                "related_finding_id": "FIND-2026-003",
                "suggested_source": "Corporate Endpoint Management Hardware Inventory",
            },
        ]

        for rec_dict in recommendations_data:
            existing = db.query(InvestigationRecommendationModel).filter_by(recommendation_id=rec_dict["recommendation_id"]).first()
            if not existing:
                existing = InvestigationRecommendationModel(**rec_dict)
                db.add(existing)
                db.flush()
                logger.info(f"Seeded recommendation: {existing.recommendation_id}")

        # 10. Connected Data Sources
        sources_data = [
            {
                "case_id": primary_case.id,
                "source_name": "Windows Event Forwarding (WEF) Subscription",
                "source_type": SourceType.SYSTEM_LOG,
                "status": SourceStatus.ACTIVE,
                "last_seen_at": now,
            },
            {
                "case_id": primary_case.id,
                "source_name": "Palo Alto Next-Gen Firewall Syslog Stream",
                "source_type": SourceType.NETWORK_LOG,
                "status": SourceStatus.ACTIVE,
                "last_seen_at": now,
            },
            {
                "case_id": primary_case.id,
                "source_name": "Physical Access Control CCTV Corridor Camera 04",
                "source_type": SourceType.CCTV_STREAM,
                "status": SourceStatus.ACTIVE,
                "last_seen_at": now,
            },
            {
                "case_id": primary_case.id,
                "source_name": "SynapseX Secure Evidence Vault (S3 / MinIO)",
                "source_type": SourceType.FILE_UPLOAD,
                "status": SourceStatus.ACTIVE,
                "last_seen_at": now,
            },
        ]

        for s_dict in sources_data:
            existing = db.query(DataSource).filter_by(case_id=s_dict["case_id"], source_name=s_dict["source_name"]).first()
            if not existing:
                existing = DataSource(**s_dict)
                db.add(existing)
                db.flush()
                logger.info(f"Seeded data source: {existing.source_name}")

        # 11. Investigation Reports
        existing_report = db.query(InvestigationReportModel).filter_by(case_id=primary_case.id).first()
        if not existing_report:
            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Forensic Intelligence Report — {primary_case.case_number}</title>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; padding: 32px; }}
                    h1, h2, h3 {{ color: #38bdf8; }}
                    .badge {{ background: #0284c7; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }}
                    .critical {{ background: #ef4444; }}
                    .card {{ background: #131b2e; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 24px; }}
                    table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
                    th, td {{ border: 1px solid #334155; padding: 10px; text-align: left; }}
                    th {{ background: #1e293b; color: #94a3b8; }}
                    .disclaimer {{ background: #7c2d12; border-left: 4px solid #f97316; padding: 12px; border-radius: 4px; margin-bottom: 20px; color: #ffedd5; font-size: 13px; }}
                </style>
            </head>
            <body>
                <div class="disclaimer">
                    <strong>LEGAL & FORENSIC NOTICE:</strong> AI-Assisted Draft — Requires Human Investigator Review. Automated findings represent probabilistic correlation leads and must be independently verified prior to judicial submission.
                </div>
                <h1>Forensic Intelligence Briefing — {primary_case.case_number}</h1>
                <p><strong>Title:</strong> {primary_case.title}</p>
                <p><strong>Classification:</strong> <span class="badge critical">CRITICAL PRIORITY</span> | <strong>Status:</strong> Active Investigation</p>
                
                <div class="card">
                    <h2>1. Executive Summary</h2>
                    <p>{primary_case.description}</p>
                    <p>Analysis confirmed the exfiltration of core proprietary source tree archives to external adversary command-and-control node <code>198.51.100.42</code> following privilege escalation on SRV-APP01.</p>
                </div>

                <div class="card">
                    <h2>2. Verified Evidence Artifacts</h2>
                    <table>
                        <tr><th>Evidence ID</th><th>Original Artifact</th><th>Size</th><th>Cryptographic Hash (SHA-256)</th><th>Integrity</th></tr>
                        <tr><td>EVD-2026-001</td><td>dc01_security_events_4624_4769.evtx</td><td>48.2 MB</td><td><code>{ev_evtx.sha256_hash[:20]}...</code></td><td>VERIFIED</td></tr>
                        <tr><td>EVD-2026-002</td><td>perimeter_firewall_egress_traffic.pcap</td><td>134.2 MB</td><td><code>{ev_pcap.sha256_hash[:20]}...</code></td><td>VERIFIED</td></tr>
                        <tr><td>EVD-2026-003</td><td>sandisk_ultra_usb_forensic_dd.raw</td><td>8.58 GB</td><td><code>{ev_usb.sha256_hash[:20]}...</code></td><td>VERIFIED</td></tr>
                    </table>
                </div>

                <div class="card">
                    <h2>3. Lead Findings & Hypotheses</h2>
                    <ul>
                        <li><strong>FIND-2026-001:</strong> Staged Source Code Archive Transferred to Adversary Infrastructure (Confidence: 94%)</li>
                        <li><strong>FIND-2026-002:</strong> Defense Evasion via Windows Defender Real-Time Disablement (Confidence: 89%)</li>
                        <li><strong>FIND-2026-003:</strong> Physical Entry into Server Vault B Correlating with USB Storage Attachment (Confidence: 79%)</li>
                    </ul>
                </div>
            </body>
            </html>
            """
            report_record = InvestigationReportModel(
                report_id="REP-SYN-2026-001",
                case_id=primary_case.id,
                title="Comprehensive Forensic Incident Briefing — Operation Chimera",
                report_format=ReportFormat.HTML,
                disclaimer="AI-Assisted Draft — Requires Human Investigator Review",
                report_data=json.dumps({
                    "case_number": primary_case.case_number,
                    "case_title": primary_case.title,
                    "total_evidence_count": len(created_evidence),
                    "total_events_count": len(created_events),
                    "findings_count": len(findings_data),
                    "lead_investigator": "analyst@adeip.local",
                }),
                html_content=html_content,
                generated_by=lead_analyst.id,
            )
            db.add(report_record)
            db.flush()
            logger.info("Seeded investigation report: REP-SYN-2026-001")

        # 12. Processing Jobs
        for i, ev in enumerate(created_evidence[:3]):
            existing_job = db.query(ProcessingJob).filter_by(evidence_id=ev.id).first()
            if not existing_job:
                pj = ProcessingJob(
                    celery_task_id=f"celery-task-syn-{ev.id}-{i}",
                    evidence_id=ev.id,
                    requested_by=lead_analyst.id,
                    status=JobStatus.COMPLETED,
                    events_extracted=1240 + i * 450,
                    started_at=base_time + datetime.timedelta(hours=1),
                    completed_at=base_time + datetime.timedelta(hours=1, minutes=15),
                )
                db.add(pj)
        db.flush()

        # 13. Audit Events
        audit_events = [
            ("user_login", "user", str(lead_analyst.id), "User logged in successfully from 127.0.0.1"),
            ("case_viewed", "investigation_case", str(primary_case.id), f"Investigator opened case {primary_case.case_number}"),
            ("evidence_uploaded", "evidence", str(ev_evtx.id), "dc01_security_events_4624_4769.evtx uploaded and hash verified"),
            ("report_generated", "investigation_report", "REP-SYN-2026-001", "Forensic Intelligence Briefing generated"),
        ]
        for act, r_type, r_id, det in audit_events:
            ae = AuditEvent(
                user_id=lead_analyst.id,
                action=act,
                resource_type=r_type,
                resource_id=r_id,
                details=det,
                ip_address="127.0.0.1",
            )
            db.add(ae)

        db.commit()
        logger.info("SynapseX Forensic Intelligence demo data successfully seeded into adeip.db!")


if __name__ == "__main__":
    seed()
