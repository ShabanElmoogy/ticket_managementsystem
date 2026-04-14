import React from "react";
import type { KanbanTask } from "../../../kanban/types/types";
import getTasksColumns from "./TasksColumns";
import { AdminDataGrid } from "../../../../shared/components";
import type { TasksTableProps } from "../types/types";

const TasksTable: React.FC<TasksTableProps> = ({ tasks, loading, onEdit, onDelete }) => {
  const columns = getTasksColumns({ onEdit, onDelete });
  return <AdminDataGrid rows={tasks} columns={columns} loading={loading} />;
};

export default TasksTable;
