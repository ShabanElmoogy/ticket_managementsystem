import type { Epic, LinkedTicket } from '../../../services/api/types';
import type { EpicFeature } from '../detail/types';

export function exportEpicToCsv(
  epic: Epic & {
    ownerName?: string | null;
    applicationName?: string | null;
    customerName?: string | null;
    featureCount: number;
    stepsTotal: number;
    stepsDone: number;
  },
  features: EpicFeature[],
  linkedTickets: LinkedTicket[]
): void {
  const csvRows: string[] = [];
  
  // Helper to escape CSV values
  const escape = (value: any): string => {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Epic metadata section
  csvRows.push('Epic Details');
  csvRows.push('Field,Value');
  csvRows.push(`Title,${escape(epic.title)}`);
  csvRows.push(`Description,${escape(epic.description || '')}`);
  csvRows.push(`Status,${escape(epic.status)}`);
  csvRows.push(`Priority,${escape(epic.priority)}`);
  csvRows.push(`Owner,${escape(epic.ownerName || '')}`);
  csvRows.push(`Application,${escape(epic.applicationName || '')}`);
  csvRows.push(`Customer,${escape(epic.customerName || '')}`);
  csvRows.push(`Target Date,${escape(epic.targetDate || '')}`);
  csvRows.push(`Estimated Days,${escape(epic.estimatedDays || '')}`);
  csvRows.push(`Created At,${escape(epic.createdAt)}`);
  csvRows.push(`Updated At,${escape(epic.updatedAt)}`);
  csvRows.push(`Tags,${escape((epic.tags || []).join('; '))}`);
  csvRows.push(`Feature Count,${epic.featureCount}`);
  csvRows.push(`Steps Total,${epic.stepsTotal}`);
  csvRows.push(`Steps Done,${epic.stepsDone}`);
  csvRows.push(`Progress,${epic.stepsTotal > 0 ? Math.round((epic.stepsDone / epic.stepsTotal) * 100) : 0}%`);
  csvRows.push('');

  // Features section
  if (features.length > 0) {
    csvRows.push('Linked Features');
    csvRows.push('Order,Title,Status,Application,Customer,Submitted By,Vote Count,Created At');
    features.forEach((feature, index) => {
      csvRows.push([
        index + 1,
        escape(feature.title),
        escape(feature.status),
        escape(feature.applicationName || ''),
        escape(feature.customerName || ''),
        escape(feature.submittedByName || ''),
        feature.voteCount || 0,
        escape(feature.createdAt),
      ].join(','));
    });
    csvRows.push('');
  }

  // Linked tickets section
  if (linkedTickets.length > 0) {
    csvRows.push('Linked Tickets');
    csvRows.push('ID,Title,Status,Priority,Customer,Assigned To,Created At');
    linkedTickets.forEach((ticket) => {
      csvRows.push([
        escape(ticket.id.slice(0, 8)),
        escape(ticket.title),
        escape(ticket.status),
        escape(ticket.priority),
        escape(ticket.customerName || ''),
        escape(ticket.assignedToName || ''),
        escape(ticket.createdAt),
      ].join(','));
    });
  }

  // Create and download file
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const safeName = epic.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `epic_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function exportMultipleEpicsToCsv(epics: Epic[]): void {
  const csvRows: string[] = [];
  
  const escape = (value: any): string => {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Header
  csvRows.push('Epic Summary Export');
  csvRows.push('Title,Status,Priority,Owner,Application,Customer,Target Date,Estimated Days,Feature Count,Steps Done,Steps Total,Progress %,Created At,Updated At');
  
  epics.forEach((epic) => {
    const progress = epic.stepsTotal > 0 ? Math.round((epic.stepsDone / epic.stepsTotal) * 100) : 0;
    csvRows.push([
      escape(epic.title),
      escape(epic.status),
      escape(epic.priority),
      escape(epic.ownerName || ''),
      escape(epic.applicationName || ''),
      escape(epic.customerName || ''),
      escape(epic.targetDate || ''),
      escape(epic.estimatedDays || ''),
      epic.featureCount,
      epic.stepsDone,
      epic.stepsTotal,
      progress,
      escape(epic.createdAt),
      escape(epic.updatedAt),
    ].join(','));
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `epics_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}