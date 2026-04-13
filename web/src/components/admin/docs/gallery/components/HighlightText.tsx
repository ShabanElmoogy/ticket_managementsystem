import React from 'react';
import { Box } from '@mui/material';

interface Props {
  text: string;
  query: string;
}

/**
 * Renders `text` with every occurrence of `query` wrapped in a highlighted mark.
 * Case-insensitive. Falls back to plain text when query is empty.
 */
const HighlightText: React.FC<Props> = ({ text, query }) => {
  if (!query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Box
            key={i}
            component="mark"
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              borderRadius: '2px',
              px: '2px',
            }}
          >
            {part}
          </Box>
        ) : (
          part
        )
      )}
    </>
  );
};

export default HighlightText;
