import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import AdminGridHeader from "../../common/AdminGridHeader";
import type { GridColDef } from "@mui/x-data-grid";
import { useAuthStore } from "../../../stores/authStore";
import { apiService, type Ticket, type Customer } from "../../../services/api";

import ReportsToolbar from "../reportsManagement/ReportsToolbar";
import ReportsTable from "../reportsManagement/components/ReportsTable";
import { reportTypes, type ReportType } from "../reportsManagement/types";
import {
  buildSummaryRows,
  buildCustomerStatusRows,
  buildCustomerActivityRows,
} from "../reportsManagement/rowBuilders";
import {
  getSummaryColumns,
  getCustomerStatusColumns,
  getCustomerActivityColumns,
  getTicketColumns,
} from "../reportsManagement/components/columns";
import { generatePdf } from "../reportsManagement/PdfGenerators";

const ReportsManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reportType, setReportType] = useState<ReportType>("summary");

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [ticketsData, customersData] = await Promise.all([
        apiService.getTickets(token, {}),
        apiService.getCustomers(token),
      ]);
      setTickets(ticketsData);
      setCustomers(customersData);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build rows for each report shape
  const summaryRows = useMemo(() => buildSummaryRows(tickets, customers), [tickets, customers]);
  const statusRows = useMemo(() => buildCustomerStatusRows(tickets, customers), [tickets, customers]);
  const activityRows = useMemo(() => buildCustomerActivityRows(tickets, customers), [tickets, customers]);

  // Select rows and columns by report type
  const gridData = useMemo((): { rows: any[]; columns: GridColDef[] } => {
    switch (reportType) {
      case "summary":
        return { rows: summaryRows, columns: getSummaryColumns() as unknown as GridColDef[] };
      case "customers-status":
        return { rows: statusRows, columns: getCustomerStatusColumns() as unknown as GridColDef[] };
      case "customers-activity":
        return { rows: activityRows, columns: getCustomerActivityColumns() as unknown as GridColDef[] };
      case "tickets":
      default:
        return { rows: tickets, columns: getTicketColumns() as unknown as GridColDef[] };
    }
  }, [reportType, summaryRows, statusRows, activityRows, tickets]);

  const handleGeneratePdf = () => {
    const companyName = "Ticket Management System";
    generatePdf(reportType, { summaryRows, statusRows, activityRows, tickets }, companyName);
  };

  const rightActions = (
    <ReportsToolbar
      reportType={reportType}
      setReportType={setReportType}
      reportTypes={reportTypes as any}
      onGeneratePdf={handleGeneratePdf}
      onRefresh={fetchData}
      disabled={loading}
    />
  );

  return (
    <Box>
      <AdminGridHeader title="Reports" rightActions={rightActions} />
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        {reportType === "summary" && "Aggregated counts of tickets per customer."}
        {reportType === "customers-status" && "Open/in-progress/resolved/closed breakdown per customer with percentages."}
        {reportType === "customers-activity" && "Created and closed tickets per customer over last 7 and 30 days."}
        {reportType === "tickets" && "All tickets list with details."}
      </Typography>

      <ReportsTable
        rows={gridData.rows}
        columns={gridData.columns}
        loading={loading}
        height={600}
      />
    </Box>
  );
};

export default ReportsManagement;
