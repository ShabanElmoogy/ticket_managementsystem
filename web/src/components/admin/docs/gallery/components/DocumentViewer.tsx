import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { DocBlock } from "../../types";

interface DocumentViewerProps {
  blocks: DocBlock[];
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ blocks }) => {
  const theme = useTheme();

  return (
    <Box>
      {blocks?.map((block: DocBlock) => (
        <Box key={block.id} sx={{ mb: 2 }}>
          {block.type === "heading" && (
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
              {block.text}
            </Typography>
          )}
          {block.type === "text" && (
            <Typography
              component="div"
              sx={{ whiteSpace: "pre-wrap", mb: 1 }}
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          )}
          {block.type === "code" && (
            <Box sx={{ textAlign: block.settings?.align || 'left' }}>
              {block.language && (
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  {block.language}
                </Typography>
              )}
              <SyntaxHighlighter
                language={block.language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: 8,
                  padding: theme.spacing(2),
                  fontSize: '0.875rem',
                  textAlign: block.settings?.align || 'left',
                }}
              >
                {block.code}
              </SyntaxHighlighter>
            </Box>
          )}
          {block.type === "bulletedList" && (
            <Box sx={{ mb: 1 }}>
              {block.title && (
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  {block.title}
                </Typography>
              )}
              <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
                {block.items
                  .filter((item: string) => item)
                  .map((item: string, idx: number) => (
                    <li key={idx}>
                      <Typography variant="body2">{item}</Typography>
                    </li>
                  ))}
              </ul>
            </Box>
          )}
          {block.type === "divider" && (
            <Box
              sx={{
                my: 1,
                borderBottom: `${
                  block.settings?.dividerThickness || 1
                }px solid ${block.settings?.dividerColor || "#e0e0e0"}`,
              }}
            />
          )}
          {block.type === "image" && block.url && (
            <Box
              sx={{ mb: 1, textAlign: block.settings?.align || "center" }}
            >
              <img
                src={block.url}
                alt={block.caption || "image"}
                style={{ maxWidth: "100%", borderRadius: 4 }}
              />
              {block.caption && (
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ mt: 0.5 }}
                >
                  {block.caption}
                </Typography>
              )}
            </Box>
          )}
          {block.type === "video" && block.url && (
            <Box
              sx={{
                mb: 1,
                position: "relative",
                pt: "56.25%",
                borderRadius: 1,
                overflow: "hidden",
                bgcolor: "#000",
                maxWidth: 1100,
                mx: "auto",
              }}
            >
              <Box sx={{ position: "absolute", inset: 0 }}>
                {/youtu\.be|youtube\.com/.test(block.url) ? (
                  <iframe
                    title={block.caption || "video"}
                    src={(() => {
                      try {
                        const url = new URL(block.url);
                        const v = url.searchParams.get("v");
                        if (v) return `https://www.youtube.com/embed/${v}`;
                        const pathId = url.pathname
                          .split("/")
                          .filter((p: string) => p)[0];
                        return `https://www.youtube.com/embed/${pathId}`;
                      } catch {
                        return block.url;
                      }
                    })()}
                    width="100%"
                    height="100%"
                    frameBorder={0}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={block.url}
                    controls
                    style={{ width: "100%", height: "100%" }}
                  />
                )}
              </Box>
              {block.caption && (
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ mt: 0.5 }}
                >
                  {block.caption}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default DocumentViewer;