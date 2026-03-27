import React, { useState, useEffect } from 'react';
import { Box, Button, Tooltip, Avatar, AvatarGroup } from '@mui/material';
import { Visibility as WatchIcon, VisibilityOff as UnwatchIcon } from '@mui/icons-material';
import { watchersApi, type Watcher } from './api/watchers';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  ticketId: string;
}

const WatcherButton: React.FC<Props> = ({ ticketId }) => {
  const { user } = useAuthStore();
  const [watchers, setWatchers] = useState<Watcher[]>([]);

  const isWatching = watchers.some((w) => w.id === user?.id);

  useEffect(() => {
    watchersApi.list(ticketId)
      .then((data) => { if (Array.isArray(data)) setWatchers(data); })
      .catch(() => {});
  }, [ticketId]);

  const handleToggle = () => {
    const watching = watchers.some((w) => w.id === user?.id);
    if (watching) {
      setWatchers((prev) => prev.filter((w) => w.id !== user?.id));
      watchersApi.unwatch(ticketId).catch(() =>
        watchersApi.list(ticketId).then((data) => { if (Array.isArray(data)) setWatchers(data); }).catch(() => {})
      );
    } else if (user) {
      setWatchers((prev) => [...prev, { id: user.id, name: user.name, email: user.email }]);
      watchersApi.watch(ticketId).catch(() =>
        watchersApi.list(ticketId).then((data) => { if (Array.isArray(data)) setWatchers(data); }).catch(() => {})
      );
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title={isWatching ? 'Stop watching' : 'Watch this ticket'}>
        <Button
          size="small"
          variant={isWatching ? 'contained' : 'outlined'}
          startIcon={isWatching ? <UnwatchIcon fontSize="small" /> : <WatchIcon fontSize="small" />}
          onClick={handleToggle}
          color={isWatching ? 'primary' : 'inherit'}
          sx={{ textTransform: 'none', minWidth: 100 }}
        >
          {isWatching ? 'Watching' : 'Watch'}
        </Button>
      </Tooltip>

      {watchers.length > 0 && (
        <Tooltip title={watchers.map((w) => w.name).join(', ')}>
          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.65rem' } }}>
            {watchers.map((w) => (
              <Avatar key={w.id} sx={{ width: 24, height: 24, fontSize: '0.65rem' }}>
                {w.name.charAt(0).toUpperCase()}
              </Avatar>
            ))}
          </AvatarGroup>
        </Tooltip>
      )}
    </Box>
  );
};

export default WatcherButton;
