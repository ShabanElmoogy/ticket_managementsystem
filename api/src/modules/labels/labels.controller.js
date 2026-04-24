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
    res.json(await labelsService.listLabels());
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
