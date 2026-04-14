import React, { useRef, useMemo } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { epicsApi } from '../api/epics';
import type { EpicNetworkNode } from '../../../services/api/types';

// ── Layout constants ─────────────────────────────────────────────────────────
const NODE_W = 160;
const NODE_H = 48;
const H_GAP  = 80;
const V_GAP  = 70;

const STATUS_COLOR: Record<string, string> = {
  DRAFT:     '#9e9e9e',
  ACTIVE:    '#1976d2',
  COMPLETED: '#2e7d32',
  CANCELLED: '#d32f2f',
};

const EDGE_COLOR: Record<string, string> = {
  BLOCKS:     '#d32f2f',
  RELATES_TO: '#1976d2',
  DUPLICATES: '#9c27b0',
  DEPENDS_ON: '#f57c00',
  SPLIT_FROM: '#0288d1',
  PARENT_OF:  '#607d8b',
};

const EDGE_LABEL: Record<string, string> = {
  BLOCKS:     'blocks',
  RELATES_TO: 'relates to',
  DUPLICATES: 'duplicates',
  DEPENDS_ON: 'depends on',
  SPLIT_FROM: 'split from',
  PARENT_OF:  'parent of',
};

// Simple force-free layout: arrange nodes in a grid
function layoutNodes(nodes: EpicNetworkNode[]): Map<string, { x: number; y: number }> {
  const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(n.id, {
      x: 40 + col * (NODE_W + H_GAP),
      y: 40 + row * (NODE_H + V_GAP),
    });
  });
  return positions;
}

interface Props {
  epics?: EpicNetworkNode[];
}

const EpicNetworkView: React.FC<Props> = () => {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);

  const { data: graph, isLoading } = useQuery({
    queryKey: ['epics', 'network'],
    queryFn: () => epicsApi.getNetworkGraph(),
    staleTime: 60_000,
  });

  const positions = useMemo(() => layoutNodes(graph?.nodes ?? []), [graph?.nodes]);

  const cols = Math.max(1, Math.ceil(Math.sqrt((graph?.nodes ?? []).length)));
  const rows = Math.ceil((graph?.nodes ?? []).length / cols);
  const svgW = 80 + cols * (NODE_W + H_GAP);
  const svgH = 80 + rows * (NODE_H + V_GAP);

  if (isLoading) {
    return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
        <Typography color="text.secondary">No epics to display in the network view.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Legend */}
      <Box display="flex" gap={1.5} flexWrap="wrap" mb={2}>
        {Object.entries(EDGE_LABEL).map(([type, label]) => (
          <Box key={type} display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 20, height: 2, bgcolor: EDGE_COLOR[type] ?? '#999', borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        ))}
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'auto', border: '1px solid', borderColor: 'divider', position: 'relative' }}>
        <svg
          ref={svgRef}
          width={svgW}
          height={svgH}
          style={{ display: 'block', minWidth: '100%' }}
        >
          <defs>
            {Object.entries(EDGE_COLOR).map(([type, color]) => (
              <marker
                key={type}
                id={`arrow-${type}`}
                markerWidth="8" markerHeight="8"
                refX="7" refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill={color} />
              </marker>
            ))}
          </defs>

          {/* Edges */}
          {(graph.edges ?? []).map((edge, i) => {
            const src = positions.get(edge.source);
            const tgt = positions.get(edge.target);
            if (!src || !tgt) return null;
            const x1 = src.x + NODE_W / 2;
            const y1 = src.y + NODE_H / 2;
            const x2 = tgt.x + NODE_W / 2;
            const y2 = tgt.y + NODE_H / 2;
            const color = EDGE_COLOR[edge.type] ?? '#999';
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            return (
              <g key={i}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color} strokeWidth={1.5} strokeDasharray={edge.type === 'PARENT_OF' ? '4 3' : undefined}
                  markerEnd={`url(#arrow-${edge.type})`}
                  opacity={0.7}
                />
                <text
                  x={mx} y={my - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill={color}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {EDGE_LABEL[edge.type] ?? edge.type}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;
            const color = STATUS_COLOR[node.status] ?? '#9e9e9e';
            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/epics/${node.id}`)}
              >
                <rect
                  x={pos.x} y={pos.y}
                  width={NODE_W} height={NODE_H}
                  rx={8} ry={8}
                  fill="white"
                  stroke={color}
                  strokeWidth={2}
                  filter="drop-shadow(0 1px 3px rgba(0,0,0,0.12))"
                />
                {/* Status bar on left */}
                <rect
                  x={pos.x} y={pos.y}
                  width={5} height={NODE_H}
                  rx={4} ry={4}
                  fill={color}
                />
                <text
                  x={pos.x + 14} y={pos.y + 18}
                  fontSize={10}
                  fontWeight="600"
                  fill="#333"
                  style={{ userSelect: 'none' }}
                >
                  {node.title.length > 18 ? node.title.slice(0, 17) + '…' : node.title}
                </text>
                <text
                  x={pos.x + 14} y={pos.y + 33}
                  fontSize={8.5}
                  fill={color}
                  style={{ userSelect: 'none' }}
                >
                  {node.status} · {node.priority}
                </text>
              </g>
            );
          })}
        </svg>
      </Paper>
    </Box>
  );
};

export default EpicNetworkView;
