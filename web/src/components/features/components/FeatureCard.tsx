import React from 'react';
import { Box, Card, CardContent, Typography, IconButton, Tooltip, Avatar, Chip, Button } from '@mui/material';
import { ThumbUp, ThumbUpOutlined, Edit, Delete, Apps, Person, OpenInNew, AccountTree } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import type { FeatureRequest } from '../../../services/api/types';
import FeatureStatusChip from './FeatureStatusChip';
import { formatDate } from '../../../shared/utils/dateUtils';

interface Props {
  feature: FeatureRequest;
  isAdmin: boolean;
  onVote: (id: string) => void;
  onEdit: (feature: FeatureRequest) => void;
  onDelete: (id: string) => void;
}

const FeatureCard: React.FC<Props> = ({ feature, isAdmin, onVote, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const openDetail = () => navigate(`/features/${feature.id}`, { state: { from: location.pathname } });

  return (
    <Card sx={{ mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          {/* Vote column */}
          <Box display="flex" flexDirection="column" alignItems="center" sx={{ minWidth: 48 }}>
            <Tooltip title={feature.votedByMe ? 'Remove vote' : 'Upvote'}>
              <IconButton size="small" color={feature.votedByMe ? 'primary' : 'default'} onClick={() => onVote(feature.id)}>
                {feature.votedByMe ? <ThumbUp /> : <ThumbUpOutlined />}
              </IconButton>
            </Tooltip>
            <Typography variant="caption" fontWeight={700}>{feature.voteCount}</Typography>
          </Box>

          {/* Content */}
          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>{feature.title}</Typography>
              <FeatureStatusChip status={feature.status} />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}>
              {feature.description}
            </Typography>

            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem', bgcolor: 'primary.main' }}>
                {feature.submittedBy.name.charAt(0)}
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                {feature.submittedBy.name} · {formatDate(feature.createdAt)}
              </Typography>
              {feature.epicTitle && (
                <Chip
                  icon={<AccountTree sx={{ fontSize: '0.75rem !important' }} />}
                  label={feature.epicTitle}
                  size="small" variant="outlined" color="primary"
                  sx={{ height: 20, fontSize: '0.65rem', cursor: 'pointer' }}
                  onClick={() => feature.epicId && navigate(`/epics/${feature.epicId}`)}
                />
              )}
              {feature.applicationName && (
                <Chip icon={<Apps sx={{ fontSize: '0.75rem !important' }} />} label={feature.applicationName} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
              )}
              {feature.customerName && (
                <Chip icon={<Person sx={{ fontSize: '0.75rem !important' }} />} label={feature.customerName} size="small" variant="outlined" color="secondary" sx={{ height: 20, fontSize: '0.65rem' }} />
              )}
            </Box>
          </Box>

          {/* Admin actions */}
          {isAdmin && (
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(feature)}><Edit fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => onDelete(feature.id)}><Delete fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        <Box display="flex" justifyContent="flex-end" mt={1}>
          <Button size="small" endIcon={<OpenInNew fontSize="small" />} onClick={openDetail}>
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
