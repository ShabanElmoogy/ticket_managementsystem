import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import DocumentViewer from "./DocumentViewer";
import type { Doc } from "../../types";

interface DocumentPreviewDialogProps {
  doc: Doc | null;
  open: boolean;
  onClose: () => void;
}

const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({
  doc,
  open,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{doc?.title}</DialogTitle>
      <DialogContent sx={{ maxHeight: "70vh", overflow: "auto" }}>
        {doc?.blocks && <DocumentViewer blocks={doc.blocks} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentPreviewDialog;