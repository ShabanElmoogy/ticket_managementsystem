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
import HighlightText from "./HighlightText";
import { formatDate } from "../../../../../shared/utils/dateUtils";

interface DocumentCardProps {
  doc: Doc;
  onPreview: (doc: Doc) => void;
  searchQuery?: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, onPreview, searchQuery = '' }) => {
  /** Strip HTML tags and truncate to plain text for card preview */
  const toPlainText = (html: string, maxLen = 120): string => {
    const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain;
  };

  const renderPreview = (blocks: DocBlock[]) => {
    if (!blocks || blocks.length === 0)
      return <Typography variant="body2" color="text.disabled">No content</Typography>;

    return blocks.slice(0, 4).map((block, idx) => {
      switch (block.type) {
        case 'heading':
          return (
            <Typography key={idx} variant="subtitle2" fontWeight={700} noWrap>
              {block.text}
            </Typography>
          );
        case 'text':
          return block.html ? (
            <Typography key={idx} variant="body2" color="text.secondary" sx={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {toPlainText(block.html)}
            </Typography>
          ) : null;
        case 'bulletedList':
        case 'numberedList':
          return (
            <Typography key={idx} variant="body2" color="text.secondary" noWrap>
              • {block.items.filter(Boolean).slice(0, 2).join(' • ')}{block.items.length > 2 ? ' …' : ''}
            </Typography>
          );
        case 'code':
          return (
            <Typography key={idx} variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} noWrap>
              {'{ '}{block.language}{' }'}
            </Typography>
          );
        case 'quote':
          return (
            <Typography key={idx} variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }} noWrap>
              "{block.text}"
            </Typography>
          );
        case 'callout':
          return (
            <Typography key={idx} variant="body2" color="text.secondary" noWrap>
              ℹ {block.text}
            </Typography>
          );
        case 'image':
          return block.url ? (
            <Box key={idx} sx={{ mt: 0.5 }}>
              <img src={block.url} alt="preview" style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'cover', borderRadius: 4 }} />
            </Box>
          ) : null;
        default:
          return null;
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
            <HighlightText text={doc.title} query={searchQuery} />
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Updated: {formatDate(doc.updatedAt)}
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