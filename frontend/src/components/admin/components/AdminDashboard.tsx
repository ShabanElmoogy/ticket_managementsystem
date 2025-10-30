import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import Grid from '@mui/material/Grid';
import {
  People as PeopleIcon,
  Apps as AppsIcon,
  ConfirmationNumber as TicketIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../../stores/authStore";
import { apiService } from "../../../services/api";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

//TODO: Add i18n
//TODO: Refactor Grid
//TODO:Add Chat
//TODO:Add Report
//TODO:Add Charts
//TODO: JWt Cookie Http Only
//TODO: use TypeScript in backend
//TODO:Seperate and refactor
//TODO:FileManagement
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: "50%",
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ color: "white", fontSize: 24 }}>
            {icon}
          </Box>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalApplications: 0,
    activeApplications: 0,
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  });

  const fetchStats = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [customers, applications, tickets] = await Promise.all([
        apiService.getCustomers(token),
        apiService.getApplications(token),
        apiService.getTickets(token, {}),
      ]);

      const activeCustomers = customers.filter((c) => c.isActive).length;
      const activeApplications = applications.filter((a) => a.isActive).length;
      const openTickets = tickets.filter((t) => t.status === "OPEN").length;
      const inProgressTickets = tickets.filter(
        (t) => t.status === "IN_PROGRESS"
      ).length;
      const resolvedTickets = tickets.filter(
        (t) => t.status === "RESOLVED"
      ).length;

      setStats({
        totalCustomers: customers.length,
        activeCustomers,
        totalApplications: applications.length,
        activeApplications,
        totalTickets: tickets.length,
        openTickets,
        inProgressTickets,
        resolvedTickets,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error fetching stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Customer Stats */}
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Active Customers"
            value={stats.activeCustomers}
            icon={<PeopleIcon />}
            color="#2e7d32"
          />
        </Grid>

        {/* Application Stats */}
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            icon={<AppsIcon />}
            color="#7b1fa2"
          />
        </Grid>

       <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Active Applications"
            value={stats.activeApplications}
            icon={<AppsIcon />}
            color="#388e3c"
          />
        </Grid>

        {/* Ticket Stats */}
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Total Tickets"
            value={stats.totalTickets}
            icon={<TicketIcon />}
            color="#f57c00"
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Open Tickets"
            value={stats.openTickets}
            icon={<TicketIcon />}
            color="#d32f2f"
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="In Progress"
            value={stats.inProgressTickets}
            icon={<TrendingUpIcon />}
            color="#f9a825"
          />
        </Grid>
        <Grid size={{xs:12,sm:6,md:3}}>
          <StatCard
            title="Resolved"
            value={stats.resolvedTickets}
            icon={<TicketIcon />}
            color="#388e3c"
          />
        </Grid>
      </Grid>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{xs:12,md:4}}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Overview
              </Typography>
              <Typography variant="body2" color="textSecondary">
                You have {stats.totalCustomers} customers in total, with{" "}
                {stats.activeCustomers} currently active.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Active Rate:{" "}
                {stats.totalCustomers > 0
                  ? Math.round(
                      (stats.activeCustomers / stats.totalCustomers) * 100
                    )
                  : 0}
                %
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,md:4}}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Overview
              </Typography>
              <Typography variant="body2" color="textSecondary">
                You have {stats.totalApplications} applications in total, with{" "}
                {stats.activeApplications} currently active.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Active Rate:{" "}
                {stats.totalApplications > 0
                  ? Math.round(
                      (stats.activeApplications / stats.totalApplications) * 100
                    )
                  : 0}
                %
              </Typography>
            </CardContent>
          </Card>
        </Grid>

       <Grid size={{xs:12,md:4}}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ticket Overview
              </Typography>
              <Typography variant="body2" color="textSecondary">
                You have {stats.totalTickets} tickets in total.{" "}
                {stats.openTickets} are open and need attention.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Resolution Rate:{" "}
                {stats.totalTickets > 0
                  ? Math.round(
                      (stats.resolvedTickets / stats.totalTickets) * 100
                    )
                  : 0}
                %
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
