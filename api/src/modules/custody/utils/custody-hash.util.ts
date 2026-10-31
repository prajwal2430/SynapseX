import * as crypto from 'crypto';

export interface CustodyHashPayload {
  evidenceId: string;
  caseId: string;
  action: string;
  actorId: string;
  timestamp: string | Date;
  sequenceNumber: number;
  previousRecordHash: string;
  metadata?: Record<string, any>;
}

/**
 * Sorts object keys recursively to produce a deterministic JSON string.
 */
export function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalStringify(item)).join(',')}]`;
  }

  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`,
  );
  return `{${pairs.join(',')}}`;
}

/**
 * Deterministically generates a SHA-256 digest for a custody record.
 * Guarantees mathematical tamper-evidence: any modification to actor,
 * action, metadata, timestamp, or previous hash breaks the cryptographic chain.
 */
export function computeCustodyRecordHash(payload: CustodyHashPayload): string {
  const timestampIso =
    payload.timestamp instanceof Date
      ? payload.timestamp.toISOString()
      : new Date(payload.timestamp).toISOString();

  const canonicalPayload = [
    `evidenceId:${payload.evidenceId}`,
    `caseId:${payload.caseId}`,
    `action:${payload.action}`,
    `actorId:${payload.actorId}`,
    `timestamp:${timestampIso}`,
    `sequenceNumber:${payload.sequenceNumber}`,
    `previousRecordHash:${payload.previousRecordHash}`,
    `metadata:${canonicalStringify(payload.metadata || {})}`,
  ].join('|');

  return crypto
    .createHash('sha256')
    .update(canonicalPayload, 'utf8')
    .digest('hex');
}
