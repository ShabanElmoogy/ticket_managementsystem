import { memo } from "react";
import { Button, Grid } from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";

export interface FooterBarProps {
  onSubmit: () => void;
  disabled: boolean;
  isPosting?: boolean;
}

const FooterBar = memo(({ onSubmit, disabled, isPosting }: FooterBarProps) => (
  <Grid container justifyContent="flex-end">
      <Button
        variant="contained"
        endIcon={<SendIcon />}
        onClick={onSubmit}
        disabled={disabled}
        sx={{
          borderRadius: 3,
          px: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
          },
          "&:disabled": {
            background: "#e5e7eb",
            color: "#9ca3af",
          },
        }}
      >
        {isPosting ? "Posting..." : "Post Ticket"}
      </Button>
    </Grid>
));

FooterBar.displayName = "FooterBar";
export default FooterBar;
