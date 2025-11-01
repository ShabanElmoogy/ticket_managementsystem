import { checkDueDateNotifications } from './notificationUtils.js';

export const startNotificationScheduler = () => {
  // Check for due date notifications every hour
  const checkInterval = 60 * 60 * 1000; // 1 hour in milliseconds
  
  const runCheck = async () => {
    try {
      console.log('Checking for due date notifications...');
      const result = await checkDueDateNotifications();
      console.log(`Created ${result.dueSoonCount} due soon notifications and ${result.overdueCount} overdue notifications`);
    } catch (error) {
      console.error('Error in notification scheduler:', error);
    }
  };

  // Run immediately on startup
  runCheck();
  
  // Then run every hour
  setInterval(runCheck, checkInterval);
  
  console.log('Notification scheduler started - checking every hour');
};