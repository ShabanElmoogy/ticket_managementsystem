import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_completed';

interface OnboardingState {
  isCompleted: boolean | null; // null = not yet checked
  isLoading: boolean;
  checkCompleted: () => Promise<void>;
  markCompleted: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  isCompleted: null,
  isLoading: true,
  checkCompleted: async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({ isCompleted: value === 'true', isLoading: false });
    } catch {
      // On failure, default to showing onboarding (Requirement 1.5)
      set({ isCompleted: false, isLoading: false });
    }
  },
  markCompleted: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ isCompleted: true });
  },
  resetOnboarding: async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    set({ isCompleted: false, isLoading: false });
  },
}));
