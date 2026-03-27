// config/statItems.ts - Updated to ensure all items have percentage
import {
  ConfirmationNumber as TotalIcon,
  FiberNew as OpenIcon,
  Autorenew as ProgressIcon,
  CheckCircle as ResolvedIcon,
  Cancel as ClosedIcon,
  QueryBuilder as AccuracyIcon,
} from "@mui/icons-material";
import { type StatItem, type DashboardStats } from "../components/dashboard/types/types";
import useMediaQuery from "@mui/material/useMediaQuery";

export const CreateStatItems = (stats: DashboardStats): StatItem[] => {
  const isMobile = useMediaQuery("(max-width: 800px)");
  return [
    {
      title: isMobile ? "Tickets" : "Total Tickets",
      value: stats.totalTickets,
      icon: TotalIcon,
      color: "#2563eb",
      bgColor: "rgba(37, 99, 235, 0.1)",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      percentage: 100, // Total is always 100%
    },
    {
      title: isMobile ? "Open" : "Open Tickets",
      value: stats.openTickets,
      icon: OpenIcon,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)",
      gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
      percentage:
        stats.totalTickets > 0
          ? (stats.openTickets / stats.totalTickets) * 100
          : 0,
    },
    {
      title: "In Progress",
      value: stats.inProgressTickets,
      icon: ProgressIcon,
      color: "#7c3aed",
      bgColor: "rgba(124, 58, 237, 0.1)",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      percentage:
        stats.totalTickets > 0
          ? (stats.inProgressTickets / stats.totalTickets) * 100
          : 0,
    },
    {
      title: "Resolved",
      value: stats.resolvedTickets,
      icon: ResolvedIcon,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)",
      gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
      percentage:
        stats.totalTickets > 0
          ? (stats.resolvedTickets / stats.totalTickets) * 100
          : 0,
    },
    {
      title: "Closed",
      value: stats.closedTickets,
      icon: ClosedIcon,
      color: "#6b7280",
      bgColor: "rgba(107, 114, 128, 0.1)",
      gradient: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)",
      percentage:
        stats.totalTickets > 0
          ? (stats.closedTickets / stats.totalTickets) * 100
          : 0,
    },
    ...(stats.avgEstimationAccuracy != null
      ? [{
          title: "Est. Accuracy",
          value: stats.avgEstimationAccuracy,
          icon: AccuracyIcon,
          color: stats.avgEstimationAccuracy <= 110 ? "#10b981" : "#ef4444",
          bgColor: stats.avgEstimationAccuracy <= 110 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          gradient: stats.avgEstimationAccuracy <= 110
            ? "linear-gradient(135deg, #34d399 0%, #10b981 100%)"
            : "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
          percentage: Math.min(stats.avgEstimationAccuracy, 100),
          suffix: "%",
        }]
      : []),
  ];
};
