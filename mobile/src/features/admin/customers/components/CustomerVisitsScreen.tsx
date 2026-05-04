/**
 * CustomerVisitsScreen.tsx
 *
 * Thin orchestration layer.
 * All UI sub-components live in ./visits/
 * All types/constants live in ./visits/visits.types.ts
 * All styles live in ./visits/visits.styles.ts
 *
 * Architecture: single FlatList with ListHeaderComponent so the whole
 * screen scrolls as one native unit  no nested scroll containers.
 */

import React, {
  useState, useCallback, useRef, useMemo, useEffect,
} from 'react';
import {
  View, Text, Pressable,
  Platform,
  useWindowDimensions, KeyboardAvoidingView,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN             = require('react-native') as any;
const FlatList       = RN.FlatList       as any;
const RefreshControl = RN.RefreshControl as any;

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useThemeColors, FontSize, Spacing } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { QUERY_KEYS, PAGINATION } from '@/src/constants/api';
import { customersApi } from '../api/customers';
import { useCustomerVisits } from '../hooks/useCustomerVisits';
import { useAuthStore } from '@/src/stores/authStore';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import AppTextInput from '@/src/shared/components/forms/AppTextInput';
import AppEmptyState from '@/src/shared/components/feedback/AppEmptyState';
import SaveVisitModal from './SaveVisitModal';

import {
  VisitMapPanel,
  CustomerChipBar,
  CustomerInfoCard,
  VisitStatsRow,
  VisitToolbar,
  VisitFilterBar,
  VisitTableRow,
  VisitGridCard,
  VisitCompactRow,
} from './visits/index';
import s from './visits/visits.styles';
import type {
  ViewMode, VisitStatus, VisitStats, VisitRowProps,
} from './visits/visits.types';
import type { CustomerVisit, CreateVisitData } from '@/src/services/api/types/index';

//  Props 

interface Props { onClose: () => void }

//  Screen 

