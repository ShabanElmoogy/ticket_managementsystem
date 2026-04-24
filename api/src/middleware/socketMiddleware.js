/**
 * Injects req.emitNotification into every request.
 * Falls back to a no-op function if the emitter is unavailable
 * (e.g. during tests or if socket setup fails).
 *
 * @param {Function|null} emitNotificationFn
 */
const socketMiddleware = (emitNotificationFn) => (req, res, next) => {
  req.emitNotification = typeof emitNotificationFn === 'function'
    ? emitNotificationFn
    : () => {};
  next();
};

export default socketMiddleware;
