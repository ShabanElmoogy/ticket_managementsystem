/**
 * socketHelpers.js
 * Factory that creates the notification emitter function used throughout the app.
 *
 * @param {import('socket.io').Server} io
 * @returns {(userId: string, notification: object) => void}
 */
export const createNotificationEmitter = (io) => (userId, notification) => {
  if (userId === 'broadcast') {
    io.emit('notification', notification);
  } else {
    io.to(`user_${userId}`).emit('notification', notification);
  }
};
