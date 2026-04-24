/**
 * epicWatchers.controller.js
 * HTTP handlers for epic watchers.
 */

import { handleError } from '../../../errors/index.js';
import * as epicWatchersService from './epicWatchers.service.js';

// Re-export notifyEpicWatchers so epicComments.service.js can import it
export { notifyEpicWatchers } from './epicWatchers.service.js';

export const getEpicWatchers = async (req, res) => {
  try {
    res.json(await epicWatchersService.getWatchers(req.params.id));
  } catch (e) { handleError(res, e, 'Get epic watchers'); }
};

export const watchEpic = async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    res.json(await epicWatchersService.watchEpic(req.params.id, userId));
  } catch (e) { handleError(res, e, 'Watch epic'); }
};

export const unwatchEpic = async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    res.json(await epicWatchersService.unwatchEpic(req.params.id, userId));
  } catch (e) { handleError(res, e, 'Unwatch epic'); }
};
