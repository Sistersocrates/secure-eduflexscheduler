// UI view access only. Firebase rules remain authoritative for every data operation.
const DASHBOARD_EMAILS = new Set([
  'danielle.staley3@gmail.com',
  'dastaley@rochesterschools.org'
]);

export const DASHBOARD_ROLES = Object.freeze([
  'student', 'teacher', 'counselor', 'specialist', 'admin'
]);

export const canSwitchDashboards = (user) => Boolean(
  user?.uid && user.emailVerified === true &&
  DASHBOARD_EMAILS.has((user.email || '').trim().toLowerCase())
);
