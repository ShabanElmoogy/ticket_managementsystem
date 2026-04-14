import React from 'react';
import {
  Box, TextField, IconButton, Tooltip, Typography,
  List, ListItem, ListItemText, ListItemSecondaryAction, alpha, useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import type { VideoCarouselBlock, VideoItem } from '../../types';
import { newId } from '../../utils/idUtils';

interface Props {
  block: VideoCarouselBlock;
  onChange: (patch: Partial<VideoCarouselBlock>) => void;
}

const VideoCarouselEditor: React.FC<Props> = ({ block, onChange }) => {
  const theme = useTheme();
  const videos: VideoItem[] = block.videos ?? [];

  const update = (index: number, patch: Partial<VideoItem>) => {
    onChange({ videos: videos.map((v, i) => i === index ? { ...v, ...patch } : v) });
  };

  const add = () => {
    onChange({ videos: [...videos, { id: newId(), title: `Video ${videos.length + 1}`, url: '' }] });
  };

  const remove = (index: number) => {
    onChange({ videos: videos.filter((_, i) => i !== index) });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= videos.length) return;
    const copy = [...videos];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    onChange({ videos: copy });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <OndemandVideoIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        <Typography variant="subtitle2" fontWeight={600}>Video Carousel</Typography>
        <Typography variant="caption" color="text.secondary">({videos.length} video{videos.length !== 1 ? 's' : ''})</Typography>
      </Box>

      <List dense disablePadding sx={{ mb: 1 }}>
        {videos.map((video, i) => (
          <ListItem
            key={video.id}
            disablePadding
            sx={{
              mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              flexDirection: 'column', alignItems: 'stretch', p: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
              <DragIndicatorIcon sx={{ fontSize: 16, color: 'text.disabled', cursor: 'grab' }} />
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                Video {i + 1}
              </Typography>
              <Tooltip title="Move up">
                <span>
                  <IconButton size="small" disabled={i === 0} onClick={() => move(i, i - 1)} sx={{ p: 0.25 }}>
                    <Box component="span" sx={{ fontSize: 12, lineHeight: 1 }}>↑</Box>
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move down">
                <span>
                  <IconButton size="small" disabled={i === videos.length - 1} onClick={() => move(i, i + 1)} sx={{ p: 0.25 }}>
                    <Box component="span" sx={{ fontSize: 12, lineHeight: 1 }}>↓</Box>
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Remove">
                <IconButton size="small" color="error" onClick={() => remove(i)} sx={{ p: 0.25 }}>
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>

            <TextField
              size="small" fullWidth
              label="Video title"
              value={video.title}
              onChange={(e) => update(i, { title: e.target.value })}
              sx={{ mb: 0.75 }}
            />
            <TextField
              size="small" fullWidth
              label="URL (YouTube, Vimeo, or direct mp4)"
              placeholder="https://youtube.com/watch?v=..."
              value={video.url}
              onChange={(e) => update(i, { url: e.target.value })}
            />
          </ListItem>
        ))}
      </List>

      <Tooltip title="Add video">
        <IconButton
          size="small" onClick={add}
          sx={{
            border: '1px dashed', borderColor: 'primary.main',
            borderRadius: 1, px: 2, py: 0.5, width: '100%',
            color: 'primary.main', gap: 0.5,
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
          }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" fontWeight={600}>Add video</Typography>
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default VideoCarouselEditor;
