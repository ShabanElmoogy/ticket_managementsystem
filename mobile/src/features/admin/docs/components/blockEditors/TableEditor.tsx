import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useThemeColors, useIsDark } from '@/src/constants/theme';
import type { TableBlock } from '../../types/types';

interface Props { block: TableBlock; onChange: (patch: Partial<TableBlock>) => void; }

const TABLE_COLOR = '#0ea5e9';

const TableEditor: React.FC<Props> = ({ block, onChange }) => {
  const c      = useThemeColors();
  const isDark = useIsDark();

  const updateHeader = (idx: number, val: string) => {
    const headers = [...block.headers]; headers[idx] = val; onChange({ headers });
  };
  const updateCell = (ri: number, ci: number, val: string) => {
    const rows = block.rows.map((r) => [...r]); rows[ri][ci] = val; onChange({ rows });
  };
  const addCol = () => onChange({
    headers: [...block.headers, `Col ${block.headers.length + 1}`],
    rows: block.rows.map((r) => [...r, '']),
  });
  const addRow = () => onChange({ rows: [...block.rows, block.headers.map(() => '')] });
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

  const headerBg = c.intent.infoSurface;
  const borderC  = c.border.primary;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: TABLE_COLOR + '18' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: TABLE_COLOR }}>
            {block.headers.length} cols × {block.rows.length} rows
          </Text>
        </View>
      </View>

      <View style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: borderC }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header row */}
            <View style={{ flexDirection: 'row', backgroundColor: headerBg }}>
              {block.headers.map((h, ci) => (
                <View key={ci} style={{
                  minWidth: 100, borderRightWidth: 1, borderRightColor: borderC,
                  flexDirection: 'row', alignItems: 'center',
                }}>
                  <TextInput
                    value={h}
                    onChangeText={(v) => updateHeader(ci, v)}
                    style={{
                      flex: 1, fontSize: 12, fontWeight: '700',
                      color: c.intent.info,
                      paddingHorizontal: 10, paddingVertical: 8,
                    }}
                  />
                  <Pressable onPress={() => removeCol(ci)} hitSlop={4} style={{ paddingRight: 6 }}>
                    <Text style={{ fontSize: 10, color: '#ef4444' }}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Data rows */}
            {block.rows.map((row, ri) => (
              <View key={ri} style={{
                flexDirection: 'row',
                backgroundColor: ri % 2 === 0 ? c.surface.card : c.surface.tertiary,
                borderTopWidth: 1, borderTopColor: borderC,
              }}>
                {row.map((cell, ci) => (
                  <View key={ci} style={{ minWidth: 100, borderRightWidth: 1, borderRightColor: borderC }}>
                    <TextInput
                      value={cell}
                      onChangeText={(v) => updateCell(ri, ci, v)}
                      placeholder="—"
                      placeholderTextColor={c.border.secondary}
                      style={{ fontSize: 13, color: c.text.primary, paddingHorizontal: 10, paddingVertical: 7 }}
                    />
                  </View>
                ))}
                <Pressable onPress={() => removeRow(ri)} style={{ justifyContent: 'center', paddingHorizontal: 8 }} hitSlop={4}>
                  <Text style={{ fontSize: 11, color: '#ef4444' }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[{ label: 'Add Row', fn: addRow }, { label: 'Add Column', fn: addCol }].map(({ label, fn }) => (
          <Pressable
            key={label}
            onPress={fn}
            style={({ pressed }) => ({
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
              paddingVertical: 8, borderRadius: 8,
              backgroundColor: pressed ? TABLE_COLOR + '22' : TABLE_COLOR + '12',
              borderWidth: 1, borderColor: TABLE_COLOR + '44',
            })}
          >
            <Text style={{ fontSize: 14, color: TABLE_COLOR }}>+</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: TABLE_COLOR }}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default TableEditor;
