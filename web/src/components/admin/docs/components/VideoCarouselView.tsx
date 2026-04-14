import React, { useState } from 'react';
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, alpha, useTheme } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import type { VideoItem } from '../types';

interface Props {
  videos: VideoItem[];
}

function resolveEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // YouTube
    if (/youtu\.be|youtube\.com/.test(url)) {
      const v = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    // Vimeo
    if (/vimeo\.com/.test(url)) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    // Direct video file
    return url;
  } catch {
    return null;
  }
}

const VideoCarouselView: React.FC<Props> = ({ videos }) => {
  const theme = useTheme();
  const [active, setActive] = useState(0);

  if (!videos?.length) return null;

  const current = videos[active];
  const embedUrl = resolveEmbedUrl(current.url);
  const isDirect = embedUrl && !embedUrl.includes('youtube') && !embedUrl.includes('vimeo');

  return (
    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, maxWidth: 960, mx: 'auto' }}>
      {/* Video player */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
          {embedUrl ? (
            <Box sx={{ position: 'absolute', inset: 0 }}>
              {isDirect ? (
                <video key={embedUrl} src={embedUrl} controls style={{ width: '100%', height: '100%' }} />
              ) : (
                <iframe
                  key={embedUrl}
                  title={current.title}
                  src={embedUrl}
                  width="100%" height="100%"
                  style={{ border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </Box>
          ) : (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="grey.500">No valid URL</Typography>
            </Box>
          )}
        </Box>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>
          {current.title}
        </Typography>
      </Box>

      {/* Playlist */}
      <Box sx={{ width: { xs: '100%', md: 220 }, flexShrink: 0 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
          Playlist ({videos.length})
        </Typography>
        <List dense disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          {videos.map((v, i) => (
            <ListItemButton
              key={v.id}
              selected={i === active}
              onClick={() => setActive(i)}
              sx={{
                py: 0.75, px: 1.5,
                borderBottom: i < videos.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                {i === active
                  ? <PlayCircleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  : <PlayCircleOutlineIcon sx={{ fontSize: 18, color: 'text.disabled' }} />}
              </ListItemIcon>
              <ListItemText
                primary={v.title || `Video ${i + 1}`}
                slotProps={{ primary: { variant: 'body2', noWrap: true, fontWeight: i === active ? 600 : 400, color: i === active ? 'primary.main' : 'text.primary' } as any }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default VideoCarouselView;
