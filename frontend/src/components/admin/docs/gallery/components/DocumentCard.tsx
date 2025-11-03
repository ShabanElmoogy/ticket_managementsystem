import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Grid,
} from "@mui/material";
import { Visibility as VisibilityIcon } from "@mui/icons-material";
import type { Doc, DocBlock } from "../../types";

interface DocumentCardProps {
  doc: Doc;
  onPreview: (doc: Doc) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onPreview }) => {
  const renderPreview = (blocks: DocBlock[]) => {
    if (!blocks || blocks.length === 0)
      return <Typography>No content</Typography>;

    return blocks.slice(0, 3).map((block, idx) => {
      switch (block.type) {
        case "heading":
          return (
            <Typography key={idx} variant="h6" sx={{ fontWeight: 700 }}>
              {block.text}
            </Typography>
          );
        case "text":
          return (
            <Typography
              key={idx}
              variant="body2"
              sx={{ whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{
                __html: block.html?.substring(0, 100) + "...",
              }}
            />
          );
        case "image":
          return block.url ? (
            <img
              key={idx}
              src={block.url}
              alt="preview"
              style={{ maxWidth: "100%", maxHeight: 100, objectFit: "cover" }}
            />
          ) : null;
        default:
          return (
            <Typography key={idx} variant="body2">
              {block.type}
            </Typography>
          );
      }
    });
  };

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {doc.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Updated: {new Date(doc.updatedAt).toLocaleDateString()}
          </Typography>
          <Box sx={{ mt: 1, maxHeight: 120, overflow: "hidden" }}>
            {renderPreview(doc.blocks)}
          </Box>
        </CardContent>
        <CardActions>
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => onPreview(doc)}
          >
            Preview
          </Button>
        </CardActions>
      </Card>
    </Grid>
  );
};

export default DocumentCard;