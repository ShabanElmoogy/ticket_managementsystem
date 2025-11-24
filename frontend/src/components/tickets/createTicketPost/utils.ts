export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "LOW":
      return "#10b981";
    case "MEDIUM":
      return "#f59e0b";
    case "HIGH":
      return "#ef4444";
    case "URGENT":
      return "#dc2626";
    default:
      return "#6b7280";
  }
};
