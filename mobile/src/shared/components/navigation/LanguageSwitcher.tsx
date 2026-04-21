import React, { useState } from 'react';
import { changeLanguage, getCurrentLanguage } from '../../../i18n';
import SegmentedControl from '../forms/SegmentedControl';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN'    },
  { value: 'ar', label: 'عربي' },
];

interface Props {
  isDark?: boolean;
}

/**
 * LanguageSwitcher — EN / عربي segmented control.
 * Thin wrapper around SegmentedControl that wires i18n logic.
 */
const LanguageSwitcher: React.FC<Props> = ({ isDark = false }) => {
  const [switching, setSwitching] = useState(false);
  const current = getCurrentLanguage();

  const handleChange = async (lng: string) => {
    if (switching) return;
    setSwitching(true);
    try {
      await changeLanguage(lng as 'en' | 'ar');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <SegmentedControl
      options={LANGUAGE_OPTIONS}
      value={current}
      onChange={handleChange}
      loading={switching}
      isDark={isDark}
    />
  );
};

export default LanguageSwitcher;
