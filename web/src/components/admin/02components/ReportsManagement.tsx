import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useAuxData } from "../../../shared/hooks/useAuxData";
import { ticketsApi, customersApi, type Ticket, type Customer } from "../../../services/api";
import ReportsToolbar from "../reportsManagement/ReportsToolbar";
import ReportsTable from "../reportsManagement/components/ReportsTable";
import { reportTypes, type ReportType } from "../reportsManagement/types";
import { buildSummaryRows, buildCustomerStatusRows, buildCustomerActivityRows } from "../reportsManagement/rowBuilders";
import { getSummaryColumns, getCustomerStatusColumns, getCustomerActivityColumns, getTicketColumns } from "../reportsManagement/components/columns";
import { generatePdf } from "../reportsManagement/PdfGenerators";
import MyGridHeader from "../../common/MyGridHeader";
import AssessmentIcon from "@mui/icons-material/Assessment";

const ReportsManagement: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>("summary");

  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useAuxData<Ticket[]>(['reports-tickets'], () => ticketsApi.getTickets({}));

  const {
    data: customers = [],
    isLoading: customersLoading,
    refetch: refetchCustomers,
  } = useAuxData<Customer[]>(['reports-customers'], customersApi.getCustomers.bind(customersApi));

  const loading = ticketsLoading || customersLoading;

  const handleRefresh = () => {
    void refetchTickets();
    void refetchCustomers();
  };

  const summaryRows  = useMemo(() => buildSummaryRows(tickets, customers),        [tickets, customers]);
  const statusRows   = useMemo(() => buildCustomerStatusRows(tickets, customers),  [tickets, customers]);
  const activityRows = useMemo(() => buildCustomerActivityRows(tickets, customers),[tickets, customers]);

  const gridData = useMemo((): { rows: unknown[]; columns: GridColDef[] } => {
    switch (reportType) {
      case "summary":            return { rows: summaryRows,  columns: getSummaryColumns()         as unknown as GridColDef[] };
      case "customers-status":   return { rows: statusRows,   columns: getCustomerStatusColumns()  as unknown as GridColDef[] };
      case "customers-activity": return { rows: activityRows, columns: getCustomerActivityColumns() as unknown as GridColDef[] };
      case "tickets": default:   return { rows: tickets,      columns: getTicketColumns()           as unknown as GridColDef[] };
    }
  }, [reportType, summaryRows, statusRows, activityRows, tickets]);

  const rightActions = (
    <ReportsToolbar
      reportType={reportType}
      setReportType={setReportType}
      reportTypes={[...reportTypes]}
      onGeneratePdf={() => generatePdf(reportType, { summaryRows, statusRows, activityRows, tickets }, "Ticket Management System")}
      onRefresh={handleRefresh}
      disabled={loading}
    />
  );

  return (
    <Box>
      <MyGridHeader title="Reports" rightActions={rightActions} icon={AssessmentIcon} />
      <ReportsTable rows={gridData.rows} columns={gridData.columns} loading={loading} height={600} />
    </Box>
  );
};

export default ReportsManagement;
