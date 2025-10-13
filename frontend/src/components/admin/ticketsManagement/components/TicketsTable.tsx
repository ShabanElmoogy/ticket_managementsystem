import React from "react";
import type { Ticket } from "../../../../services/api";
import getTicketsColumns from "./TicketsColumns";
import { AdminDataGrid } from "../../../common";

export interface TicketsTableProps {
  tickets: Ticket[];
  loading: boolean;
  onEdit: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

const TicketsTable: React.FC<TicketsTableProps> = ({ tickets, loading, onEdit, onDelete }) => {
  const columns = getTicketsColumns({ onEdit, onDelete });

  return (
    <AdminDataGrid rows={tickets} columns={columns} loading={loading} />
  );
};

export default TicketsTable;
