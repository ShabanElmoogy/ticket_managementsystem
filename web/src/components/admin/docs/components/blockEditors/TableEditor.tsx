import React from 'react';
import { Box, TextField, IconButton, Button, Typography, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { TableBlock, BlockSettings } from '../../types';

const TableEditor: React.FC<{
  block: TableBlock;
  onChange: (p: Partial<TableBlock>) => void;
  settings: BlockSettings;
  onSettingsChange: (p: Partial<BlockSettings>) => void;
}> = ({ block, onChange }) => {
  const headers = block.headers ?? ['Column 1', 'Column 2'];
  const rows    = block.rows    ?? [['', '']];

  const setHeader = (i: number, v: string) => { const h = [...headers]; h[i] = v; onChange({ headers: h }); };
  const setCell   = (r: number, c: number, v: string) => { const rs = rows.map(row => [...row]); rs[r][c] = v; onChange({ rows: rs }); };
  const addCol    = () => { onChange({ headers: [...headers, `Column ${headers.length + 1}`], rows: rows.map(r => [...r, '']) }); };
  const removeCol = (c: number) => { onChange({ headers: headers.filter((_, i) => i !== c), rows: rows.map(r => r.filter((_, i) => i !== c)) }); };
  const addRow    = () => onChange({ rows: [...rows, headers.map(() => '')] });
  const removeRow = (r: number) => onChange({ rows: rows.filter((_, i) => i !== r) });

  const cellSx = { '& .MuiOutlinedInput-root': { borderRadius: 0 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } };

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display: 'inline-block', minWidth: '100%' }}>
        {/* Header row */}
        <Box display="flex">
          {headers.map((h, c) => (
            <Box key={c} sx={{ flex: 1, minWidth: 120, position: 'relative', '&:hover .col-del': { opacity: 1 } }}>
              <TextField size="small" fullWidth value={h} onChange={e => setHeader(c, e.target.value)}
                sx={{ ...cellSx, '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'action.hover', fontWeight: 600 } }} />
              {headers.length > 1 && (
                <Tooltip title="Remove column">
                  <IconButton className="col-del" size="small" color="error" onClick={() => removeCol(c)}
                    sx={{ position: 'absolute', top: -10, right: -10, opacity: 0, transition: 'opacity 0.15s', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', p: 0.25, zIndex: 1 }}>
                    <DeleteIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}
          <Box sx={{ width: 32 }} />
        </Box>

        {/* Data rows */}
        {rows.map((row, r) => (
          <Box key={r} display="flex" alignItems="center">
            {row.map((cell, c) => (
              <Box key={c} sx={{ flex: 1, minWidth: 120 }}>
                <TextField size="small" fullWidth value={cell} onChange={e => setCell(r, c, e.target.value)} sx={cellSx} />
              </Box>
            ))}
            {rows.length > 1 && (
              <IconButton size="small" color="error" onClick={() => removeRow(r)} sx={{ width: 32, flexShrink: 0 }}>
                <DeleteIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}
          </Box>
        ))}
      </Box>

      <Box display="flex" gap={1} mt={1}>
        <Button size="small" startIcon={<AddIcon />} onClick={addRow}>Add row</Button>
        <Button size="small" startIcon={<AddIcon />} onClick={addCol}>Add column</Button>
      </Box>
    </Box>
  );
};

export default TableEditor;
