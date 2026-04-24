/**
 * epicContributors.controller.js
 * HTTP handlers for epic contributors.
 */

import { handleError } from '../../../errors/index.js';
import * as epicContributorsService from './epicContributors.service.js';

export const listContributors = async (req, res) => {
  try {
    res.json(await epicContributorsService.listContributors(req.params.id));
  } catch (e) { handleError(res, e, 'List contributors'); }
};

export const addContributor = async (req, res) => {
  try {
    const contributor = await epicContributorsService.addContributor(
      req.params.id,
      req.body.userId,
      req.body.role,
    );
    res.status(201).json(contributor);
  } catch (e) { handleError(res, e, 'Add contributor'); }
};

export const updateContributor = async (req, res) => {
  try {
    res.json(await epicContributorsService.updateContributor(req.params.contributorId, req.body.role));
  } catch (e) { handleError(res, e, 'Update contributor'); }
};

export const removeContributor = async (req, res) => {
  try {
    res.json(await epicContributorsService.removeContributor(req.params.contributorId));
  } catch (e) { handleError(res, e, 'Remove contributor'); }
};
