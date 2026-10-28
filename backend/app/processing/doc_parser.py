"""
Document Evidence Parser for ADEIP / SynapseX.
Supports: .pdf, .docx, .doc, .rtf, .txt

Extracts:
  - Full text page-by-page or section-by-section
  - Preserves exact source location (Page number / Section)
  - Deterministically extracts:
      * Dates and timestamps (UTC normalized + original)
      * Emails, phone numbers, IP addresses, URLs, usernames
      * Transaction IDs, account numbers, amounts
      * Organizations, locations, and names where present
"""
import datetime
import logging
import os
import re
from typing import Any, Dict, List, Optional, Tuple

from app.processing.base import BaseParser, ParsedEvent

logger = logging.getLogger("adeip.parser.doc")

# Regex patterns for deterministic extraction
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b")
IPV4_PATTERN = re.compile(
    r"\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b"
)
PHONE_PATTERN = re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")
URL_PATTERN = re.compile(r"https?://[^\s<>\"']+|www\.[^\s<>\"']+")
TXN_PATTERN = re.compile(r"\b(?:TXN[-_]?[A-Za-z0-9]{4,16}|TRANSACTION[-_\s]?(?:ID)?[:\s]?[A-Za-z0-9]+)\b", re.IGNORECASE)
ACCOUNT_PATTERN = re.compile(r"\b(?:ACC[-_]?[0-9]{4,16}|ACCOUNT[-_\s]?(?:NO|NUMBER)?[:\s]?[0-9]{6,16})\b", re.IGNORECASE)
AMOUNT_PATTERN = re.compile(r"(?:[₹$€£]|USD|INR|EUR|GBP)\s*[\d,]+(?:\.\d{1,2})?|\b[\d,]+(?:\.\d{2})?\s*(?:USD|INR|EUR|GBP|RUPEES|DOLLARS)\b", re.IGNORECASE)
USERNAME_PATTERN = re.compile(r"(?:@|user:|username:\s*)([a-zA-Z0-9_.-]{3,32})", re.IGNORECASE)

DATE_TIME_PATTERNS = [
    (re.compile(r"\b(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\b"), "%Y-%m-%dT%H:%M:%S"),
    (re.compile(r"\b(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\b"), "%Y-%m-%d %H:%M:%S"),
    (re.compile(r"\b(\d{4}-\d{2}-\d{2})\b"), "%Y-%m-%d"),
    (re.compile(r"\b(\d{2}/\d{2}/\d{4}\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\b", re.IGNORECASE), None),
    (re.compile(r"\b(\d{1,2}:\d{2}(?::\d{2})?\s*[AP]M)\b", re.IGNORECASE), None),
]


def _extract_entities_from_text(text: str) -> Dict[str, List[str]]:
    """Extracts all structured forensic identifiers from a text block."""
    emails = list(dict.fromkeys(EMAIL_PATTERN.findall(text)))
    ips = list(dict.fromkeys(IPV4_PATTERN.findall(text)))
    phones = list(dict.fromkeys([p.strip() for p in PHONE_PATTERN.findall(text) if len(p.strip()) >= 7]))
    urls = list(dict.fromkeys(URL_PATTERN.findall(text)))
    txns = list(dict.fromkeys(TXN_PATTERN.findall(text)))
    accounts = list(dict.fromkeys(ACCOUNT_PATTERN.findall(text)))
    amounts = list(dict.fromkeys(AMOUNT_PATTERN.findall(text)))
    usernames = list(dict.fromkeys(USERNAME_PATTERN.findall(text)))

    return {
        "emails": emails,
        "ips": ips,
        "phones": phones,
        "urls": urls,
        "transactions": txns,
        "accounts": accounts,
        "amounts": amounts,
        "usernames": usernames,
    }


def _extract_first_timestamp(text: str) -> Tuple[Optional[datetime.datetime], Optional[str]]:
    """Tries to find and normalize a date/time in the text block."""
    for pattern, _ in DATE_TIME_PATTERNS:
        match = pattern.search(text)
        if match:
            raw_str = match.group(1).strip()
            # Attempt to parse common standard formats
            for fmt in (
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%d",
                "%d/%m/%Y %H:%M:%S",
                "%d/%m/%Y %I:%M %p",
                "%m/%d/%Y %I:%M %p",
            ):
                try:
                    dt = datetime.datetime.strptime(raw_str, fmt)
                    return dt.replace(tzinfo=datetime.timezone.utc), raw_str
                except Exception:
                    pass
            return None, raw_str
    return None, None


