import React, { useState } from "react";
import { Box, Typography, Divider, Chip, Tabs, Tab, useTheme } from "@mui/material";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { DocBlock } from "../../types";
import VideoCarouselView from '../../components/VideoCarouselView';

const CALLOUT_COLORS: Record<string, string> = {
  info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444',
};

// Interactive tabs for the tabs block
const TabsBlock: React.FC<{ tabs: { id: string; label: string; content: string }[] }> = ({ tabs }) => {
  const [active, setActive] = useState(0);
  if (!tabs?.length) return null;
  return (
    <Box>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={active} onChange={(_, v) => setActive(v)}
          sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontSize: '0.85rem' } }}>
          {tabs.map((t, i) => <Tab key={t.id} label={t.label || `Tab ${i + 1}`} />)}
        </Tabs>
      </Box>
      <Box sx={{ pt: 1.5 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {tabs[active]?.content}
        </Typography>
      </Box>
    </Box>
  );
};

interface Props { blocks: DocBlock[]; }

const DocumentViewer: React.FC<Props> = ({ blocks }) => {
  const theme = useTheme();

  const renderBlock = (block: DocBlock) => {
    switch (block.type) {
      case 'heading':
        return (
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 2, mb: 1, textAlign: block.settings?.align || 'left', color: block.settings?.color || 'inherit' }}>
            {block.text}
          </Typography>
        );

      case 'text':
        return (
          <Typography component="div" sx={{ whiteSpace: 'pre-wrap', mb: 1, textAlign: block.settings?.align || 'left', color: block.settings?.color || 'inherit', lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: block.html }} />
        );

      case 'code':
        return (
          <Box>
            {block.language && <Chip label={block.language} size="small" sx={{ mb: 1, fontSize: '0.65rem', height: 20 }} />}
            <SyntaxHighlighter language={block.language} style={vscDarkPlus}
              customStyle={{ margin: 0, borderRadius: 8, padding: theme.spacing(2), fontSize: '0.875rem' }}>
              {block.code}
            </SyntaxHighlighter>
          </Box>
        );

      case 'bulletedList':
        return (
          <Box sx={{ color: block.settings?.color || 'inherit' }}>
            {block.title && <Typography variant="subtitle2" fontWeight={600} mb={0.5}>{block.title}</Typography>}
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              {block.items.filter(Boolean).map((item, i) => <li key={`b-${i}`}><Typography variant="body2">{item}</Typography></li>)}
            </ul>
          </Box>
        );

      case 'numberedList':
        return (
          <Box sx={{ color: block.settings?.color || 'inherit' }}>
            {block.title && <Typography variant="subtitle2" fontWeight={600} mb={0.5}>{block.title}</Typography>}
            <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              {block.items.filter(Boolean).map((item, i) => <li key={`n-${i}`}><Typography variant="body2">{item}</Typography></li>)}
            </ol>
          </Box>
        );

      case 'quote':
        return (
          <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 2, py: 0.5 }}>
            <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.7 }}>{block.text}</Typography>
            {block.attribution && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>— {block.attribution}</Typography>}
          </Box>
        );

      case 'callout': {
        const c = CALLOUT_COLORS[block.calloutType] ?? '#3b82f6';
        return (
          <Box sx={{ borderLeft: `4px solid ${c}`, bgcolor: `${c}0d`, borderRadius: 1, p: 1.5 }}>
            <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{block.text}</Typography>
          </Box>
        );
      }

      case 'table':
        return (
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>{block.headers.map((h, i) => <th key={i} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid', fontWeight: 600, background: 'rgba(0,0,0,0.04)' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>{row.map((cell, c) => <td key={c} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </Box>
        );

      case 'toggle':
        return (
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ fontWeight: 600, padding: '4px 0', userSelect: 'none' }}>{block.summary || 'Toggle'}</summary>
            <Box sx={{ pl: 2, pt: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{block.content}</Typography>
            </Box>
          </details>
        );

      case 'tabs':
        return <TabsBlock tabs={block.tabs ?? []} />;

      case 'videoCarousel':
        return <VideoCarouselView videos={block.videos ?? []} />;

      case 'divider':
        return <Divider sx={{ borderColor: block.settings?.dividerColor, borderBottomWidth: block.settings?.dividerThickness || 1 }} />;

      case 'image':
        return block.url ? (
          <Box sx={{ textAlign: block.settings?.align || 'center' }}>
            <img src={block.url} alt={block.caption || 'image'} style={{ maxWidth: '100%', borderRadius: 4 }} />
            {block.caption && <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>{block.caption}</Typography>}
          </Box>
        ) : null;

      case 'video':
        return block.url ? (
          <Box sx={{ maxWidth: 960, mx: 'auto' }}>
            <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 1, overflow: 'hidden', bgcolor: '#000' }}>
              <Box sx={{ position: 'absolute', inset: 0 }}>
                {/youtu\.be|youtube\.com/.test(block.url) ? (
                  <iframe
                    title={block.caption || 'video'}
                    src={(() => {
                      try {
                        const u = new URL(block.url);
                        const v = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean)[0];
                        return `https://www.youtube.com/embed/${v}`;
                      } catch { return block.url; }
                    })()}
                    width="100%" height="100%"
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={block.url} controls style={{ width: '100%', height: '100%' }} />
                )}
              </Box>
            </Box>
          </Box>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Box>
      {(blocks ?? []).map((block) => (
        <Box key={block.id} sx={{ mb: 2 }}>
          {renderBlock(block)}
        </Box>
      ))}
    </Box>
  );
};

export default DocumentViewer;
