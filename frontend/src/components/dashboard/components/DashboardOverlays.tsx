import React from "react";
import { Snackbar, Alert } from "@mui/material";
import ScrollToTop from "../../common/ScrollToTop";
import MobileTicketActions from "../../tickets/MobileTicketActions";
import MobileSearchOverlay from "../../tickets/MobileSearchOverlay";
import TicketDetailsDialog from "../../tickets/TicketDetailsDialog";
import type { Ticket } from "../../../services/api";

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
};

type Props = {
  isMobile: boolean;
  snackbar: SnackbarState;
  onCloseSnackbar: () => void;

  // Ticket details dialog
  detailsDialogOpen: boolean;
  selectedTicket: Ticket | null;
  onCloseDetailsDialog: () => void;
  onUpdateStatus: (id: string, status: Ticket['status']) => void | Promise<void>;
  token: string;

  // Mobile search overlay
  showMobileSearch: boolean;
  onCloseMobileSearch: () => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  tickets: Ticket[];
  onTicketClick: (t: Ticket) => void;

  // FAB actions
  onRefresh: () => void | Promise<void>;
  onOpenFilters: () => void;
  onOpenSearch: () => void;
  onOpenSort: () => void;
  showCreateButton: boolean;
  onCreateTicket: () => void;
};

const DashboardOverlays: React.FC<Props> = ({
  isMobile,
  snackbar,
  onCloseSnackbar,
  detailsDialogOpen,
  selectedTicket,
  onCloseDetailsDialog,
  onUpdateStatus,
  token,
  showMobileSearch,
  onCloseMobileSearch,
  searchQuery,
  onSearchChange,
  tickets,
  onTicketClick,
  onRefresh,
  onOpenFilters,
  onOpenSearch,
  onOpenSort,
  showCreateButton,
  onCreateTicket,
}) => {
  return (
    <>
      <TicketDetailsDialog
        open={detailsDialogOpen}
        onClose={onCloseDetailsDialog}
        ticket={selectedTicket}
        onUpdateStatus={onUpdateStatus}
        token={token}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={onCloseSnackbar}>
        <Alert onClose={onCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <MobileSearchOverlay
        open={showMobileSearch}
        onClose={onCloseMobileSearch}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        tickets={tickets}
        onTicketClick={onTicketClick}
      />

      {isMobile ? (
        <MobileTicketActions
          onOpenFilters={onOpenFilters}
          onRefresh={onRefresh}
          onOpenSearch={onOpenSearch}
          onOpenSort={onOpenSort}
          showCreateButton={showCreateButton}
          onCreateTicket={onCreateTicket}
        />
      ) : (
        <ScrollToTop threshold={200} showProgress={true} />
      )}
    </>
  );
};

export default DashboardOverlays;
