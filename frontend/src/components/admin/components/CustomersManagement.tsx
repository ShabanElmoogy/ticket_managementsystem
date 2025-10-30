import React from "react";
import { Box, Alert, Snackbar } from "@mui/material";
import { CustomersTable, CustomerFormDialog } from "../customersManagement";
import DeleteConfirmDialog from "../../common/DeleteConfirmDialog";
import PeopleIcon from "@mui/icons-material/People";
import useCustomersManagement from "../customersManagement/hooks/useCustomersManagement";
import MyGridHeader from "../../common/MyGridHeader";

const CustomersManagement: React.FC = () => {
  const {
    customers,
    applications,
    loading,

    dialogOpen,
    editingCustomer,
    formData,

    snackbar,
    deleteDialog,

    handleOpenDialog,
    handleCloseDialog,
    handleSubmit,

    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,

    handleSnackbarClose,
  } = useCustomersManagement();

  return (
    <Box>
      <MyGridHeader
        title="Customers Management"
        onAdd={handleOpenDialog}
        addButtonText="Add Customer"
        addTooltip="Add Customer"
        icon={PeopleIcon}
      />

      <CustomersTable
        customers={customers}
        loading={loading}
        onEdit={(customer) => handleOpenDialog(customer)}
        onDelete={(customer) => handleDeleteClick(customer)}
      />

      {/* Create/Edit Dialog */}
      <CustomerFormDialog
        open={dialogOpen}
        editing={!!editingCustomer}
        initialValues={formData}
        applications={applications}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.customer?.name}
        itemType="customer"
        loading={deleteDialog.loading}
        warningMessage={
          deleteDialog.customer?._count?.tickets &&
          deleteDialog.customer._count.tickets > 0
            ? `This customer has ${deleteDialog.customer._count.tickets} associated ticket(s). Please reassign or delete them first.`
            : undefined
        }
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomersManagement;
