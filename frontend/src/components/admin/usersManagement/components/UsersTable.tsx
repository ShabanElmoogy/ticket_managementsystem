import React from "react";
import type { User } from "../../../../services/api";
import getUsersColumns from "./UsersColumns";
import { AdminDataGrid } from "../../../common";

export interface UsersTableProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, loading, onEdit, onDelete }) => {
  const columns = getUsersColumns({ onEdit, onDelete });
  return <AdminDataGrid rows={users} columns={columns} loading={loading} />;
};

export default UsersTable;
