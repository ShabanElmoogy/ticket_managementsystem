import { memo } from "react";
import { Box, Collapse } from "@mui/material";
import MyTextField from "../../../shared/components/inputs/AppTextField";

export interface DescriptionProps {
  open: boolean;
  description: string;
  onDescriptionChange: (value: string) => void;
}

const Description = memo(({ open, description, onDescriptionChange }: DescriptionProps) => (
  <Collapse in={open}>
    <Box sx={{ ml: 7, mb: 2 }}>
      <MyTextField
        fullWidth
        multiline
        rows={3}
        placeholder="Provide more details about the issue..."
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        rounded
      />
    </Box>
  </Collapse>
));

Description.displayName = "Description";
export default Description;
