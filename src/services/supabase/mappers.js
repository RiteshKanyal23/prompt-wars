const FIELD_MAP = {
  referenceCode: 'reference_code',
  citizenId: 'citizen_id',
  priorityScore: 'priority_score',
  priorityBand: 'priority_band',
  clusterKey: 'cluster_key',
  duplicateOf: 'duplicate_of',
  duplicateConfirmed: 'duplicate_confirmed',
  assignedTo: 'assigned_to',
  slaDueAt: 'sla_due_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  resolvedAt: 'resolved_at',
  imageUrl: 'image_url',
  locationLabel: 'location_label',
};

export function mapReport(row) {
  if (!row) return null;
  const report = { ...row };
  for (const [domain, column] of Object.entries(FIELD_MAP)) {
    report[domain] = row[column];
    delete report[column];
  }
  return report;
}

export function toRow(input = {}) {
  const row = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    row[FIELD_MAP[key] ?? key] = value;
  }
  return row;
}
