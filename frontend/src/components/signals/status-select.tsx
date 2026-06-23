"use client";

import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@signalscout/shared";

export function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: LeadStatus;
  onChange: (status: LeadStatus) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as LeadStatus)}
      className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:opacity-50"
    >
      {LEAD_STATUSES.map((status) => (
        <option key={status} value={status}>
          {LEAD_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
