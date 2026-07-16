'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ENTITY_META, type EntityType } from '@/lib/aegis/types';
import { maskValue } from './masked-value';

interface EntityChipProps {
  type: EntityType;
  /** When provided, the value is masked and shown alongside the type label. */
  value?: string;
  /** Show the raw value (no masking). Use sparingly. */
  rawValue?: boolean;
  /** Confidence 0..1 — when provided, shown as a small percentage. */
  confidence?: number;
  className?: string;
  /** Render as inline `<span>` (default) or block. */
  as?: 'span' | 'div';
}

/**
 * EntityChip — the canonical way to render an entity anywhere in the UI.
 * Uses the `.entity-XXX` + `.entity-chip` utilities from globals.css so the
 * colour is always consistent with the ENTITY_META palette.
 */
export function EntityChip({
  type,
  value,
  rawValue = false,
  confidence,
  className,
  as = 'span',
}: EntityChipProps) {
  const meta = ENTITY_META[type];
  const Comp = as;
  const displayValue = value ? (rawValue ? value : maskValue(value)) : null;

  return (
    <Comp
      className={cn(
        'entity-chip entity-' + type,
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium aegis-mono',
        className,
      )}
      title={meta.description}
    >
      <span className="opacity-70 uppercase tracking-wide text-[10px]">
        {meta.label}
      </span>
      {displayValue && (
        <span className="border-l border-current/30 pl-1.5">{displayValue}</span>
      )}
      {typeof confidence === 'number' && (
        <span className="opacity-70 text-[10px]">
          {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </Comp>
  );
}

/** A small coloured dot that matches the entity palette — for legend UIs. */
export function EntityDot({ type, className }: { type: EntityType; className?: string }) {
  return (
    <span
      className={cn(
        'entity-' + type,
        'inline-block size-2 rounded-full',
        className,
      )}
      style={{ background: 'var(--ec)' }}
    />
  );
}