const CustomerVisitsScreen: React.FC<Props> = ({ onClose }) => {
  const { t }      = useTranslation();
  const c          = useThemeColors();
  const insets     = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { user }   = useAuthStore();
  const isAdmin    = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN';
  const userId     = user?.id ?? '';
  const MAP_H      = Math.round(height * 0.30);

  //  UI state 
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [editingVisit,  setEditingVisit]  = useState<CustomerVisit | null>(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [visitSearch,   setVisitSearch]   = useState('');
  const [statusFilter,  setStatusFilter]  = useState<VisitStatus | 'ALL'>('ALL');
  const [viewMode,      setViewMode]      = useState<ViewMode>('table');
  const [mapCollapsed,  setMapCollapsed]  = useState(true);
  const mapRef = useRef<any>(null);

  //  Data 
  const { data: allCustomers = [], isLoading: customersLoading } = useQuery({
    queryKey: QUERY_KEYS.CUSTOMERS.all,
    queryFn:  () => customersApi.getCustomers(),
    staleTime: PAGINATION.LIST_STALE_TIME,
  });

  const mappedCustomers = useMemo(
    () => allCustomers.filter((cu) => cu.latitude != null && cu.longitude != null),
    [allCustomers],
  );

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return mappedCustomers;
    const q = searchQuery.toLowerCase();
    return mappedCustomers.filter(
      (cu) => cu.name.toLowerCase().includes(q) || (cu.company ?? '').toLowerCase().includes(q),
    );
  }, [mappedCustomers, searchQuery]);

  const selectedCustomer = useMemo(
    () => allCustomers.find((cu) => cu.id === selectedId) ?? null,
    [allCustomers, selectedId],
  );

  const {
    visits, isLoading: visitsLoading, refetch: refetchVisits,
    createVisit, updateVisit, deleteVisit,
    isCreating, isUpdating,
  } = useCustomerVisits(selectedId ?? '');

  const displayedVisits = useMemo(() => {
    let list = visits;
    if (statusFilter !== 'ALL') list = list.filter((v) => v.status === statusFilter);
    if (visitSearch.trim()) {
      const q = visitSearch.toLowerCase();
      list = list.filter(
        (v) =>
          (v.notes ?? '').toLowerCase().includes(q) ||
          (v.user?.name ?? '').toLowerCase().includes(q) ||
          v.status.toLowerCase().includes(q),
      );
    }
    return list;
  }, [visits, statusFilter, visitSearch]);

  //  Side effects 
  useEffect(() => {
    if (!selectedId && filteredCustomers.length > 0) setSelectedId(filteredCustomers[0].id);
  }, [filteredCustomers, selectedId]);

  useEffect(() => {
    if (!selectedCustomer?.latitude || !mapRef.current || mapCollapsed) return;
    mapRef.current.animateToRegion(
      {
        latitude:       selectedCustomer.latitude,
        longitude:      selectedCustomer.longitude!,
        latitudeDelta:  0.01,
        longitudeDelta: 0.01,
      },
      400,
    );
  }, [selectedCustomer?.id, mapCollapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  //  Handlers 
  const handleSelectCustomer = useCallback((id: string) => {
    setSelectedId(id);
    setSaveModalOpen(false);
    setEditingVisit(null);
    setVisitSearch('');
    setStatusFilter('ALL');
  }, []);

  const handleLogVisit  = useCallback(() => { setEditingVisit(null); setSaveModalOpen(true); }, []);
  const handleEditVisit = useCallback((v: CustomerVisit) => { setEditingVisit(v); setSaveModalOpen(true); }, []);
  const handleDeleteVisit = useCallback(
    async (id: string) => { await deleteVisit(id, t('visits.messages.deleted')); },
    [deleteVisit, t],
  );
  const handleSaveVisit = useCallback(
    async (data: CreateVisitData): Promise<boolean> => {
      if (!selectedId) return false;
      if (editingVisit) return updateVisit(editingVisit.id, data, t('visits.messages.updated'));
      return createVisit(data, t('visits.messages.created'));
    },
    [selectedId, editingVisit, createVisit, updateVisit, t],
  );

  //  Map initial region 
  const initialRegion = useMemo(() => {
    if (mappedCustomers.length === 0)
      return { latitude: 24.7136, longitude: 46.6753, latitudeDelta: 5, longitudeDelta: 5 };
    const lats = mappedCustomers.map((cu) => cu.latitude!);
    const lngs = mappedCustomers.map((cu) => cu.longitude!);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    return {
      latitude:       (minLat + maxLat) / 2,
      longitude:      (minLng + maxLng) / 2,
      latitudeDelta:  Math.max((maxLat - minLat) * 1.4, 0.05),
      longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.05),
    };
  }, [mappedCustomers]);

  //  Visit stats 
  const stats: VisitStats = useMemo(() => ({
    total:     visits.length,
    completed: visits.filter((v) => v.status === 'COMPLETED').length,
    planned:   visits.filter((v) => v.status === 'PLANNED').length,
    noShow:    visits.filter((v) => v.status === 'NO_SHOW').length,
  }), [visits]);

  //  renderItem 
  const renderVisit = useCallback(({ item }: { item: CustomerVisit }) => {
    const props: VisitRowProps = {
      visit: item, userId, isAdmin,
      onEdit: handleEditVisit, onDelete: handleDeleteVisit, c,
    };
    if (viewMode === 'grid')    return <VisitGridCard    {...props} />;
    if (viewMode === 'compact') return <VisitCompactRow  {...props} />;
    return <VisitTableRow {...props} />;
  }, [viewMode, userId, isAdmin, handleEditVisit, handleDeleteVisit, c]);

  //  ListHeaderComponent 
  const ListHeader = useMemo(() => (
    <View>
      {/* Customer chip bar */}
      <CustomerChipBar
        customers={filteredCustomers}
        selectedId={selectedId}
        onSelectCustomer={handleSelectCustomer}
      />

      {/* Customer info card + stats + toolbar + filters */}
      {selectedCustomer ? (
        <>
          {!mapCollapsed ? (
            <CustomerInfoCard
              customer={selectedCustomer}
              onLogVisit={handleLogVisit}
              logVisitLabel={t('visits.logVisit')}
            />
          ) : null}
          {!mapCollapsed ? <VisitStatsRow stats={stats} /> : null}
          <VisitToolbar
            search={visitSearch}
            onSearchChange={setVisitSearch}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            placeholder={t('visits.searchVisits')}
          />
          <VisitFilterBar
            visits={visits}
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />

          {/* Table column header */}
          {viewMode === 'table' ? (
            <View style={[s.tableHeader, { backgroundColor: c.surface.tertiary, borderBottomColor: c.border.primary }]}>
              <Text style={[s.tableHeaderText, s.tableColDate,   { color: c.text.muted }]}>Date</Text>
              <Text style={[s.tableHeaderText, s.tableColStatus, { color: c.text.muted }]}>Status</Text>
              <Text style={[s.tableHeaderText, s.tableColBy,     { color: c.text.muted }]}>By</Text>
              <Text style={[s.tableHeaderText, s.tableColNotes,  { color: c.text.muted }]}>Notes</Text>
              <View style={s.tableColActions} />
            </View>
          ) : null}

          {/* Grid top padding */}
          {viewMode === 'grid' ? <View style={s.gridPadding} /> : null}

          {/* Loading / empty states */}
          {visitsLoading ? (
            <AppEmptyState
              ionicon="hourglass-outline"
              message={t('common.loading')}
              style={s.center}
            />
          ) : !visitsLoading && displayedVisits.length === 0 ? (
            <AppEmptyState
              ionicon="calendar-outline"
              ioniconColor={c.tint}
              message={visits.length === 0 ? t('visits.noVisitsYet') : t('visits.noVisitsMatch')}
              actionLabel={visits.length === 0 ? t('visits.logFirstVisit') : undefined}
              actionIcon={visits.length === 0 ? 'add-circle-outline' : undefined}
              onAction={visits.length === 0 ? handleLogVisit : undefined}
              style={s.center}
            />
          ) : null}
        </>
      ) : (
        <AppEmptyState
          ionicon="finger-print"
          ioniconColor={c.text.muted}
          message={t('visits.selectCustomer')}
          style={s.center}
        />
      )}
    </View>
  ), [
    c, t, filteredCustomers,
    selectedId, selectedCustomer, stats, visitSearch, viewMode, statusFilter,
    visits, displayedVisits, visitsLoading, mapCollapsed,
    handleSelectCustomer, handleLogVisit, setVisitSearch,
    setViewMode, setStatusFilter,
  ]);

  //  Render 
  return (
    <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.root, { backgroundColor: c.surface.secondary }]}>

        {/* Fixed header */}
        <View style={[s.header, { paddingTop: insets.top - 20, backgroundColor: c.surface.primary, borderBottomColor: c.border.primary }]}>
          <Pressable
            onPress={onClose}
            style={[s.backBtn, { backgroundColor: c.surface.tertiary }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back-outline" size={20} color={c.text.secondary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: c.text.primary }]}>
              {t('visits.title')}
            </Text>
            <Text style={[s.headerSub, { color: c.text.muted }]}>
              {mappedCustomers.length} {t('visits.customersWithLocation')}
            </Text>
          </View>

          {/* Map toggle */}
          <Pressable
            onPress={() => setMapCollapsed((v) => !v)}
            style={[
              s.mapToggleHeaderBtn,
              {
                backgroundColor: mapCollapsed ? c.surface.elevated : c.interactive.primary + '18',
                borderColor:     mapCollapsed ? c.border.primary   : c.interactive.primary,
              },
            ]}
            accessibilityRole="button"
          >
            <Ionicons
              name="map-outline"
              size={15}
              color={mapCollapsed ? c.text.secondary : c.interactive.primary}
            />
            <Text style={[s.mapToggleHeaderText, { color: mapCollapsed ? c.text.secondary : c.interactive.primary }]}>
              {mapCollapsed ? t('visits.showMap') : t('visits.hideMap')}
            </Text>
          </Pressable>
        </View>

        {/* Customer search + map — fixed above the scroll list, both hidden when collapsed */}
        {!mapCollapsed ? (
          <View style={[s.fixedMapZone, { backgroundColor: c.surface.primary, borderBottomColor: c.border.primary }]}>
          {/* Customer search — AppTextInput */}
          <View style={[s.searchBar, { backgroundColor: c.surface.primary, borderBottomColor: 'transparent' }]}>
            <AppTextInput
              fieldType="search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('visits.searchCustomers')}
              showClearButton
              onClear={() => setSearchQuery('')}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

            {/* Map panel */}
            <VisitMapPanel
              customers={filteredCustomers}
              selectedId={selectedId}
              mapHeight={MAP_H}
              collapsed={false}
              loading={customersLoading}
              mapRef={mapRef}
              initialRegion={initialRegion}
              onSelectCustomer={handleSelectCustomer}
              onToggleCollapse={setMapCollapsed}
            />
          </View>
        ) : null}

        {/* Single FlatList  header + visit rows scroll together */}
        <FlatList
          data={displayedVisits}
          keyExtractor={(v: CustomerVisit) => v.id}
          renderItem={renderVisit}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl
              refreshing={visitsLoading}
              onRefresh={refetchVisits}
              tintColor={c.interactive.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {/* Save / Edit Visit Modal */}
        {saveModalOpen && selectedCustomer ? (
          <SaveVisitModal
            customer={selectedCustomer}
            visit={editingVisit}
            onClose={() => { setSaveModalOpen(false); setEditingVisit(null); }}
            onSave={handleSaveVisit}
            isSaving={isCreating || isUpdating}
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
};

//  Wrapped export 

const Wrapped: React.FC<Props> = (props) => (
  <FeatureErrorBoundary featureName="CustomerVisits">
    <CustomerVisitsScreen {...props} />
  </FeatureErrorBoundary>
);

export default Wrapped;
