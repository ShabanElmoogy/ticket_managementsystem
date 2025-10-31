import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { profileApi, type ReminderSettings } from '../../../services/api';

export const useProfileSettings = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    reminderEnabled: true,
    reminderInterval: 60,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await profileApi.getReminderSettings();
        setReminderSettings(settings);
      } catch (error) {
        console.error('Error loading reminder settings:', error);
        // Use default values if the endpoint fails
        setReminderSettings({
          reminderEnabled: true,
          reminderInterval: 60,
        });
      }
    };

    loadSettings();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReminderChange = (field: keyof ReminderSettings, value: boolean | number) => {
    setReminderSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) {
      console.error('No user available');
      return;
    }

    setLoading(true);
    try {
      // Update profile data
      await profileApi.updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });

      // Update reminder settings
      await profileApi.updateReminderSettings(reminderSettings);

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    formData,
    reminderSettings,
    loading,
    message,
    handleInputChange,
    handleReminderChange,
    handleSave,
  };
};