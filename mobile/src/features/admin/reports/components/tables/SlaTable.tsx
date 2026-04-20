import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Badge, STH, TD, TableRow, TableHeader, W } from '../tableUtils';
import type { SortState } from '../useSorting';
import type { SlaMetricsRow } from '../../types';

interface Props {
  rows: SlaMetricsRow[];
  isDark: boolean;
  sort: SortState;
  onSort: (field: string) => void;
}

const W_HOURS = 90;
const W_ONTIME = 80;

const SlaTable: React.FC<Props> = ({ rows, isDark, sort, onSort }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      <TableHeader isDark={isDark}>
        <STH width={W.customer} isDark={isDark} field="customerName"       sort={sort} onSort={onSort}>Customer</STH>
        <STH width={W.num}      isDark={isDark} field="total"              sort={sort} onSort={onSort}>Total</STH>
        <STH width={W.num}      isDark={isDark} field="withDeadline"       sort={sort} onSort={onSort}>With SLA</STH>
        <STH width={W.num}      isDark={isDark} field="overdue"            sort={sort} onSort={onSort}>Overdue</STH>
        <STH width={W.num}      isDark={isDark} field="resolved"           sort={sort} onSort={onSort}>Resolved</STH>
        <STH width={W_ONTIME}   isDark={isDark} field="onTimeCount"        sort={sort} onSort={onSort}>On Time</STH>
        <STH width={W_HOURS}    isDark={isDark} field="avgResolutionHours" sort={sort} onSort={onSort}>Avg Hrs</STH>
      </TableHeader>

      {rows.map((r, i) => {
        const overdueColor = r.overdue > 0 ? '#ef4444' : '#10b981';
        const onTimePct    = r.resolved > 0 ? Math.round((r.onTimeCount / r.resolved) * 100) : null;

        return (
          <TableRow key={r.id} index={i} isDark={isDark}>
            <TD width={W.customer} isDark={isDark}>{r.customerName}</TD>
            <TD width={W.num}      isDark={isDark}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#e2e8f0' : '#1e293b' }}>
                {r.total}
              </Text>
            </TD>
            <TD width={W.num}    isDark={isDark}>
              <Badge label={r.withDeadline} color="#3b82f6" />
            </TD>
            <TD width={W.num}    isDark={isDark}>
              <Badge label={r.overdue} color={overdueColor} />
            </TD>
            <TD width={W.num}    isDark={isDark}>
              <Badge label={r.resolved} color="#10b981" />
            </TD>
            <TD width={W_ONTIME} isDark={isDark}>
              {onTimePct !== null ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: onTimePct >= 80 ? '#10b981' : onTimePct >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {r.onTimeCount}
                  </Text>
                  <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8' }}>
                    {onTimePct}%
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: isDark ? '#475569' : '#94a3b8' }}>—</Text>
              )}
            </TD>
            <TD width={W_HOURS}  isDark={isDark}>
              {r.avgResolutionHours !== null ? (
                <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#e2e8f0' : '#1e293b' }}>
                  {r.avgResolutionHours}h
                </Text>
              ) : (
                <Text style={{ fontSize: 12, color: isDark ? '#475569' : '#94a3b8' }}>—</Text>
              )}
            </TD>
          </TableRow>
        );
      })}
    </View>
  </ScrollView>
);

export default SlaTable;
