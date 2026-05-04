/**
 * useVisitForm.ts
 *
 * Form state for creating / editing a customer visit.
 * Captures GPS at open time (if permission already granted — never prompts).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import type { VisitStatus, CustomerVisit, CreateVisitData } from '@/src/services/api/types/index';

export interface VisitFormFields {
  status:    VisitStatus;
  visitedAt: string;   // ISO datetime string
  notes:     string;
}

interface UseVisitFormOptions {
  item?:    CustomerVisit | null;
  onSave:   (data: CreateVisitData) => Promise<boolean>;
  onClose:  () => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function useVisitForm({ item, onSave, onClose }: UseVisitFormOptions) {
  const getInitial = useCallback((): VisitFormFields => ({
    status:    item?.status    ?? 'COMPLETED',
    visitedAt: item?.visitedAt ?? nowIso(),
    notes:     item?.notes     ?? '',
  }), [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [fields,       setFields]       = useState<VisitFormFields>(getInitial);
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsCoords,    setGpsCoords]    = useState<{ latitude: number; longitude: number } | null>(
    item?.latitude != null && item?.longitude != null
      ? { latitude: item.latitude, longitude: item.longitude }
      : null
  );
  const gpsFetched = useRef(false);

  // Reset when item changes
  useEffect(() => {
    setFields(getInitial());
    setErrors({});
    setIsSubmitting(false);
    if (item?.latitude != null && item?.longitude != null) {
      setGpsCoords({ latitude: item.latitude, longitude: item.longitude });
      gpsFetched.current = true;
    } else {
      setGpsCoords(null);
      gpsFetched.current = false;
    }
  }, [getInitial]);

  // Silently capture GPS on open (new visit only, never prompts)
  useEffect(() => {
    if (item || gpsFetched.current) return;
    gpsFetched.current = true;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced } as any);
        setGpsCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {
        // GPS is optional — silently skip
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback(<K extends keyof VisitFormFields>(field: K, value: VisitFormFields[K]) => {
    setFields(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!fields.status)    errs.status    = 'Status is required';
    if (!fields.visitedAt) errs.visitedAt = 'Visit date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [fields]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const data: CreateVisitData = {
        status:    fields.status,
        visitedAt: fields.visitedAt,
        notes:     fields.notes.trim() || undefined,
        latitude:  gpsCoords?.latitude  ?? null,
        longitude: gpsCoords?.longitude ?? null,
      };
      const ok = await onSave(data);
      if (ok) onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, gpsCoords, validate, onSave, onClose]);

  return {
    fields,
    errors,
    isSubmitting,
    gpsCoords,
    handleChange,
    handleSubmit,
  };
}
