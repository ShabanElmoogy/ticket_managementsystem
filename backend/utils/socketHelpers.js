// Helper function to emit real-time notifications
export const emitNotification = (io) => {
  return (type, data, targetUsers = null) => {
    const notification = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date().toISOString()
    };

    if (targetUsers) {
      targetUsers.forEach(userId => {
        io.to(`user_${userId}`).emit('notification', notification);
      });
    } else {
      io.emit('notification', notification);
    }
  };
};