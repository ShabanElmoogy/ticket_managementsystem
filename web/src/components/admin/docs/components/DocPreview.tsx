import React from 'react';
import { Box, Typography, Divider, Chip } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type {
  DocBlock, HeadingBlock, TextBlock, BulletedListBlock, NumberedListBlock,
  ImageBlock, VideoBlock, CodeBlock, QuoteBlock, CalloutBlock, TableBlock,
  ToggleBlock, TabsBlock,
} from '../types';
import TabsPreview from './TabsPreview';

interface Props {
  blocks: DocBlock[];
}

const CALLOUT_COLORS: Record<string, string> = {
  info: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

function renderPreviewBlock(block: DocBlock): React.ReactNode {
  switch (block.type) {
    case 'heading':
      return (
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, textAlign: block.settings?.align || 'left', color: block.settings?.color || 'inherit' }}
        >
          {(block as HeadingBlock).text}
        </Typography>
      );

    case 'text':
      return (
        <Typography
          component="div"
          sx={{ whiteSpace: 'pre-wrap', textAlign: block.settings?.align || 'left', color: block.settings?.color || 'inherit', lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: (block as TextBlock).html }}
        />
      );

    case 'code':
      return (
        <Box>
          <Chip label={(block as CodeBlock).language} size="small" sx={{ mb: 1, fontSize: '0.65rem', height: 20 }} />
          <SyntaxHighlighter
            language={(block as CodeBlock).language}
            style={vscDarkPlus}
            customStyle={{ margin: 0, borderRadius: 8, fontSize: '0.85rem' }}
          >
            {(block as CodeBlock).code}
          </SyntaxHighlighter>
        </Box>
      );

    case 'bulletedList':
      return (
        <Box sx={{ color: block.settings?.color || 'inherit' }}>
          {(block as BulletedListBlock).title && (
            <Typography variant="h6" fontWeight={600} mb={1}>{(block as BulletedListBlock).title}</Typography>
          )}
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            {(block as BulletedListBlock).items.filter(Boolean).map((it, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{it}</li>
            ))}
          </ul>
        </Box>
      );

    case 'numberedList':
      return (
        <Box sx={{ color: block.settings?.color || 'inherit' }}>
          {(block as NumberedListBlock).title && (
            <Typography variant="h6" fontWeight={600} mb={1}>{(block as NumberedListBlock).title}</Typography>
          )}
          <ol style={{ marginTop: 0, paddingLeft: 20 }}>
            {(block as NumberedListBlock).items.filter(Boolean).map((it, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{it}</li>
            ))}
          </ol>
        </Box>
      );

    case 'quote':
      return (
        <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 2, py: 0.5 }}>
          <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.7 }}>
            {(block as QuoteBlock).text}
          </Typography>
          {(block as QuoteBlock).attribution && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              — {(block as QuoteBlock).attribution}
            </Typography>
          )}
        </Box>
      );

    case 'callout': {
      const c = CALLOUT_COLORS[(block as CalloutBlock).calloutType] ?? '#3b82f6';
      return (
        <Box sx={{ borderLeft: `4px solid ${c}`, bgcolor: `${c}0d`, borderRadius: 1, p: 1.5 }}>
          <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{(block as CalloutBlock).text}</Typography>
        </Box>
      );
    }

    case 'table': {
      const tb = block as TableBlock;
      return (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                {tb.headers.map((h, i) => (
                  <th key={i} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid', fontWeight: 600, background: 'rgba(0,0,0,0.04)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tb.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      );
    }

    case 'toggle':
      return (
        <details style={{ cursor: 'pointer' }}>
          <summary style={{ fontWeight: 600, padding: '4px 0', userSelect: 'none' }}>
            {(block as ToggleBlock).summary || 'Toggle'}
          </summary>
          <Box sx={{ pl: 2, pt: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {(block as ToggleBlock).content}
            </Typography>
          </Box>
        </details>
      );

    case 'tabs':
      return <TabsPreview tabs={(block as TabsBlock).tabs ?? []} />;

    case 'divider':
      return (
        <Divider
          sx={{ borderColor: block.settings?.dividerColor, borderBottomWidth: block.settings?.dividerThickness || 1 }}
        />
      );

    case 'image':
      return (block as ImageBlock).url ? (
        <Box sx={{ textAlign: block.settings?.align || 'center' }}>
          <img
            src={(block as ImageBlock).url}
            alt={(block as ImageBlock).caption || ''}
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
          {(block as ImageBlock).caption && (
            <Typography variant="caption" display="block" mt={1} color="text.secondary">
              {(block as ImageBlock).caption}
            </Typography>
          )}
        </Box>
      ) : null;

    case 'video': {
      const vb = block as VideoBlock;
      if (!vb.url) return null;
      const isYT = /youtu\.be|youtube\.com/.test(vb.url);
      const embedSrc = (() => {
        if (!isYT) return null;
        try {
          const u = new URL(vb.url);
          const v = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean)[0];
          return v ? `https://www.youtube.com/embed/${v}` : null;
        } catch { return null; }
      })();
      return (
        <Box>
          <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
            <Box sx={{ position: 'absolute', inset: 0 }}>
              {isYT && embedSrc
                ? <iframe title={vb.caption || 'video'} src={embedSrc} width="100%" height="100%" style={{ border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                : <video src={vb.url} controls style={{ width: '100%', height: '100%' }} />
              }
            </Box>
          </Box>
          {vb.caption && (
            <Typography variant="caption" display="block" mt={1} color="text.secondary">{vb.caption}</Typography>
          )}
        </Box>
      );
    }

    default:
      return null;
  }
}

const DocPreview: React.FC<Props> = ({ blocks }) => (
  <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      {blocks.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={6}>
          Nothing to preview yet.
        </Typography>
      ) : (
        blocks.map((block) => (
          <Box key={block.id} sx={{ mb: 3 }}>
            {renderPreviewBlock(block)}
          </Box>
        ))
      )}
    </Box>
  </Box>
);

export default DocPreview;
