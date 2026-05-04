/**
 * visits.styles.ts
 * Single StyleSheet for the entire CustomerVisits feature.
 * Defined in its own file so every component can import it without
 * circular-dependency or "used before defined" issues.
 */

import { StyleSheet } from 'react-native';
import { FontSize, FontWeight } from '@/src/constants/theme';

const s = StyleSheet.create({
  // ── Layout ──────────────────────────────────────────────────────────────────
  root: { flex: 1 },
  kav:  { flex: 1 },

  // ── Header ───────────────────────────────────────────────────────────────────
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  headerSub:   { fontSize: FontSize.xs, marginTop: 1 },

  // ── Customer search bar ───────────────────────────────────────────────────────
  searchBar: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },

  // ── Fixed map zone (search + map panel, sits above the FlatList) ─────────────
  fixedMapZone: { borderBottomWidth: 1 },

  // ── Map toggle button in the header ──────────────────────────────────────────
  mapToggleHeaderBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  mapToggleHeaderText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  // ── Map ───────────────────────────────────────────────────────────────────────
  mapWrapper:      { overflow: 'hidden' },
  mapFallback:     { alignItems: 'center', justifyContent: 'center' },
  mapFallbackText: { fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: 24, marginTop: 8 },
  mapBadge:        { position: 'absolute', top: 10, end: 10, borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  mapBadgeText:    { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  mapToggleBtn:    { position: 'absolute', bottom: 8, start: 8, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapToggleText:   { fontSize: FontSize.xs, fontWeight: '600' as const },
  mapShowBar:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  pin:             { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10, shadowOffset: { width: 0, height: 2 } },
  pinLabel:        { fontSize: 10, fontWeight: '700' as const, maxWidth: 60 },

  // ── Customer chip bar ─────────────────────────────────────────────────────────
  chipBar:        { borderBottomWidth: 1 },
  chipBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, maxWidth: 200 },
  chipName:       { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  chipSub:        { fontSize: 10 },
  chipLastVisit:  { fontSize: 9, marginTop: 1 },
  noCustomers:    { fontSize: FontSize.sm, paddingVertical: 8 },

  // ── Customer info card ────────────────────────────────────────────────────────
  infoCard:       { marginHorizontal: 12, marginTop: 10, borderRadius: 12, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  infoAccent:     { height: 3 },
  infoBody:       { padding: 12 },
  infoTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  infoAvatar:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoAvatarText: { fontSize: 16, fontWeight: '800' as const },
  infoName:       { fontSize: FontSize.base, fontWeight: FontWeight.bold, lineHeight: 20 },
  infoCompany:    { fontSize: FontSize.xs, marginTop: 2 },
  infoSubBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' as const, marginTop: 4 },
  infoSubText:    { fontSize: 11, fontWeight: '700' as const },
  infoStatusRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' as const },
  distanceChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 1 },
  distanceIcon:   { fontSize: 10 },
  distanceText:   { fontSize: 11, fontWeight: '700' as const },
  infoMeta:       { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 12, paddingTop: 10, borderTopWidth: 1 },
  infoMetaItem:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoMetaText:   { fontSize: FontSize.xs },
  // ── Stats row ─────────────────────────────────────────────────────────────────
  statsRow:  { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  statCard:  { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
  statNum:   { fontSize: FontSize.xl, fontWeight: FontWeight.bold, lineHeight: 26 },
  statLabel: { fontSize: 9, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.4, marginTop: 1 },

  // ── Visit toolbar ─────────────────────────────────────────────────────────────
  toolbar:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1 },
  toolbarSearch: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6 },
  viewToggle:    { flexDirection: 'row', borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  viewBtn:       { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  viewBtnText:   { fontSize: 13, fontWeight: '700' as const },

  // ── Filter chips ──────────────────────────────────────────────────────────────
  filterBar:       { borderBottomWidth: 1 },
  filterContent:   { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  filterChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  filterChipText:  { fontSize: 11, fontWeight: '600' as const },
  filterCount:     { borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  filterCountText: { fontSize: 10, fontWeight: '700' as const },

  // ── Table ─────────────────────────────────────────────────────────────────────
  tableHeader:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1 },
  tableHeaderText: { fontSize: 10, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  tableRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  tableColDate:    { width: 82 },
  tableColStatus:  { width: 88 },
  tableColBy:      { width: 76 },
  tableColNotes:   { flex: 1, paddingHorizontal: 6 },
  tableColActions: { width: 64, flexDirection: 'row', gap: 4, justifyContent: 'flex-end' },
  tableText:       { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  tableTextSm:     { fontSize: FontSize.xs },

  // ── Grid ──────────────────────────────────────────────────────────────────────
  gridPadding: { paddingHorizontal: 12, paddingTop: 8 },
  gridCard:    { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  gridAccent:  { height: 3 },
  gridBody:    { padding: 12 },
  gridTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  gridDate:    { fontSize: FontSize.xs },
  gridNotes:   { fontSize: FontSize.sm, lineHeight: 18, marginBottom: 8 },
  gridMeta:    { gap: 4, marginBottom: 8 },
  gridMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gridMetaText:{ fontSize: 11 },
  gridActions: { flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: 1 },
  gridBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 7, borderRadius: 8, borderWidth: 1 },

  // ── Compact ───────────────────────────────────────────────────────────────────
  compactRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  compactDot:     { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  compactDate:    { width: 72, fontSize: 11, flexShrink: 0 },
  compactBy:      { width: 70, fontSize: 11, flexShrink: 0 },
  compactNotes:   { flex: 1, fontSize: 11 },
  compactActions: { flexDirection: 'row', gap: 4 },

  // ── Shared ────────────────────────────────────────────────────────────────────
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText:   { fontSize: 10, fontWeight: '700' as const },
  actionBtn:   { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },

  // ── Empty / center ────────────────────────────────────────────────────────────
  center:       { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyIcon:    { fontSize: 36, marginBottom: 8 },
  emptyText:    { fontSize: FontSize.sm, textAlign: 'center' },
  emptyBtn:     { marginTop: 12, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // ── FAB ───────────────────────────────────────────────────────────────────────
  fab:     { position: 'absolute', end: 16, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 8 },
  fabText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // ── Log visit button ──────────────────────────────────────────────────────────
  logBtn:     { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  logBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // ── Header map toggle button ──────────────────────────────────────────────────
  mapToggleHeaderBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  mapToggleHeaderText: { fontSize: 13, fontWeight: '700' as const },

  // ── Fixed map zone (search + map, above FlatList) ─────────────────────────────
  fixedMapZone: { borderBottomWidth: 1 },
});

export default s;