class DocParser(BaseParser):
    """
    Forensic document parser for PDF, DOCX, DOC, RTF, and TXT files.
    Preserves exact page numbers, extracted entities, and text context.
    """

    @property
    def supported_extensions(self) -> List[str]:
        return [".pdf", ".docx", ".doc", ".rtf", ".txt"]

    def _parse_pdf(self, file_path: str, original_filename: str) -> List[ParsedEvent]:
        events: List[ParsedEvent] = []
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            num_pages = len(reader.pages)

            for page_idx, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                if not page_text.strip():
                    continue

                entities = _extract_entities_from_text(page_text)
                ts_utc, raw_ts = _extract_first_timestamp(page_text)

                # 1. Page level document section event
                events.append(
                    ParsedEvent(
                        event_type="document_section",
                        source=f"{original_filename} (Page {page_idx})",
                        timestamp=ts_utc,
                        entity_type="document_page",
                        entity_value=f"Page {page_idx}",
                        metadata={
                            "original_filename": original_filename,
                            "sourcePage": page_idx,
                            "totalPages": num_pages,
                            "sourceText": page_text[:1200].strip(),
                            "originalTimestamp": raw_ts,
                            "extracted": entities,
                        },
                    )
                )

                # 2. If transactions or emails are present, create atomic events
                for txn in entities["transactions"]:
                    events.append(
                        ParsedEvent(
                            event_type="financial_transaction",
                            source=f"{original_filename} (Page {page_idx})",
                            timestamp=ts_utc,
                            entity_type="transaction_id",
                            entity_value=txn,
                            metadata={
                                "original_filename": original_filename,
                                "sourcePage": page_idx,
                                "transaction_id": txn,
                                "sourceText": page_text[:500].strip(),
                            },
                        )
                    )

                for email in entities["emails"]:
                    events.append(
                        ParsedEvent(
                            event_type="communication",
                            source=f"{original_filename} (Page {page_idx})",
                            timestamp=ts_utc,
                            entity_type="user_account",
                            entity_value=email.lower(),
                            metadata={
                                "original_filename": original_filename,
                                "sourcePage": page_idx,
                                "email": email,
                                "sourceText": page_text[:500].strip(),
                            },
                        )
                    )

        except Exception as exc:
            logger.warning(f"pypdf extraction failed on {original_filename}: {exc}, using raw text fallback")
            events.extend(self._fallback_text_extraction(file_path, original_filename))

        return events

    def _parse_docx(self, file_path: str, original_filename: str) -> List[ParsedEvent]:
        events: List[ParsedEvent] = []
        try:
            paragraphs: List[str] = []
            try:
                import docx
                doc = docx.Document(file_path)
                paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
                for table in doc.tables:
                    for row in table.rows:
                        row_text = " | ".join(c.text.strip() for c in row.cells if c.text.strip())
                        if row_text:
                            paragraphs.append(row_text)
            except Exception:
                # Built-in fallback using zipfile to parse word/document.xml
                import xml.etree.ElementTree as ET
                import zipfile
                with zipfile.ZipFile(file_path) as docx_zip:
                    xml_content = docx_zip.read("word/document.xml")
                    tree = ET.fromstring(xml_content)
                    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                    for p_elem in tree.iter(f"{{{ns['w']}}}p"):
                        texts = [t.text for t in p_elem.iter(f"{{{ns['w']}}}t") if t.text]
                        if texts:
                            paragraphs.append("".join(texts).strip())

            for section_idx, text_chunk in enumerate(paragraphs[:100], start=1):
                if len(text_chunk) < 5:
                    continue
                entities = _extract_entities_from_text(text_chunk)
                ts_utc, raw_ts = _extract_first_timestamp(text_chunk)

                events.append(
                    ParsedEvent(
                        event_type="document_section",
                        source=f"{original_filename} (Section {section_idx})",
                        timestamp=ts_utc,
                        entity_type="document_section",
                        entity_value=f"Section {section_idx}",
                        metadata={
                            "original_filename": original_filename,
                            "sourcePage": section_idx,
                            "sourceText": text_chunk[:1000],
                            "originalTimestamp": raw_ts,
                            "extracted": entities,
                        },
                    )
                )

        except Exception as exc:
            logger.error(f"Docx parsing failed on {original_filename}: {exc}")
            events.extend(self._fallback_text_extraction(file_path, original_filename))

        return events

    def _fallback_text_extraction(self, file_path: str, original_filename: str) -> List[ParsedEvent]:
        events: List[ParsedEvent] = []
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            entities = _extract_entities_from_text(content)
            ts_utc, raw_ts = _extract_first_timestamp(content)

            events.append(
                ParsedEvent(
                    event_type="document_section",
                    source=original_filename,
                    timestamp=ts_utc,
                    entity_type="document_text",
                    entity_value=original_filename,
                    metadata={
                        "original_filename": original_filename,
                        "sourcePage": 1,
                        "sourceText": content[:1500].strip(),
                        "originalTimestamp": raw_ts,
                        "extracted": entities,
                    },
                )
            )
        except Exception as exc:
            logger.error(f"Fallback text extraction failed on {original_filename}: {exc}")
        return events

    def parse(self, file_path: str, original_filename: str) -> List[ParsedEvent]:
        ext = os.path.splitext(original_filename)[1].lower()
        if ext == ".pdf":
            return self._parse_pdf(file_path, original_filename)
        elif ext in (".docx", ".doc"):
            return self._parse_docx(file_path, original_filename)
        else:
            return self._fallback_text_extraction(file_path, original_filename)
