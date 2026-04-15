import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, ScrollView, FlatList, useWindowDimensions } from 'react-native';
import AppScreenHeader from '../../../shared/components/AppScreenHeader';
import AppDeleteDialog from '../../../shared/components/AppDeleteDialog';
import AppDataTable, { type ColDef } from '../../../shared/components/AppDataTable';
import { useUiStore, type AdminView } from '../../../stores/uiStore';

export interface AdminCrudScreenProps<T extends { id: string }> {
  title: string;
  icon: string;
  entities: T[];
  loading: boolean;
  columns: ColDef<T>[];
  searchFields: (keyof T)[];
  renderForm: (item: T | null, onClose: () => void) => React.ReactNode;
  onDelete: (id: string) => Promise<void>;
  getItemName?: (item: T) => string;
  /** Optional: render a card for grid/compact view. Falls back to auto-generated card. */
  renderCard?: (item: T, onEdit: () => void, onDelete: () => void) => React.ReactNode;
  itemType?: string;
  canAdd?: boolean;
  onRowPress?: (item: T) => void;
}

// ── View toggle button ─────────────────────────────────────────────────────

const VIEW_OPTIONS: { view: AdminView; icon: string; label: string }[] = [
  { view: 'table',   icon: '⊞', label: 'Table'   },
  { view: 'grid',    icon: '▦', label: 'Grid'    },
  { view: 'compact', icon: '☰', label: 'Compact' },
];

