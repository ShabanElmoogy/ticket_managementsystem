import React from "react";
import type { KanbanTask } from "../../../../types/kanban";
import getTasksColumns from "./TasksColumns";
import { AdminDataGrid } from "../../../common";

export interface TasksTableProps {
  tasks: KanbanTask[];
  loading: boolean;
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => void;
}

const TasksTable: React.FC<TasksTableProps> = ({ tasks, loading, onEdit, onDelete }) => {
  const columns = getTasksColumns({ onEdit, onDelete });

  return (
    <AdminDataGrid rows={tasks} columns={columns} loading={loading} />
  );
};

export default TasksTable;
