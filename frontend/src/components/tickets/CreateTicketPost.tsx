import React, { useState } from "react";
import { Card, CardContent, Collapse, Divider, Box } from "@mui/material";
import { useAuthStore } from "../../stores/authStore";
import type { User, Customer, Application, CreateTicketData } from "../../services/api";
import Header from "./createTicketPost/Header";
import Description from "./createTicketPost/Description";
import OptionsBar from "./createTicketPost/OptionsBar";
import AdvancedOptions from "./createTicketPost/AdvancedOptions";
import FooterBar from "./createTicketPost/FooterBar";
import type { Priority } from "./CreateTicketPost/utils";

interface CreateTicketPostProps {
  onSubmit: (data: CreateTicketData) => void;
  employees: User[];
  customers?: Customer[];
  applications?: Application[];
}

const CreateTicketPost: React.FC<CreateTicketPostProps> = ({
  onSubmit,
  employees,
  customers = [],
  applications = [],
}) => {
  const { user } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [assignedTo, setAssignedTo] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [estimatedHours, setEstimatedHours] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!title.trim() || !description.trim()) return;

    setIsPosting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedToId: assignedTo || undefined,
        customerId: customerId || undefined,
        applicationId: applicationId || undefined,
        dueDate: dueDate?.toISOString(),
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setAssignedTo("");
      setCustomerId("");
      setApplicationId("");
      setDueDate(null);
      setEstimatedHours("");
      setShowAdvanced(false);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Header
          userName={user?.name}
          userRole={user?.role}
          title={title}
          onTitleChange={setTitle}
        />

        <Description
          open={title.length > 0}
          description={description}
          onDescriptionChange={setDescription}
        />

        <Collapse in={title.length > 0}>
          <Box sx={{ ml: 7 }}>
            <OptionsBar
              showAdvanced={showAdvanced}
              onToggleAdvanced={() => setShowAdvanced((s) => !s)}
              priority={priority}
              assignedTo={assignedTo}
              dueDate={dueDate}
              estimatedHours={estimatedHours}
              employees={employees}
            />

            <Collapse in={showAdvanced}>
              <AdvancedOptions
                priority={priority}
                onPriorityChange={setPriority}
                assignedTo={assignedTo}
                onAssignedToChange={setAssignedTo}
                customerId={customerId}
                onCustomerChange={setCustomerId}
                applicationId={applicationId}
                onApplicationChange={setApplicationId}
                dueDate={dueDate}
                onDueDateChange={setDueDate}
                estimatedHours={estimatedHours}
                onEstimatedHoursChange={setEstimatedHours}
                employees={employees}
                customers={customers}
                applications={applications}
              />
            </Collapse>

            <Divider sx={{ my: 2 }} />

            <FooterBar
              onSubmit={handleSubmit}
              disabled={!title.trim() || !description.trim() || isPosting}
              isPosting={isPosting}
            />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default CreateTicketPost;
