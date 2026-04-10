export const emitNotification = (io) => {
  return (userId, notification) => {
    if (userId === 'broadcast') {
      io.emit('notification', notification);
    } else {
      io.to(`user_${userId}`).emit('notification', notification);
    }
  };
};