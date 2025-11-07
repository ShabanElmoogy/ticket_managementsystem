import React, { type Dispatch, type SetStateAction } from "react";
import { Box, Container } from "@mui/material";
import type { DashboardStats } from "../../../services/api";
import { type Ticket, type User, type Customer, type Application, type CreateTicketData } from "../../../services/api";
import StatsCards from "./StatsCards";
import CreateTicketPost from "../../tickets/CreateTicketPost";
import { MobileFilters, DesktopFilters } from "../filters";
import TicketFeed from "../../tickets/TicketFeed";
import { ActivityFeed } from "./activityFeed"
import ReminderSettings from "./ReminderSettings";

interface Props {
  isMobile: boolean;
  stats: DashboardStats;
  statusFilter: Ticket['status'] | "";
  priorityFilter: string;
  userFilter: string;
  customerFilter: string;
  applicationFilter: string;
  searchQuery: string;
  setStatusFilter: Dispatch<SetStateAction<Ticket['status'] | "">>;
  setPriorityFilter: (v: string) => void;
  setUserFilter: (v: string) => void;
  setCustomerFilter: (v: string) => void;
  setApplicationFilter: (v: string) => void;
  setSearchQuery: (v: string) => void;
  allUsers: User[];
  employees: User[];
  customers: Customer[];
  applications: Application[];
  tickets: Ticket[];
  userRole: string | undefined;
  loading: boolean;
  onRefresh: () => Promise<void> | void;
  onCreateTicket: (data: CreateTicketData) => Promise<void> | void;
  onTicketClick: (t: Ticket) => void;
  onTakeTicket: (id: string) => Promise<void> | void;
  onUpdateStatus: (id: string, status: Ticket['status']) => Promise<void> | void;
  onAddComment: (id: string, content: string) => Promise<void> | void;
}

const DashboardContent: React.FC<Props> = ({
  isMobile,
  stats,
  statusFilter,
  priorityFilter,
  userFilter,
  customerFilter,
  applicationFilter,
  searchQuery,
  setStatusFilter,
  setPriorityFilter,
  setUserFilter,
  setCustomerFilter,
  setApplicationFilter,
  setSearchQuery,
  allUsers,
  employees,
  customers,
  applications,
  tickets,
  userRole,
  loading,
  onRefresh,
  onCreateTicket,
  onTicketClick,
  onTakeTicket,
  onUpdateStatus,
  onAddComment,
}) => {
  return (
    <Box>
      <Box
        sx={{
          p: { xs: 1, sm: 2, md: 3 },
          pt: { xs: 2, md: 4 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: { xs: 2, md: 3 },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, order: { xs: 2, lg: 1 } }}>
            <Container maxWidth={false} sx={{ p: 0, width: "100%" }}>
              <StatsCards
                stats={stats}
                isFiltered={!!(statusFilter || priorityFilter || userFilter || customerFilter || applicationFilter || searchQuery)}
                activeFilters={{
                  status: statusFilter,
                  priority: priorityFilter,
                  user: userFilter,
                  customer: customerFilter,
                  application: applicationFilter,
                  search: searchQuery,
                }}
              />

              {userRole === "ADMIN" && (
                <div data-testid="create-ticket">
                  <CreateTicketPost
                    onSubmit={onCreateTicket}
                    employees={employees}
                    customers={customers}
                    applications={applications}
                  />
                </div>
              )}

              {isMobile ? (
                <div data-testid="mobile-filters">
                  <MobileFilters
                    statusFilter={statusFilter}
                    priorityFilter={priorityFilter}
                    userFilter={userFilter}
                    customerFilter={customerFilter}
                    applicationFilter={applicationFilter}
                    searchQuery={searchQuery}
                    setStatusFilter={setStatusFilter}
                    setPriorityFilter={setPriorityFilter}
                    setUserFilter={setUserFilter}
                    setCustomerFilter={setCustomerFilter}
                    setApplicationFilter={setApplicationFilter}
                    setSearchQuery={setSearchQuery}
                    allUsers={allUsers}
                    customers={customers}
                    applications={applications}
                    tickets={tickets}
                    userRole={userRole || ""}
                    loading={loading}
                    onRefresh={onRefresh}
                  />
                </div>
              ) : (
                <DesktopFilters
                  statusFilter={statusFilter}
                  priorityFilter={priorityFilter}
                  userFilter={userFilter}
                  customerFilter={customerFilter}
                  applicationFilter={applicationFilter}
                  setStatusFilter={setStatusFilter}
                  setPriorityFilter={setPriorityFilter}
                  setUserFilter={setUserFilter}
                  setCustomerFilter={setCustomerFilter}
                  setApplicationFilter={setApplicationFilter}
                  allUsers={userRole === "ADMIN" ? allUsers : []}
                  customers={userRole === "ADMIN" ? customers : []}
                  applications={userRole === "ADMIN" ? applications : []}
                  loading={loading}
                  onRefresh={onRefresh}
                />
              )}

              {userRole === "EMPLOYEE" && <ReminderSettings />}

              <TicketFeed
                tickets={tickets}
                onTicketClick={onTicketClick}
                onTakeTicket={onTakeTicket}
                onUpdateStatus={onUpdateStatus}
                onAddComment={onAddComment}
              />
            </Container>
          </Box>

          <Box
            sx={{
              flexShrink: 0,
              order: { xs: 1, lg: 2 },
              width: { xs: "100%", lg: "auto" },
              maxHeight: { xs: "300px", lg: "none" },
              overflow: { xs: "hidden", lg: "visible" },
              display: { xs: "none", lg: "block" },
            }}
          >
            <ActivityFeed onTicketClick={onTicketClick} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardContent;
