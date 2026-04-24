/**
 * epicActivity.controller.js
 * HTTP handlers for epic activity.
 */

import { handleError } from '../../../errors/index.js';
import * as epicActivityService from './epicActivity.service.js';

// Re-export logEpicActivity so existing callers (epics.service.js) can import it
export { logEpicActivity } from './epicActivity.service.js';

export const listEpicActivity = async (req, res) => {
  try {
    const limit = req.query.limit ?? 50;
    res.json(await epicActivityService.listEpicActivity(req.params.id, limit));
  } catch (e) { handleError(res, e, 'List epic activity'); }
};
