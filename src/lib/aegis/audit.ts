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
 */
export async function tamperEntry(seq: number): Promise<void> {
  // Corrupt the entityCounts payload (simulating someone editing the log after the fact).
  const row = await db.auditLogEntry.findUnique({ where: { seq } });
  if (!row) return;
  const corruptedCounts = JSON.stringify({ ...JSON.parse(row.entityCounts || '{}'), _tampered: true });
  await db.auditLogEntry.update({
    where: { seq },
    data: { entityCounts: corruptedCounts },
  });
}

/** Repair the chain by re-appending all entries from the broken point with corrected hashes. */
export async function repairChain(): Promise<void> {
  const rows = await db.auditLogEntry.findMany({ orderBy: { seq: 'asc' } });
  let previousHash = '0'.repeat(64);
  for (const row of rows) {
    const timestampISO = row.timestamp.toISOString();
    const recomputed = computeHash(
      previousHash,
      timestampISO,
      row.entityTypesRedacted,
      row.entityCounts,
      row.destinationProvider,
    );
    await db.auditLogEntry.update({
      where: { seq: row.seq },
      data: { previousHash, currentHash: recomputed },
    });
    previousHash = recomputed;
  }
}

/** Reset the chain — wipes all entries. Used by the dashboard "reset" button. */
export async function clearChain(): Promise<void> {
  await db.auditLogEntry.deleteMany({});
}
