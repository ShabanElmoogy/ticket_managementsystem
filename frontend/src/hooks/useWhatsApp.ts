import { useState, useEffect, useCallback } from 'react';

interface WhatsAppStatus {
  isReady: boolean;
  hasQRCode: boolean;
  qrCode?: string;
}

interface WhatsAppHook {
  status: WhatsAppStatus;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  sendMessage: (to: string, message: string) => Promise<any>;
  sendTicketNotification: (ticketData: any, recipients: any[], type?: string) => Promise<any>;
  checkStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useWhatsApp = (): WhatsAppHook => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    isReady: false,
    hasQRCode: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/status`);
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to check WhatsApp status');
    }
  }, []);

  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
        
        // Start polling for status updates
        const pollInterval = setInterval(async () => {
          await checkStatus();
          
          // Stop polling when ready
          if (status.isReady) {
            clearInterval(pollInterval);
          }
        }, 2000);
        
        // Stop polling after 2 minutes
        setTimeout(() => clearInterval(pollInterval), 120000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to initialize WhatsApp');
    } finally {
      setLoading(false);
    }
  }, [checkStatus, status.isReady]);

  const sendMessage = useCallback(async (to: string, message: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.result;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTicketNotification = useCallback(async (
    ticketData: any,
    recipients: any[],
    notificationType: string = 'created'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/send-ticket-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketData,
          recipients,
          notificationType,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/whatsapp/logout`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus({ isReady: false, hasQRCode: false });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to logout');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    status,
    loading,
    error,
    initialize,
    sendMessage,
    sendTicketNotification,
    checkStatus,
    logout,
  };
};