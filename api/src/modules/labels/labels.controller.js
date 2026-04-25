/**
 * labels.controller.js
 * HTTP handlers — extract request data, call service, send response.
 * No business logic or direct DB access here.
 */

import { handleError } from '../../errors/index.js';
import * as labelsService from './labels.service.js';

// ── Handlers ──────────────────────────────────────────────────────────────────

export const getAllLabels = async (req, res) => {
  try {
    // Validate query parameters early
    if (req.query.page && isNaN(parseInt(req.query.page))) {
      return res.status(400).json({ error: 'Page must be a number' });
    }
    if (req.query.limit && isNaN(parseInt(req.query.limit))) {
      return res.status(400).json({ error: 'Limit must be a number' });
    }
    if (req.query.search && typeof req.query.search === 'string' && req.query.search.length > 100) {
      return res.status(400).json({ error: 'Search term too long (max 100 characters)' });
    }

    // Call service with all query parameters
    const result = await labelsService.listLabels(req.query);
    
    // Set appropriate cache headers based on response type
    if (Array.isArray(result)) {
      // Legacy array response - shorter cache for dynamic data
      res.set('Cache-Control', 'private, max-age=60');
    } else {
      // Paginated response - can cache longer due to pagination metadata
      res.set('Cache-Control', 'private, max-age=300');
    }

    res.json(result);
  } catch (e) { handleError(res, e, 'Get all labels'); }
};

export const createLabel = async (req, res) => {
  try {
    const label = await labelsService.createLabel(req.body);
    res.status(201).json(label);
  } catch (e) { handleError(res, e, 'Create label'); }
};

export const updateLabel = async (req, res) => {
  try {
    res.json(await labelsService.updateLabel(req.params.id, req.body));
  } catch (e) { handleError(res, e, 'Update label'); }
};

export const deleteLabel = async (req, res) => {
  try {
    res.json(await labelsService.deleteLabel(req.params.id));
  } catch (e) { handleError(res, e, 'Delete label'); }
};

export const addLabelToTicket = async (req, res) => {
  try {
    const result = await labelsService.addLabelToTicket(req.body.ticketId, req.body.labelId);
    res.status(201).json(result);
  } catch (e) { handleError(res, e, 'Add label to ticket'); }
};

export const removeLabelFromTicket = async (req, res) => {
  try {
    res.json(await labelsService.removeLabelFromTicket(req.params.ticketId, req.params.labelId));
  } catch (e) { handleError(res, e, 'Remove label from ticket'); }
};
