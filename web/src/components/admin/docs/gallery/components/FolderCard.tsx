import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
} from "@mui/material";
import { Folder as FolderIcon } from "@mui/icons-material";
import type { TreeNode } from "../../types";
import HighlightText from "./HighlightText";

interface FolderCardProps {
  folder: TreeNode;
  onNavigate: (folderId: string) => void;
  searchQuery?: string;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder, onNavigate, searchQuery = '' }) => {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card
        sx={{ 
          height: "100%", 
          display: "flex", 
          flexDirection: "column", 
          cursor: "pointer" 
        }}
        onClick={() => onNavigate(folder.id)}
      >
        <CardContent sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <FolderIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">
              <HighlightText text={folder.title} query={searchQuery} />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Folder
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default FolderCard;