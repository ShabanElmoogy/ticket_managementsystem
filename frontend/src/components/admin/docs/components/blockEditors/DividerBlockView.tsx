import React from 'react';
import { Divider } from '@mui/material';
import { BlockSettings } from '../../types/types';

const DividerBlockView: React.FC<{ settings: BlockSettings }> = ({ settings }) => (
  <Divider sx={{ borderColor: settings.dividerColor, borderBottomWidth: settings.dividerThickness || 1 }} />
);

export default DividerBlockView;