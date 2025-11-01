import React, { useMemo } from 'react';
import { Box, TextField } from '@mui/material';
import BlockSettingsBar from '../BlockSettingsBar';
import type { VideoBlock, BlockSettings } from '../../types';

const VideoBlockEditor: React.FC<{
  block: VideoBlock;
  onChange: (patch: Partial<VideoBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (patch: Partial<BlockSettings>) => void;
}> = ({ block, onChange, settings, onSettingsChange }) => {
  const isYouTube = /youtu\.be|youtube\.com/.test(block.url);
  const embedUrl = useMemo(() => {
    if (!block.url) return '';
    if (isYouTube) {
      try {
        const url = new URL(block.url);
        const v = url.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length) return `https://www.youtube.com/embed/${parts[0]}`;
      } catch {}
    }
    return block.url;
  }, [block.url, isYouTube]);

  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        label="Video URL"
        placeholder="https://..."
        value={block.url}
        onChange={(e) => onChange({ url: e.target.value })}
        sx={{ mb: 1 }}
      />
      {block.url && (
        <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ position: 'absolute', inset: 0 }}>
            {isYouTube ? (
              <iframe
                title={block.caption || 'video'}
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={block.url} controls style={{ width: '100%', height: '100%' }} />
            )}
          </Box>
        </Box>
      )}
      <TextField
        fullWidth
        variant="standard"
        placeholder="Caption (optional)"
        value={block.caption || ''}
        onChange={(e) => onChange({ caption: e.target.value })}
        sx={{ mt: 1 }}
      />
      <BlockSettingsBar settings={settings} onSettingsChange={onSettingsChange} enableAlign />
    </Box>
  );
};

export default VideoBlockEditor;