import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, ScrollView } from 'react-native';
import AppScreenHeader from '../../../shared/components/AppScreenHeader';
import AppDeleteDialog from '../../../shared/components/AppDeleteDialog';
import AppDataTable, { type ColDef } from '../../../shared/components/AppDataTable';
import { useUiStore } from '../../../stores/uiStore';

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
  itemType?: string;
  canAdd?: boolean;
  onRowPress?: (item: T) => void;
}

function AdminCrudScreen<T extends { id: string }>({
  title, icon, entities, loading, columns, searchFields,
  renderForm, onDelete,
  getItemName, itemType = 'item', canAdd = true, onRowPress,
}: AdminCrudScreenProps<T>) {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

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

  const handleAdd    = ()         => { setFormItem(null); setFormOpen(true); };
  const handleDelete = async ()   => {
    if (!deleteItem) return;
    setDeleting(true);
    try { await onDelete(deleteItem.id); }
    finally { setDeleting(false); setDeleteItem(null); }
  };

  // Inject Edit + Delete action column
  const actionCol: ColDef<T> = {
    field: '__actions__',
    headerName: 'Actions',
    width: 100,
    sortable: false,
    align: 'center',
    renderCell: (row) => (
      <View className="flex-row gap-3">
        <Pressable onPress={() => { setFormItem(row); setFormOpen(true); }}>
          <Text className="text-blue-500 text-xs font-semibold">Edit</Text>
        </Pressable>
        <Pressable onPress={() => setDeleteItem(row)}>
          <Text className="text-red-500 text-xs font-semibold">Del</Text>
        </Pressable>
      </View>
    ),
  };

  const allColumns = [...columns, actionCol];

  return (
    <View className={`flex-1 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <AppScreenHeader
        title={title}
        badge={entities.length}
        onAdd={canAdd ? handleAdd : undefined}
        addLabel={`Add ${itemType}`}
      />

      {/* Search bar */}
      <View className={`mx-4 mb-3 flex-row items-center border-2 rounded-xl px-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
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

      {/* Row count */}
      <Text className={`text-xs px-4 mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {filtered.length} of {entities.length} {title.toLowerCase()}
      </Text>

      {/* Data table */}
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
