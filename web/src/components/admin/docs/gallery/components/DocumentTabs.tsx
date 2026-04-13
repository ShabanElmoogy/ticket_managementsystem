import React from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  IconButton,
} from "@mui/material";
import DocumentViewer from "./DocumentViewer";
import type { Doc } from "../../types";
import { formatDate } from "../../../../../utils/dateUtils";

interface DocumentTabsProps {
  openDocs: Doc[];
  activeTab: number;
  onTabChange: (newValue: number) => void;
  onCloseTab: (index: number) => void;
}

const DocumentTabs: React.FC<DocumentTabsProps> = ({
  openDocs,
  activeTab,
  onTabChange,
  onCloseTab,
}) => {
  if (openDocs.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="body1" color="text.secondary">
          Select a document from the tree to view its content
        </Typography>
      </Box>
    );
  }

  const currentDoc = openDocs[activeTab];

  return (
    <>
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => onTabChange(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }}
      >
        {openDocs.map((doc, index) => (
          <Tab
            key={doc.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{doc.title}</span>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(index);
                  }}
                  sx={{ ml: 0.5, p: 0.25 }}
                >
                  ✕
                </IconButton>
              </Box>
            }
            sx={{ minHeight: 48, textTransform: 'none' }}
          />
        ))}
      </Tabs>
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {currentDoc && (
          <>
            <Typography variant="h5" gutterBottom>
              {currentDoc.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Updated: {formatDate(currentDoc.updatedAt)}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <DocumentViewer blocks={currentDoc.blocks || []} />
            </Box>
          </>
        )}
      </Box>
    </>
  );
};

export default DocumentTabs;