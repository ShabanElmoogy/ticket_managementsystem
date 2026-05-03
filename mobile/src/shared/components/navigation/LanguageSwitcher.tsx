import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/src/i18n';
import SegmentedControl from '../forms/SegmentedControl';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN'    },
  { value: 'ar', label: 'عربي' },
];

/**
 * LanguageSwitcher — EN / عربي segmented control.
 * Thin wrapper around SegmentedControl that wires i18n logic.
 *
 * Reactive: re-renders when language changes via useTranslation().
 *
 * @hooks useTranslation (reads i18n.language for the active segment)
 * @modal-safe ❌ No — uses useTranslation hook; render in screens only, not inside <Modal>
 * @used-in Login screen, Profile screen
 */
const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [switching, setSwitching] = useState(false);

  const handleChange = async (lng: string) => {
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
      value={i18n.language}
      onChange={handleChange}
      loading={switching}
    />
  );
};

export default LanguageSwitcher;
