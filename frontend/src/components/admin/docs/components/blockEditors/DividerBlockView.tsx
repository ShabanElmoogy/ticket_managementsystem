import React from 'react';
import { Divider } from '@mui/material';
import type { BlockSettings } from '../../types';

const DividerBlockView: React.FC<{ settings: BlockSettings }> = ({ settings }) => (
  <Divider sx={{ borderColor: settings.dividerColor, borderBottomWidth: settings.dividerThickness || 1 }} />
);

export default DividerBlockView;