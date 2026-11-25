// Utility functions for FeedbackLoop

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getSeverityBadgeClass(severity: string): string {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL_CONCERN':
    case 'CRITICAL':
      return 'bg-red-50 text-[#D95763] border border-red-200';
    case 'HIGH_CONCERN':
    case 'HIGH':
      return 'bg-amber-50 text-[#E7A33E] border border-amber-200';
    case 'WATCH':
    case 'MEDIUM':
      return 'bg-blue-50 text-[#1769AA] border border-blue-200';
    default:
      return 'bg-emerald-50 text-[#28A879] border border-emerald-200';
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status?.toUpperCase()) {
    case 'VERIFIED_RESOLVED':
    case 'COMPLETED':
      return 'bg-emerald-50 text-[#28A879] border border-emerald-200';
    case 'VERIFICATION_PENDING':
    case 'IN_PROGRESS':
      return 'bg-blue-50 text-[#1769AA] border border-blue-200';
    case 'ACTION_PLANNED':
    case 'UNDER_REVIEW':
      return 'bg-amber-50 text-[#E7A33E] border border-amber-200';
    case 'REOPENED':
      return 'bg-red-50 text-[#D95763] border border-red-200';
    default:
      return 'bg-slate-50 text-[#718096] border border-slate-200';
  }
}