const ViewToggle: React.FC<{
  current: AdminView;
  onChange: (v: AdminView) => void;
  isDark: boolean;
}> = ({ current, onChange, isDark }) => (
  <View className={`flex-row rounded-lg overflow-hidden border ${isDark ? 'border-slate-600' : 'border-gray-200'}`}>
    {VIEW_OPTIONS.map(({ view, icon, label }) => {
      const active = current === view;
      return (
        <Pressable
          key={view}
          onPress={() => onChange(view)}
          className={`px-2.5 py-1.5 items-center justify-center ${
            active
              ? 'bg-blue-600'
              : isDark ? 'bg-slate-700' : 'bg-white'
          }`}
          accessibilityLabel={label}
        >
          <Text style={{ fontSize: 14, color: active ? '#fff' : isDark ? '#94a3b8' : '#6b7280' }}>
            {icon}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

// ── Auto-generated grid card ───────────────────────────────────────────────

function AutoCard<T extends { id: string }>({
  item, columns, onEdit, onDelete: onDel, isDark, width,
}: {
  item: T;
  columns: ColDef<T>[];
  onEdit: () => void;
  onDelete: () => void;
  isDark: boolean;
  width: number;
}) {
  // Show ALL non-action columns
  const visibleCols = columns.filter((c) => c.field !== '__actions__');

  return (
    <View
      style={{
        width,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#e5e7eb',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      }}
    >
      {visibleCols.map((col, i) => {
        const val = col.valueGetter
          ? col.valueGetter(item)
          : (item as any)[col.field as string];

        return (
          <View
            key={String(col.field)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: i > 0 ? 6 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                width: 80,
                flexShrink: 0,
                color: isDark ? '#64748b' : '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: 0.3,
              }}
              numberOfLines={1}
            >
              {col.headerName}
            </Text>
            {col.renderCell ? (
              <View style={{ flex: 1 }}>{col.renderCell(item)}</View>
            ) : (
              <Text
                style={{
                  fontSize: 13,
                  flex: 1,
                  fontWeight: i === 0 ? '600' : '400',
                  color: isDark ? (i === 0 ? '#f1f5f9' : '#cbd5e1') : (i === 0 ? '#111827' : '#4b5563'),
                }}
                numberOfLines={2}
              >
                {val == null || val === '' ? '—' : String(val)}
              </Text>
            )}
          </View>
        );
      })}

      {/* Actions */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 10,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#334155' : '#f1f5f9',
        }}
      >
        <Pressable
          onPress={onEdit}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: '#eff6ff',
          }}
        >
          <Text style={{ fontSize: 13 }}>✏️</Text>
          <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: '600' }}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={onDel}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: '#fef2f2',
          }}
        >
          <Text style={{ color: '#ef4444', fontSize: 13 }}>✕</Text>
          <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Auto-generated compact row ─────────────────────────────────────────────

function CompactRow<T extends { id: string }>({
  item, columns, onEdit, onDelete: onDel, isDark,
}: {
  item: T;
  columns: ColDef<T>[];
  onEdit: () => void;
  onDelete: () => void;
  isDark: boolean;
}) {
  const visibleCols = columns.filter((c) => c.field !== '__actions__').slice(0, 3);
  const primary = visibleCols[0];
  const secondary = visibleCols.slice(1);

  return (
    <View
      className={`flex-row items-center px-3 py-2.5 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}
    >
      {/* Left: primary + secondary */}
      <View className="flex-1 mr-2">
        {primary && (
          <Text
            className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
            numberOfLines={1}
          >
            {primary.renderCell
              ? undefined
              : String((item as any)[primary.field as string] ?? '—')}
          </Text>
        )}
        {primary?.renderCell && (
          <View>{primary.renderCell(item)}</View>
        )}
        {secondary.length > 0 && (
          <View className="flex-row gap-2 mt-0.5 flex-wrap">
            {secondary.map((col) => (
              <View key={String(col.field)}>
                {col.renderCell ? (
                  col.renderCell(item)
                ) : (
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`} numberOfLines={1}>
                    {String((item as any)[col.field as string] ?? '—')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Right: icon actions */}
      <View className="flex-row gap-1">
        <Pressable
          onPress={onEdit}
          className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center active:bg-blue-100"
        >
          <Text className="text-base">✏️</Text>
        </Pressable>
        <Pressable
          onPress={onDel}
          className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center active:bg-red-100"
        >
          <Text style={{ color: '#ef4444', fontSize: 18, lineHeight: 20 }}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

function AdminCrudScreen<T extends { id: string }>({
  title, icon, entities, loading, columns, searchFields,
  renderForm, onDelete, renderCard,
  getItemName, itemType = 'item', canAdd = true, onRowPress,
}: AdminCrudScreenProps<T>) {
  const { width: screenWidth } = useWindowDimensions();
  const PADDING = 16;
  const GAP     = 8;
  const cardWidth = Math.floor((screenWidth - PADDING * 2 - GAP) / 2);

  const { colorMode, getAdminView, setAdminView } = useUiStore();
  const isDark = colorMode === 'dark';

  const view = getAdminView(title);

  const [search,     setSearch]     = useState('');
  const [formItem,   setFormItem]   = useState<T | null>(null);
  const [formOpen,   setFormOpen]   = useState(false);
  const [deleteItem, setDeleteItem] = useState<T | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  const filtered = search.trim()
    ? entities.filter((e) =>
        searchFields.some((f) =>
          String((e as any)[f as string] ?? '').toLowerCase().includes(search.toLowerCase())
        )
      )
    : entities;

  const handleAdd    = () => { setFormItem(null); setFormOpen(true); };
  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try { await onDelete(deleteItem.id); }
    finally { setDeleting(false); setDeleteItem(null); }
  };

  // Table view: inject actions column
  const actionCol: ColDef<T> = {
    field: '__actions__',
    headerName: '',
    width: 72,
    sortable: false,
    align: 'center',
    renderCell: (row) => (
      <View className="flex-row gap-1 items-center justify-center">
        <Pressable
          onPress={() => { setFormItem(row); setFormOpen(true); }}
          className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center active:bg-blue-100"
        >
          <Text className="text-base">✏️</Text>
        </Pressable>
        <Pressable
          onPress={() => setDeleteItem(row)}
          className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center active:bg-red-100"
        >
          <Text style={{ color: '#ef4444', fontSize: 18, lineHeight: 20 }}>✕</Text>
        </Pressable>
      </View>
    ),
  };

  const allColumns = [...columns, actionCol];

  return (
    <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <AppScreenHeader
        title={title}
        badge={entities.length}
        onAdd={canAdd ? handleAdd : undefined}
        addLabel={`Add ${itemType}`}
        leftActions={
          <ViewToggle
            current={view}
            onChange={(v) => setAdminView(title, v)}
            isDark={isDark}
          />
        }
      />

      {/* Search bar */}
      <View className={`mx-4 mb-2 flex-row items-center border-2 rounded-xl px-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <Text className="mr-2 text-gray-400">🔍</Text>
        <TextInput
          className={`flex-1 py-2.5 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
          placeholder={`Search ${title.toLowerCase()}…`}
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Text className="text-gray-400">✕</Text>
          </Pressable>
        )}
      </View>

      {/* Count */}
      <Text className={`text-xs px-4 mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {filtered.length} of {entities.length} {title.toLowerCase()}
      </Text>

      {/* ── Table view ── */}
      {view === 'table' && (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
          <AppDataTable<T>
            rows={filtered}
            columns={allColumns}
            loading={loading}
            emptyMessage={search ? `No ${title.toLowerCase()} match "${search}"` : `No ${title.toLowerCase()} yet`}
            onRowPress={onRowPress}
            style={{ marginBottom: 8 }}
          />
        </ScrollView>
      )}

      {/* ── Grid view ── */}
      {view === 'grid' && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: PADDING, paddingBottom: 24, gap: GAP }}
          renderItem={({ item }) =>
            renderCard ? (
              renderCard(
                item,
                () => { setFormItem(item); setFormOpen(true); },
                () => setDeleteItem(item),
              )
            ) : (
              <AutoCard
                item={item}
                columns={columns}
                onEdit={() => { setFormItem(item); setFormOpen(true); }}
                onDelete={() => setDeleteItem(item)}
                isDark={isDark}
                width={screenWidth - PADDING * 2}
              />
            )
          }
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {search ? `No ${title.toLowerCase()} match "${search}"` : `No ${title.toLowerCase()} yet`}
              </Text>
            </View>
          }
        />
      )}

      {/* ── Compact view ── */}
      {view === 'compact' && (
        <ScrollView
          className={`flex-1 mx-4 rounded-xl overflow-hidden border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className={isDark ? 'bg-slate-800' : 'bg-white'}>
            {filtered.length === 0 ? (
              <View className="items-center py-12">
                <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {search ? `No ${title.toLowerCase()} match "${search}"` : `No ${title.toLowerCase()} yet`}
                </Text>
              </View>
            ) : (
              filtered.map((item) => (
                <CompactRow
                  key={item.id}
                  item={item}
                  columns={columns}
                  onEdit={() => { setFormItem(item); setFormOpen(true); }}
                  onDelete={() => setDeleteItem(item)}
                  isDark={isDark}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Form modal */}
      {formOpen && renderForm(formItem, () => setFormOpen(false))}

      {/* Delete dialog */}
      <AppDeleteDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        itemName={deleteItem && getItemName ? getItemName(deleteItem) : undefined}
        itemType={itemType}
        loading={deleting}
      />
    </View>
  );
}

export default AdminCrudScreen;
