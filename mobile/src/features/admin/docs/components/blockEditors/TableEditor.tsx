import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import type { TableBlock } from '../../types/types';

interface Props { block: TableBlock; isDark: boolean; onChange: (patch: Partial<TableBlock>) => void; }

const TableEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const updateHeader = (idx: number, val: string) => {
    const headers = [...block.headers];
    headers[idx] = val;
    onChange({ headers });
  };
  const updateCell = (rowIdx: number, colIdx: number, val: string) => {
    const rows = block.rows.map((r) => [...r]);
    rows[rowIdx][colIdx] = val;
    onChange({ rows });
  };
  const addCol = () => {
    onChange({
      headers: [...block.headers, `Column ${block.headers.length + 1}`],
      rows: block.rows.map((r) => [...r, '']),
    });
  };
  const addRow = () => {
    onChange({ rows: [...block.rows, block.headers.map(() => '')] });
  };
  const removeCol = (idx: number) => {
    if (block.headers.length <= 1) return;
    onChange({
      headers: block.headers.filter((_, i) => i !== idx),
      rows: block.rows.map((r) => r.filter((_, i) => i !== idx)),
    });
  };
  const removeRow = (idx: number) => {
    if (block.rows.length <= 1) return;
    onChange({ rows: block.rows.filter((_, i) => i !== idx) });
  };

  const cellStyle = {
    fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b',
    paddingHorizontal: 6, paddingVertical: 4,
    minWidth: 80,
  };
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {/* Header row */}
          <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
            {block.headers.map((h, ci) => (
              <View key={ci} style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor, minWidth: 90 }}>
                <TextInput
                  value={h}
                  onChangeText={(v) => updateHeader(ci, v)}
                  style={{ ...cellStyle, fontWeight: '700', flex: 1 }}
                />
                <Pressable onPress={() => removeCol(ci)} hitSlop={4}>
                  <Text style={{ fontSize: 10, color: '#ef4444', paddingRight: 4 }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
          {/* Data rows */}
          {block.rows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', backgroundColor: ri % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') }}>
              {row.map((cell, ci) => (
                <View key={ci} style={{ borderWidth: 1, borderColor, minWidth: 90 }}>
                  <TextInput
                    value={cell}
                    onChangeText={(v) => updateCell(ri, ci, v)}
                    style={cellStyle}
                  />
                </View>
              ))}
              <Pressable onPress={() => removeRow(ri)} style={{ justifyContent: 'center', paddingHorizontal: 6 }} hitSlop={4}>
                <Text style={{ fontSize: 10, color: '#ef4444' }}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={addRow} style={{ paddingVertical: 4 }}>
          <Text style={{ fontSize: 12, color: '#3b82f6' }}>+ Add row</Text>
        </Pressable>
        <Pressable onPress={addCol} style={{ paddingVertical: 4 }}>
          <Text style={{ fontSize: 12, color: '#3b82f6' }}>+ Add column</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default TableEditor;
