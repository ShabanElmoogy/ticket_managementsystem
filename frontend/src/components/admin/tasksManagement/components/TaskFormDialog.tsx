import React, { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import MySelect from "../../../common/MySelect";
import type { TaskFormDialogProps } from "../types/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskFormSchema } from "../schemas/taskSchema";
import type { TaskFormValues } from "../types/types";

const DEFAULT_VALUES: TaskFormValues = {
  title: "",
  description: "",
  boardId: "",
  columnId: "",
  assigneeId: "",
  dueDate: null,
  status: "TODO",
};

const TaskFormDialog: React.FC<TaskFormDialogProps> = ({
  open,
  editing = false,
  initialValues,
  boards,
  users,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    mode: "onChange",
    defaultValues: initialValues || DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (open) {
      reset(initialValues || DEFAULT_VALUES);
    }
  }, [open, initialValues, reset]);

  const submit = handleSubmit(onSubmit);

  const boardId = watch("boardId");

  const taskBoards = useMemo(() => boards.filter((b) => b.type === "TASKS"), [boards]);
  const columns = useMemo(() => boards.find((b) => b.id === boardId)?.columns || [], [boards, boardId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editing ? "Edit Task" : "Create New Task"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            {...register("title")}
            required
            fullWidth
            autoComplete="off"
            error={!!errors.title}
            helperText={errors.title?.message}
          />
          <TextField
            label="Description"
            {...register("description")}
            multiline
            rows={4}
            required
            fullWidth
            autoComplete="off"
            error={!!errors.description}
            helperText={errors.description?.message}
          />
          <FormControl fullWidth required>
            <InputLabel>Board</InputLabel>
            <MySelect
              label="Board"
              value={boardId}
              onChange={(e) => {
                setValue("boardId", e.target.value as string, { shouldValidate: true });
                setValue("columnId", "", { shouldValidate: true }); // reset column on board change
              }}
              onClear={() => {
                setValue("boardId", "", { shouldValidate: true });
                setValue("columnId", "", { shouldValidate: true });
              }}
            >
              {taskBoards.map((board) => (
                <MenuItem key={board.id} value={board.id}>
                  {board.name} ({board.type})
                </MenuItem>
              ))}
              {taskBoards.length === 0 && (
                <MenuItem disabled value="">
                  No task boards available
                </MenuItem>
              )}
            </MySelect>
          </FormControl>
          <FormControl fullWidth required disabled={!boardId}>
            <InputLabel>Column</InputLabel>
            <MySelect
              label="Column"
              value={watch("columnId")}
              onChange={(e) => setValue("columnId", e.target.value as string, { shouldValidate: true })}
              onClear={() => setValue("columnId", "", { shouldValidate: true })}
            >
              {columns.map((column) => (
                <MenuItem key={column.id} value={column.id}>
                  {column.name}
                </MenuItem>
              ))}
              {boardId && columns.length === 0 && (
                <MenuItem disabled value="">
                  No columns available for this board
                </MenuItem>
              )}
            </MySelect>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <MySelect
              label="Status"
              value={watch("status")}
              onChange={(e) => setValue("status", e.target.value as any, { shouldValidate: true })}
            >
              <MenuItem value="TODO">To Do</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="REVIEW">Review</MenuItem>
              <MenuItem value="DONE">Done</MenuItem>
            </MySelect>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Assignee</InputLabel>
            <MySelect
              label="Assignee"
              value={watch("assigneeId") || ""}
              onChange={(e) => setValue("assigneeId", e.target.value as string, { shouldValidate: true })}
              onClear={() => setValue("assigneeId", "", { shouldValidate: true })}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name}
                </MenuItem>
              ))}
            </MySelect>
          </FormControl>
          <DatePicker
            label="Due Date"
            value={watch("dueDate") || null}
            onChange={(date) => setValue("dueDate", date || null, { shouldValidate: true })}
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={submit} variant="contained" disabled={!isValid}>
          {editing ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskFormDialog;
