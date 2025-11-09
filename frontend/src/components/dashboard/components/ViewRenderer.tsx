import React from 'react';
import AdminPanel from '../../admin/AdminPanel';
import KanbanPage from '../../kanban/KanbanPage';
import DocsGallery from '../../admin/docs/DocsGallery';
import ErrorBoundary from '../../common/ErrorBoundary';
import DashboardContent from './DashboardContent';
import DashboardOverlays from './DashboardOverlays';
import type { UseDashboardReturn } from '../hooks';

interface ViewRendererProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  dashboardProps: UseDashboardReturn;
}

const ViewRenderer: React.FC<ViewRendererProps> = ({
  currentView,
  setCurrentView,
  dashboardProps
}) => {
  const renderDashboardContent = () => (
    <>
      <DashboardContent
        isMobile={dashboardProps.isMobile}
        stats={dashboardProps.stats}
        statusFilter={dashboardProps.statusFilter}
        priorityFilter={dashboardProps.priorityFilter}
        userFilter={dashboardProps.userFilter}
        customerFilter={dashboardProps.customerFilter}
        applicationFilter={dashboardProps.applicationFilter}
        searchQuery={dashboardProps.searchQuery}
        setStatusFilter={dashboardProps.setStatusFilter}
        setPriorityFilter={dashboardProps.setPriorityFilter}
        setUserFilter={dashboardProps.setUserFilter}
        setCustomerFilter={dashboardProps.setCustomerFilter}
        setApplicationFilter={dashboardProps.setApplicationFilter}
        setSearchQuery={dashboardProps.setSearchQuery}
        allUsers={dashboardProps.allUsers}
        employees={dashboardProps.employees}
        customers={dashboardProps.customers}
        applications={dashboardProps.applications}
        tickets={dashboardProps.tickets}
        userRole={dashboardProps.user?.role}
        loading={dashboardProps.loading}
        onRefresh={dashboardProps.fetchData}
        onCreateTicket={dashboardProps.handleCreateTicket}
        onTicketClick={dashboardProps.handleTicketClick}
        onTakeTicket={dashboardProps.handleTakeTicket}
        onUpdateStatus={dashboardProps.handleUpdateTicketStatus}
        onAddComment={dashboardProps.handleAddComment}
      />

      <DashboardOverlays
        isMobile={dashboardProps.isMobile}
        snackbar={dashboardProps.snackbar}
        onCloseSnackbar={dashboardProps.closeSnackbar}
        detailsDialogOpen={dashboardProps.detailsDialogOpen}
        selectedTicket={dashboardProps.selectedTicket}
        onCloseDetailsDialog={() => dashboardProps.setDetailsDialogOpen(false)}
        onUpdateStatus={dashboardProps.handleUpdateTicketStatus}
        token={dashboardProps.token || ""}
        showMobileSearch={dashboardProps.showMobileSearch}
        onCloseMobileSearch={() => dashboardProps.setShowMobileSearch(false)}
        searchQuery={dashboardProps.searchQuery}
        onSearchChange={dashboardProps.setSearchQuery}
        tickets={dashboardProps.tickets}
        onTicketClick={dashboardProps.handleTicketClick}
        onRefresh={dashboardProps.fetchData}
        onOpenFilters={() => {
          const filtersElement = document.querySelector('[data-testid="mobile-filters"]');
          if (filtersElement) filtersElement.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenSearch={() => dashboardProps.setShowMobileSearch(true)}
        onOpenSort={() => {
          dashboardProps.showSnackbar("Sort functionality coming soon!", "info");
        }}
        showCreateButton={dashboardProps.user?.role === "ADMIN"}
        onCreateTicket={() => {
          const createElement = document.querySelector('[data-testid="create-ticket"]');
          if (createElement) createElement.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </>
  );

  switch (currentView) {
    case 'kanban':
      return (
        <ErrorBoundary>
          <KanbanPage />
        </ErrorBoundary>
      );
    case 'admin':
      return <AdminPanel onBackToDashboard={() => setCurrentView('dashboard')} />;
    case 'documents':
      return (
        <ErrorBoundary>
          <DocsGallery />
        </ErrorBoundary>
      );
    case 'dashboard':
    default:
      return renderDashboardContent();
  }
};

export default ViewRenderer;