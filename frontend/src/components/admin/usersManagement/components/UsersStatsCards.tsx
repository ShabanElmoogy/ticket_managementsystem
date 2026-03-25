import React from "react";
import { Card, CardContent, Box, Fade, useTheme } from "@mui/material";
import type { UserStats } from "../../../../services/api";
import StatCard from "../../../common/StatCard";
import type { StatItem } from "../../../../types/dashboard";
import {
  PeopleAlt as TotalIcon,
  VerifiedUser as ActiveIcon,
  AdminPanelSettings as AdminsIcon,
  Group as EmployeesIcon,
  Code as ProgrammerIcon,
} from "@mui/icons-material";

interface UsersStatsCardsProps {
  stats: UserStats;
}

const createUserStatItems = (stats: UserStats): StatItem[] => {
  const total = stats.total || 0;
  return [
    {
      title: "Total Users",
      value: total,
      icon: TotalIcon,
      color: "#2563eb",
      bgColor: "rgba(37, 99, 235, 0.1)",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      percentage: 100,
    },
    {
      title: "Active Users",
      value: stats.active || 0,
      icon: ActiveIcon,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)",
      gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
      percentage: total > 0 ? (stats.active / total) * 100 : 0,
    },
    {
      title: "Administrators",
      value: stats.byRole?.TENANT_ADMIN || 0,
      icon: AdminsIcon,
      color: "#7c3aed",
      bgColor: "rgba(124, 58, 237, 0.1)",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      percentage:
        total > 0 ? ((stats.byRole?.TENANT_ADMIN || 0) / total) * 100 : 0,
    },
    {
      title: "Employees",
      value: stats.byRole?.EMPLOYEE || 0,
      icon: EmployeesIcon,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)",
      gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
      percentage:
        total > 0 ? ((stats.byRole?.EMPLOYEE || 0) / total) * 100 : 0,
    },
    {
      title: "Programmers",
      value: stats.byRole?.PROGRAMMER || 0,
      icon: ProgrammerIcon,
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.1)",
      gradient: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
      percentage:
        total > 0 ? ((stats.byRole?.PROGRAMMER || 0) / total) * 100 : 0,
    },
  ];
};

const UsersStatsCards: React.FC<UsersStatsCardsProps> = ({ stats }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const statItems = createUserStatItems(stats);

  return (
    <Fade in={true} timeout={300}>
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          width: "100%",
          overflow: "hidden",
        }}
      >
        <CardContent
          sx={{
            p: { xs: 1, sm: 3 },
            "&:last-child": { pb: { xs: 1, sm: 3 } },
          }}
        >
          <Box
            sx={{
              display: "flex",
              width: "100%",
              flexDirection: { xs: "row", sm: "row" },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
              minHeight: { xs: "120px", sm: "180px" },
            }}
          >
            {statItems.map((item, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  borderRight: index < statItems.length - 1 ? 1 : 0,
                  borderColor: "divider",
                }}
              >
                <StatCard
                  item={item}
                  index={index}
                  totalItems={statItems.length}
                  isDarkMode={isDarkMode}
                />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default UsersStatsCards;
