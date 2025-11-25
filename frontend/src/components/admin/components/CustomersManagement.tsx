import { Box, Snackbar, Alert } from "@mui/material";
import {
  withCRUD,
  withUIState,
  withMessages,
  withErrorHandling,
  type CRUDProps,
  type UIStateProps,
  type MessagesProps,
  type ErrorHandlingProps,
} from "../../../shared";
import { DeleteConfirmDialog, MyGridHeader } from "../../common";
import {
  CustomersTable,
  CustomerFormDialog,
} from "../customersManagement";
import {
  type Customer,
  type CreateCustomerData,
  type Application,
  customersApi,
  applicationsApi,
} from "../../../services/api";
const customersKeys = { all: ["customers"] as const };
import PeopleIcon from "@mui/icons-material/People";
import { useState, useEffect } from "react";

interface CustomersPageProps
  extends CRUDProps<Customer, CreateCustomerData>,
  UIStateProps,
  MessagesProps,
  ErrorHandlingProps { }

function CustomersPageComponent(props: CustomersPageProps) {
  const {
    entities: customers,
    loading,
    create,
    update,
    remove,
    uiState,
    openDialog,
    closeDialog,
    showSnackbar,
    closeSnackbar,
    openDeleteDialog,
    closeDeleteDialog,
    setSubmitting,
    messages,
    handleError,
    logError,
  } = props;

  const [applications, setApplications] = useState<Application[]>([]);
  const [auxLoading, setAuxLoading] = useState(false);

  useEffect(() => {
    const fetchAuxData = async () => {
      setAuxLoading(true);
      try {
        const data = await applicationsApi.getApplications();
        setApplications(data);
      } catch (error) {
        console.error("Failed to fetch auxiliary data", error);
      } finally {
        setAuxLoading(false);
      }
    };
    fetchAuxData();
  }, []);

  const handleSubmit = async (values: CreateCustomerData) => {
    setSubmitting(true);
    try {
      if (uiState.editingItem) {
        await update((uiState.editingItem as Customer).id, values);
        showSnackbar(messages.success.updated, "success");
      } else {
        await create(values);
        showSnackbar(messages.success.created, "success");
      }
      closeDialog();
    } catch (error) {
      const errorMessage = uiState.editingItem
        ? messages.error.update
        : messages.error.create;
      showSnackbar(handleError(error, errorMessage), "error");
      logError(uiState.editingItem ? "Update" : "Create", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!uiState.deleteDialog.item) return;
    try {
      await remove((uiState.deleteDialog.item as Customer).id);
      showSnackbar(messages.success.deleted, "success");
      closeDeleteDialog();
    } catch (error) {
      showSnackbar(handleError(error, messages.error.delete), "error");
      logError("Delete", error);
    }
  };

  return (
    <Box>
      <MyGridHeader
        title="Customers Management"
        onAdd={() => openDialog()}
        addButtonText="Add Customer"
        addTooltip="Add Customer"
        icon={PeopleIcon}
      />

      <CustomersTable
        customers={customers}
        loading={loading || auxLoading}
        onEdit={openDialog}
        onDelete={openDeleteDialog}
      />

      <CustomerFormDialog
        open={uiState.dialogOpen}
        editing={!!uiState.editingItem}
        initialValues={
          uiState.editingItem
            ? {
              name: (uiState.editingItem as Customer).name,
              email: (uiState.editingItem as Customer).email,
              phone: (uiState.editingItem as Customer).phone || "",
              address: (uiState.editingItem as Customer).address || "",
              description: (uiState.editingItem as Customer).description || "",
              applicationIds: (uiState.editingItem as Customer).applications?.map((ca) => ca.applicationId) || [],
            }
            : undefined
        }
        applications={applications}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        submitting={uiState.submitting}
      />

      <DeleteConfirmDialog
        open={uiState.deleteDialog.open}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        itemName={(uiState.deleteDialog.item as Customer)?.name}
        itemType="customer"
        loading={false}
        warningMessage={
          (uiState.deleteDialog.item as Customer)?._count?.tickets &&
            ((uiState.deleteDialog.item as Customer)._count?.tickets || 0) > 0
            ? `This customer has ${(uiState.deleteDialog.item as Customer)._count?.tickets || 0} associated ticket(s). Please reassign or delete them first.`
            : undefined
        }
      />

      <Snackbar
        open={uiState.snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity={uiState.snackbar.severity}>
          {uiState.snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const CustomersManagement = withCRUD(
  withUIState(
    withMessages(withErrorHandling(CustomersPageComponent), {
      success: {
        created: "Customer created successfully",
        updated: "Customer updated successfully",
        deleted: "Customer deleted successfully",
      },
      error: {
        create: "Error creating customer",
        update: "Error updating customer",
        delete: "Error deleting customer",
      },
      titles: {
        create: "Create New Customer",
        edit: "Edit Customer",
      },
    })
  ),
  {
    entityName: "customers",
    queryKey: customersKeys.all,
    api: {
      getAll: customersApi.getCustomers.bind(customersApi),
      create: customersApi.createCustomer.bind(customersApi),
      update: customersApi.updateCustomer.bind(customersApi),
      delete: customersApi.deleteCustomer.bind(customersApi),
    },
  }
);


export default CustomersManagement;