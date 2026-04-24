/**
 * watchers/watchers.controller.js
 * HTTP handlers for ticket watchers.
 */

import { handleError } from '../../../errors/index.js';
import * as watchersService from './watchers.service.js';

// Re-export notifyWatchers so tickets.service.js can import it from here
export { notifyWatchers } from './watchers.service.js';

const actorId  = (req) => req.user?.userId ?? req.user?.id;
const tenantId = (req) => req.tenantScope?.type === 'TENANT' ? req.tenantScope.tenantId : null;

export const getWatchers = async (req, res) => {
  try {
    res.json(await watchersService.getWatchers(req.params.id));
  } catch (e) { handleError(res, e, 'Get watchers'); }
};

export const watchTicket = async (req, res) => {
  try {
    res.json(await watchersService.watchTicket(req.params.id, tenantId(req), actorId(req), req.user?.role));
  } catch (e) { handleError(res, e, 'Watch ticket'); }
};

export const unwatchTicket = async (req, res) => {
  try {
    res.json(await watchersService.unwatchTicket(req.params.id, actorId(req)));
  } catch (e) { handleError(res, e, 'Unwatch ticket'); }
};
