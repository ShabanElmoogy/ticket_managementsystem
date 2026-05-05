import React from 'react';
import { SectionHeader, CountBadge } from '@/src/shared/components';

interface Props {
  label: string;
  totalItems: number;
  totalUnfiltered: number;
  isFiltered: boolean;
}

const ReportCardHeader: React.FC<Props> = ({
  label, totalItems, totalUnfiltered, isFiltered,
}) => (
  <SectionHeader
    title={label}
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
