export const emitNotification = (io) => {
  return (userId, notification) => {
    if (userId === 'broadcast') {
      console.log('Broadcasting notification to all users:', notification);
      io.emit('notification', notification);
    } else {
      console.log(`Emitting notification to user_${userId}:`, notification);
      console.log(`Sockets in room user_${userId}:`, io.sockets.adapter.rooms.get(`user_${userId}`)?.size || 0);
      io.to(`user_${userId}`).emit('notification', notification);
    }
  };
};