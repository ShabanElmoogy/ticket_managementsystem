import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useAuthStore } from "../../../stores/authStore";
import { ticketsApi, customersApi, type Ticket, type Customer } from "../../../services/api";

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
import MyGridHeader from "../../common/MyGridHeader";
import AssessmentIcon from "@mui/icons-material/Assessment";

const ReportsManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [auxLoading, setAuxLoading] = useState<boolean>(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reportType, setReportType] = useState<ReportType>("summary");

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await ticketsApi.getTickets({});
      setTickets(data);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAuxData = useCallback(async () => {
    if (!token) return;
    setAuxLoading(true);
    try {
      const data = await customersApi.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch auxiliary data", error);
    } finally {
      setAuxLoading(false);
    }
  }, [token]);

  const handleRefresh = useCallback(() => {
    fetchTickets();
    fetchAuxData();
  }, [fetchTickets, fetchAuxData]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Build rows for each report shape
  const summaryRows = useMemo(
    () => buildSummaryRows(tickets, customers),
    [tickets, customers]
  );
  const statusRows = useMemo(
    () => buildCustomerStatusRows(tickets, customers),
    [tickets, customers]
  );
  const activityRows = useMemo(
    () => buildCustomerActivityRows(tickets, customers),
    [tickets, customers]
  );

  // Select rows and columns by report type
  const gridData = useMemo((): { rows: unknown[]; columns: GridColDef[] } => {
    switch (reportType) {
      case "summary":
        return {
          rows: summaryRows,
          columns: getSummaryColumns() as unknown as GridColDef[],
        };
      case "customers-status":
        return {
          rows: statusRows,
          columns: getCustomerStatusColumns() as unknown as GridColDef[],
        };
      case "customers-activity":
        return {
          rows: activityRows,
          columns: getCustomerActivityColumns() as unknown as GridColDef[],
        };
      case "tickets":
      default:
        return {
          rows: tickets,
          columns: getTicketColumns() as unknown as GridColDef[],
        };
    }
  }, [reportType, summaryRows, statusRows, activityRows, tickets]);

  const handleGeneratePdf = () => {
    const companyName = "Ticket Management System";
    generatePdf(
      reportType,
      { summaryRows, statusRows, activityRows, tickets },
      companyName
    );
  };

  const rightActions = (
    <ReportsToolbar
      reportType={reportType}
      setReportType={setReportType}
      reportTypes={[...reportTypes]}
      onGeneratePdf={handleGeneratePdf}
      onRefresh={handleRefresh}
      disabled={loading || auxLoading}
    />
  );

  return (
    <Box>
      <MyGridHeader
        title="Reports"
        rightActions={rightActions}
        icon={AssessmentIcon}
      />
      {/* 
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        {reportType === "summary" &&
          "Aggregated counts of tickets per customer."}
        {reportType === "customers-status" &&
          "Open/in-progress/resolved/closed breakdown per customer with percentages."}
        {reportType === "customers-activity" &&
          "Created and closed tickets per customer over last 7 and 30 days."}
        {reportType === "tickets" && "All tickets list with details."}
      </Typography> */}

      <ReportsTable
        rows={gridData.rows}
        columns={gridData.columns}
        loading={loading || auxLoading}
        height={600}
      />
    </Box>
  );
};

export default ReportsManagement;
