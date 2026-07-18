import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import type { AuditLogEntry, EntityType } from './types';

/**
 * Audit hash chain.
 *
 * currentHash = SHA-256(previousHash + timestamp + entityTypesRedacted + entityCounts + destinationProvider)
 *
 * The chain is append-only. On read, we re-walk it: if any entry's recomputed hash
 * ≠ stored hash, that entry (and all after it) is flagged tampered.
 *
 * CRITICAL: only entity TYPES and COUNTS are stored — never the redacted values.
 */

interface CreateEntryInput {
  entityTypesRedacted: EntityType[];
  entityCounts: Record<string, number>;
  destinationProvider: string;
  inputCharCount: number;
}

function computeHash(
  previousHash: string,
  timestamp: string,
  entityTypesRedacted: string,
  entityCounts: string,
  destinationProvider: string,
): string {
  const payload = `${previousHash}|${timestamp}|${entityTypesRedacted}|${entityCounts}|${destinationProvider}`;
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

/** Create + append a new audit entry. Returns the formatted entry. */
export async function appendAuditEntry(input: CreateEntryInput): Promise<AuditLogEntry> {
  // Read the current tail to get previousHash + next seq.
  const tail = await db.auditLogEntry.findFirst({
    orderBy: { seq: 'desc' },
  });
  const seq = (tail?.seq ?? 0) + 1;
  const previousHash = tail?.currentHash ?? '0'.repeat(64); // genesis previous = zeros
  const timestampISO = new Date().toISOString();

  const entityTypesStr = input.entityTypesRedacted.join(',');
  const entityCountsStr = JSON.stringify(input.entityCounts);
  const currentHash = computeHash(
    previousHash,
    timestampISO,
    entityTypesStr,
    entityCountsStr,
    input.destinationProvider,
  );

  const row = await db.auditLogEntry.create({
    data: {
      seq,
      timestamp: new Date(timestampISO),
      entityTypesRedacted: entityTypesStr,
      entityCounts: entityCountsStr,
      destinationProvider: input.destinationProvider,
      inputCharCount: input.inputCharCount,
      previousHash,
      currentHash,
    },
  });

  return {
    id: row.id,
    seq: row.seq,
    timestamp: row.timestamp.toISOString(),
    entityTypesRedacted: input.entityTypesRedacted,
    entityCounts: input.entityCounts,
    destinationProvider: input.destinationProvider,
    inputCharCount: row.inputCharCount,
    previousHash: row.previousHash,
    currentHash: row.currentHash,
    tampered: false,
  };
}

/**
 * Read the full chain and re-verify integrity.
 * An entry is tampered if its stored currentHash ≠ recomputed hash, OR if its
 * previousHash ≠ the prior entry's currentHash. Once broken, all subsequent entries
 * are also flagged tampered (the chain is broken from that point on).
 */
export async function getAuditChain(): Promise<AuditLogEntry[]> {
  const rows = await db.auditLogEntry.findMany({
    orderBy: { seq: 'asc' },
  });

  const out: AuditLogEntry[] = [];
  let chainBroken = false;
  let expectedPrevHash = '0'.repeat(64);

  for (const row of rows) {
    const recomputed = computeHash(
      row.previousHash,
      row.timestamp.toISOString(),
      row.entityTypesRedacted,
      row.entityCounts,
      row.destinationProvider,
    );

    const hashMatches = recomputed === row.currentHash;
    const linkMatches = row.previousHash === expectedPrevHash;
    const tampered = chainBroken || !hashMatches || !linkMatches;

    if (tampered) chainBroken = true;

    out.push({
      id: row.id,
      seq: row.seq,
      timestamp: row.timestamp.toISOString(),
      entityTypesRedacted: row.entityTypesRedacted
        ? (row.entityTypesRedacted.split(',').filter(Boolean) as EntityType[])
        : [],
      entityCounts: row.entityCounts ? JSON.parse(row.entityCounts) : {},
      destinationProvider: row.destinationProvider,
      inputCharCount: row.inputCharCount,
      previousHash: row.previousHash,
      currentHash: row.currentHash,
      tampered,
    });

    expectedPrevHash = row.currentHash;
  }

  return out;
}

/**
 * Tamper demo: deliberately corrupt a specific entry's stored payload so that its
 * recomputed hash no longer matches. This should cascade and flag all subsequent
 * entries as tampered on the next read.
 *
 * We corrupt by SHIFTING the entityCounts (adding a fake entry) rather than
 * adding a `_tampered` marker, so that `repair` can distinguish a corrupted
 * entry (needs restoration) from a legitimately-edited one.
 */
export async function tamperEntry(seq: number): Promise<void> {
  const row = await db.auditLogEntry.findUnique({ where: { seq } });
  if (!row) return;
  // Parse, add a fake entity count that wasn't in the original, re-stringify.
  // The stored currentHash stays the same → recomputed hash won't match.
  const counts = JSON.parse(row.entityCounts || '{}');
  counts._corrupted = true;
  await db.auditLogEntry.update({
    where: { seq },
    data: { entityCounts: JSON.stringify(counts) },
  });
}

/**
 * Repair the chain: strip corruption markers, restore legitimate entityCounts,
 * then re-hash every entry so the chain is internally consistent again.
 */
export async function repairChain(): Promise<void> {
  const rows = await db.auditLogEntry.findMany({ orderBy: { seq: 'asc' } });
  let previousHash = '0'.repeat(64);
  for (const row of rows) {
    // Strip the corruption marker from entityCounts before re-hashing.
    const counts = JSON.parse(row.entityCounts || '{}');
    if ('_corrupted' in counts) {
      delete counts._corrupted;
    }
    const cleanCounts = JSON.stringify(counts);
    const timestampISO = row.timestamp.toISOString();
    const recomputed = computeHash(
      previousHash,
      timestampISO,
      row.entityTypesRedacted,
      cleanCounts,
      row.destinationProvider,
    );
    await db.auditLogEntry.update({
      where: { seq: row.seq },
      data: { previousHash, currentHash: recomputed, entityCounts: cleanCounts },
    });
    previousHash = recomputed;
  }
}

/** Reset the chain — wipes all entries. Used by the dashboard "reset" button. */
export async function clearChain(): Promise<void> {
  await db.auditLogEntry.deleteMany({});
}
