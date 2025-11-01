import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface BoardMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onSettings: () => void;
  onAnalytics: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const BoardMenu: React.FC<BoardMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onRefresh,
  onSettings,
  onAnalytics,
  onEdit,
  onArchive,
  onDelete,
  onShare,
  onExport,
  canEdit = true,
  canDelete = false,
}) => {
  const handleMenuItemClick = (action: () => void) => {
    action();
    onClose();
  };

  const menuItems = [
    <MenuItem key="refresh" onClick={() => handleMenuItemClick(onRefresh)}>
      <ListItemIcon>
        <RefreshIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Refresh Board</ListItemText>
    </MenuItem>,

    <Divider key="divider1" />,

    <MenuItem key="settings" onClick={() => handleMenuItemClick(onSettings)}>
      <ListItemIcon>
        <SettingsIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Board Settings</ListItemText>
    </MenuItem>,

    <MenuItem key="analytics" onClick={() => handleMenuItemClick(onAnalytics)}>
      <ListItemIcon>
        <AnalyticsIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Analytics</ListItemText>
    </MenuItem>,
  ];

  if (canEdit) {
    menuItems.push(<Divider key="divider2" />);

    if (onEdit) {
      menuItems.push(
        <MenuItem key="edit" onClick={() => handleMenuItemClick(onEdit)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Board</ListItemText>
        </MenuItem>
      );
    }

    if (onShare) {
      menuItems.push(
        <MenuItem key="share" onClick={() => handleMenuItemClick(onShare)}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share Board</ListItemText>
        </MenuItem>
      );
    }

    if (onExport) {
      menuItems.push(
        <MenuItem key="export" onClick={() => handleMenuItemClick(onExport)}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Board</ListItemText>
        </MenuItem>
      );
    }

    if (onArchive) {
      menuItems.push(
        <MenuItem key="archive" onClick={() => handleMenuItemClick(onArchive)}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive Board</ListItemText>
        </MenuItem>
      );
    }

    if (canDelete && onDelete) {
      menuItems.push(<Divider key="divider3" />);
      menuItems.push(
        <MenuItem
          key="delete"
          onClick={() => handleMenuItemClick(onDelete)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Board</ListItemText>
        </MenuItem>
      );
    }
  }

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          minWidth: 200,
        },
      }}
    >
      {menuItems}
    </Menu>
  );
};

export default BoardMenu;