import React from 'react';
import { ACTIVITY_PERIODS, type ActivityPeriod } from '@/src/features/admin/reports/types';
import { FilterChipGroup, type FilterChipOption } from '@/src/shared/components';

interface Props {
  value: ActivityPeriod;
  onChange: (p: ActivityPeriod) => void;
  isDark: boolean;
}

const PERIOD_OPTIONS: FilterChipOption<ActivityPeriod>[] = ACTIVITY_PERIODS.map((p) => ({
  value: p,
  label: `${p.labelA} / ${p.labelB}`,
}));

const ActivityPeriodSelector: React.FC<Props> = ({ value, onChange, isDark }) => (
  <FilterChipGroup<ActivityPeriod>
    options={PERIOD_OPTIONS}
    value={value}
    onChange={onChange}
    isDark={isDark}
    title="Activity Period"
    activeColor="#8b5cf6"
    keyExtractor={(p) => `${p.daysA}-${p.daysB}`}
  />
);

export default ActivityPeriodSelector;
