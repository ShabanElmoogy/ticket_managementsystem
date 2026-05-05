import React from 'react';
import { ACTIVITY_PERIODS, type ActivityPeriod } from '@/src/features/admin/reports/types';
import { FilterChipGroup, type FilterChipOption } from '@/src/shared/components';
import { Palette } from '@/src/constants/tokens';

interface Props {
  value: ActivityPeriod;
  onChange: (p: ActivityPeriod) => void;
}

const PERIOD_OPTIONS: FilterChipOption<ActivityPeriod>[] = ACTIVITY_PERIODS.map((p) => ({
  value: p,
  label: `${p.labelA} / ${p.labelB}`,
}));

const ActivityPeriodSelector: React.FC<Props> = ({ value, onChange }) => (
  <FilterChipGroup<ActivityPeriod>
    options={PERIOD_OPTIONS}
    value={value}
    onChange={onChange}
    title="Activity Period"
    activeColor={Palette.violet500}
    keyExtractor={(p) => `${p.daysA}-${p.daysB}`}
  />
);

export default ActivityPeriodSelector;
