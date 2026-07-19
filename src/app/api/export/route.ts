import { NextRequest, NextResponse } from 'next/server';
import { getAuditChain } from '@/lib/aegis/audit';

export const runtime = 'nodejs';

/**
 * GET /api/export?format=csv|json
 *
 * Export the audit chain as a compliance report.
 *   - csv: machine-readable, for import into SIEM/compliance tools
 *   - json: structured, for programmatic consumption
 *
 * The report contains ONLY entity types + counts + metadata — never the
 * redacted values themselves. This is the "monetizable surface" from the
 * product plan: teams need exportable proof of what was redacted when.
 */
export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format') ?? 'csv';
  const chain = await getAuditChain();

  if (format === 'json') {
    return new NextResponse(JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalEntries: chain.length,
      integrityOk: !chain.some((e) => e.tampered),
      chain: chain.map((e) => ({
        seq: e.seq,
        timestamp: e.timestamp,
        entityTypesRedacted: e.entityTypesRedacted,
        entityCounts: e.entityCounts,
        destinationProvider: e.destinationProvider,
        inputCharCount: e.inputCharCount,
        previousHash: e.previousHash,
        currentHash: e.currentHash,
        tampered: e.tampered,
      })),
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="aegis-audit-${Date.now()}.json"`,
      },
    });
  }

  // CSV format
  const headers = [
    'seq',
    'timestamp',
    'entity_types_redacted',
    'entity_counts',
    'destination_provider',
    'input_char_count',
    'previous_hash',
    'current_hash',
    'tampered',
  ];
  const rows = chain.map((e) => [
    e.seq,
    e.timestamp,
    e.entityTypesRedacted.join(';'),
    JSON.stringify(e.entityCounts),
    e.destinationProvider,
    e.inputCharCount,
    e.previousHash,
    e.currentHash,
    e.tampered ? 'TRUE' : 'FALSE',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="aegis-audit-${Date.now()}.csv"`,
    },
  });
}

function csvEscape(val: unknown): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
