import React, { useMemo, useState } from 'react';
import { Box } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { useAuxData } from '../../../shared/hooks/useAuxData';
import { AppDataGrid, AppGridHeader } from '../../../shared/components';
import { ticketsApi } from '../ticketsManagement';
import { customersApi } from '../customersManagement';
import type { Ticket, Customer } from '../../../services/api';
import ReportsToolbar from './ReportsToolbar';
import { reportTypes, type ReportType } from './types';
import type { CustomerTicketsSummaryRow, CustomerStatusRow, CustomerActivityRow } from './types';
import { buildSummaryRows, buildCustomerStatusRows, buildCustomerActivityRows } from './rowBuilders';
import { getSummaryColumns, getCustomerStatusColumns, getCustomerActivityColumns, getTicketColumns } from './components/columns';
import { generatePdf } from './PdfGenerators';
import AssessmentIcon from '@mui/icons-material/Assessment';

type AnyRow = CustomerTicketsSummaryRow | CustomerStatusRow | CustomerActivityRow | Ticket;

const ReportsManagement: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('summary');

  const { data: tickets = [],   isLoading: ticketsLoading,   refetch: refetchTickets }   =
    useAuxData<Ticket[]>(['reports-tickets'],   () => ticketsApi.getTickets({}));

  const { data: customers = [], isLoading: customersLoading, refetch: refetchCustomers } =
    useAuxData<Customer[]>(['reports-customers'], customersApi.getCustomers.bind(customersApi));

  const loading = ticketsLoading || customersLoading;

  const handleRefresh = () => { void refetchTickets(); void refetchCustomers(); };

  const summaryRows  = useMemo(() => buildSummaryRows(tickets, customers),         [tickets, customers]);
  const statusRows   = useMemo(() => buildCustomerStatusRows(tickets, customers),   [tickets, customers]);
  const activityRows = useMemo(() => buildCustomerActivityRows(tickets, customers), [tickets, customers]);

  const gridData = useMemo((): { rows: AnyRow[]; columns: GridColDef<AnyRow>[] } => {
    switch (reportType) {
      case 'summary':            return { rows: summaryRows,  columns: getSummaryColumns()          as GridColDef<AnyRow>[] };
      case 'customers-status':   return { rows: statusRows,   columns: getCustomerStatusColumns()   as GridColDef<AnyRow>[] };
      case 'customers-activity': return { rows: activityRows, columns: getCustomerActivityColumns() as GridColDef<AnyRow>[] };
      case 'tickets': default:   return { rows: tickets,      columns: getTicketColumns()            as GridColDef<AnyRow>[] };
    }
  }, [reportType, summaryRows, statusRows, activityRows, tickets]);

  const rightActions = (
    <ReportsToolbar
      reportType={reportType}
      setReportType={setReportType}
      reportTypes={[...reportTypes]}
      onGeneratePdf={() => generatePdf(reportType, { summaryRows, statusRows, activityRows, tickets }, 'Ticket Management System')}
      onRefresh={handleRefresh}
      disabled={loading}
    />
  );

  return (
    <Box>
      <AppGridHeader title="Reports" rightActions={rightActions} icon={AssessmentIcon} />
      <AppDataGrid
        rows={gridData.rows}
        columns={gridData.columns}
        loading={loading}
        height={600}
      />
    </Box>
  );
};

export default ReportsManagement;
