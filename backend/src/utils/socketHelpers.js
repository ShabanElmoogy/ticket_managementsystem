export const emitNotification = (io) => {
  return (userId, notification) => {
    io.to(`user_${userId}`).emit('notification', notification);
  };
};