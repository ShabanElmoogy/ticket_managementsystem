import React from 'react';
import { REPORT_TYPES, type ReportType } from '../types';
import { FilterChipGroup, type FilterChipOption } from '../../../../shared/components';

interface Props {
  value: ReportType;
  onChange: (t: ReportType) => void;
  isDark: boolean;
}

const TYPE_OPTIONS: FilterChipOption<ReportType>[] = REPORT_TYPES.map((rt) => ({
  value: rt.id,
  label: rt.label,
}));

const ReportTypeSelector: React.FC<Props> = ({ value, onChange, isDark }) => (
  <FilterChipGroup<ReportType>
    options={TYPE_OPTIONS}
    value={value}
    onChange={onChange}
    isDark={isDark}
    activeColor="#3b82f6"
  />
);

export default ReportTypeSelector;
