// Middleware to inject socket notification function into requests
const socketMiddleware = (emitNotificationFn) => {
  return (req, res, next) => {
    req.emitNotification = emitNotificationFn;
    next();
  };
};

export default socketMiddleware;