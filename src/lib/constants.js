export const APP = {
  name: 'CivicPulse AI',
  tagline: 'From complaints to action.',
  version: '0.1.0',
  aiVersion: 'rules-v1',
};

export const AI_VERSION = 'rules-v1';

export const CLUSTER_CELL_SIZE = 0.003;
export const CLUSTER_WINDOW_DAYS = 30;
export const CLUSTER_MIN_REPORTS = 3;

export const DUPLICATE_RADIUS_METERS = 300;
export const DUPLICATE_WINDOW_DAYS = 21;
/**
 * Review floor for the seeded demo. `phases.md` §19 sanctions lowering this
 * from 0.68 to 0.62 when fewer than four seeded groups are surfaced; the seed
 * corpus otherwise produces zero review pairs. See D-009 in the decision log.
 */
export const DUPLICATE_REVIEW_THRESHOLD = 0.62;
export const DUPLICATE_STRONG_THRESHOLD = 0.82;

/**
 * Similarity is a weighted sum of four inspectable components. The weights are
 * frozen in `trd.md` §10.4 and rendered as bars in the duplicate evidence list.
 */
export const DUPLICATE_COMPONENT_WEIGHTS = {
  text: 0.55,
  category: 0.2,
  geo: 0.15,
  time: 0.1,
};

export const PRIORITY_BANDS = {
  P0: { label: 'Critical', tone: 'red', min: 80, slaHours: 4, citizen: 'Urgent — safety risk' },
  P1: { label: 'High', tone: 'amber', min: 60, slaHours: 24, citizen: 'High — treated as urgent' },
  P2: { label: 'Medium', tone: 'blue', min: 40, slaHours: 72, citizen: 'Medium — scheduled' },
  P3: { label: 'Low', tone: 'slate', min: 0, slaHours: 168, citizen: 'Low — routine' },
};

export const PRIORITY_ORDER = ['P0', 'P1', 'P2', 'P3'];

export const CATEGORIES = [
  { key: 'roads', label: 'Roads & Potholes', short: 'Roads', baseSeverity: 26 },
  { key: 'water', label: 'Water & Drainage', short: 'Water', baseSeverity: 30 },
  { key: 'waste', label: 'Waste Management', short: 'Waste', baseSeverity: 18 },
  { key: 'electricity', label: 'Streetlights & Electricity', short: 'Electricity', baseSeverity: 32 },
  { key: 'sanitation', label: 'Sanitation & Public Health', short: 'Sanitation', baseSeverity: 22 },
  { key: 'public_safety', label: 'Public Safety', short: 'Safety', baseSeverity: 38 },
  { key: 'other', label: 'Other', short: 'Other', baseSeverity: 12 },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((category) => [category.key, category]));

export const CATEGORY_FAMILIES = {
  roads: 'roads',
  water: 'water',
  sanitation: 'water',
  waste: 'waste',
  electricity: 'electricity',
  public_safety: 'safety',
  other: 'other',
};

export const STATUS_META = {
  submitted: { label: 'Submitted', citizenLabel: 'Received', tone: 'slate', order: 0 },
  triaged: { label: 'Triaged', citizenLabel: 'Under review', tone: 'blue', order: 1 },
  assigned: { label: 'Assigned', citizenLabel: 'Assigned', tone: 'teal', order: 2 },
  in_progress: { label: 'In progress', citizenLabel: 'In progress', tone: 'amber', order: 3 },
  resolved: { label: 'Resolved', citizenLabel: 'Resolved', tone: 'green', order: 4 },
  closed: { label: 'Closed', citizenLabel: 'Closed', tone: 'slate', order: 5 },
  rejected: { label: 'Rejected', citizenLabel: 'Not accepted', tone: 'red', order: 6 },
  duplicate: { label: 'Duplicate', citizenLabel: 'Linked to existing', tone: 'slate', order: 6 },
};

export const STATUS_KEYS = Object.keys(STATUS_META);

export const OPEN_STATUSES = ['submitted', 'triaged', 'assigned', 'in_progress'];

export const DEPARTMENTS = [
  'Public Works',
  'Drainage Cell',
  'Sanitation',
  'Electrical',
  'Public Safety',
  'Ward Office',
];

export const DEPARTMENT_BY_CATEGORY = {
  roads: 'Public Works',
  water: 'Drainage Cell',
  waste: 'Sanitation',
  electricity: 'Electrical',
  sanitation: 'Sanitation',
  public_safety: 'Public Safety',
  other: 'Ward Office',
};

export const ALLOWED_TRANSITIONS = {
  submitted: ['triaged', 'rejected', 'duplicate'],
  triaged: ['assigned', 'in_progress', 'rejected', 'duplicate'],
  assigned: ['in_progress', 'resolved', 'rejected', 'duplicate'],
  in_progress: ['resolved', 'rejected', 'duplicate'],
  resolved: ['closed'],
  closed: [],
  rejected: [],
  duplicate: [],
};

export const TRACKING_CODE_LENGTH = 6;
export const TRACKING_CODE_PATTERN = /^CP-[A-HJ-NP-Z2-9]{6}$/;

export const REPORT_IMAGE_BUCKET = 'report-images';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Primary navigation. AI Analysis is deliberately not a top-level item; it is
 * reached after submission, from the dashboard and from the admin queue.
 */
export const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/report', label: 'Report Issue' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/track', label: 'Track Complaint' },
  { to: '/admin', label: 'Admin' },
];
