export const APP = {
  name: 'CivicPulse AI',
  tagline: 'From complaints to action.',
  version: '0.1.0',
  aiVersion: 'rules-v1',
};

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
