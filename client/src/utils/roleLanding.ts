import type { UserRole } from '@/types'

/**
 * Landing route per role — where a user goes after login (and where "/" or an
 * unknown path redirects them). Each role lands on the view most relevant to
 * their job rather than the shared fleet-wide dashboard.
 */
export function landingPathForRole(role: UserRole | undefined): string {
  switch (role) {
    case 'farmer':
      return '/impact' // My Farm Value & Impact
    case 'lab_technician':
      return '/lab' // Laboratory Portal
    case 'vvb_auditor':
    case 'viewer':
      return '/dmrv/ledger' // Carbon Calculation Ledger (audit-first view)
    case 'admin':
    case 'field_officer':
    case 'agri_officer':
    default:
      return '/dashboard'
  }
}
