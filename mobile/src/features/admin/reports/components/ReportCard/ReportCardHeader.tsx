import React from 'react';
import SectionHeader from '../../../../../shared/components/SectionHeader';
import CountBadge    from '../../../../../shared/components/CountBadge';

interface Props {
  label: string;
  totalItems: number;
  totalUnfiltered: number;
  isFiltered: boolean;
  isDark: boolean;
}

const ReportCardHeader: React.FC<Props> = ({
  label, totalItems, totalUnfiltered, isFiltered, isDark,
}) => (
  <SectionHeader
    title={label}
    isDark={isDark}
    right={
      <CountBadge
        count={totalItems}
        total={totalUnfiltered}
        isFiltered={isFiltered}
      />
    }
  />
);

export default ReportCardHeader;
