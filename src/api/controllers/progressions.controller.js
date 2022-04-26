import ProgressionsDAO from '../dao/progressionsDAO.js';
import { info, error } from '../../utils/logger';

export default class ProgressionsController {
  static async apiGetPublicProgressions(req, res, next) {
    const PROGRESSION_PER_PAGE = 20;
    const { progressionsList, totalNumProgs } = await ProgressionsDAO.getProgressions();
    const body = {
      progressions: progressionsList,
      page: 0,
      filters: {},
      entries_per_page: PROGRESSION_PER_PAGE,
      total_results: totalNumProgs,
    };
    res.json(body);
  }

  static async apiCreateProgression(req, res, next) {
    const collectionId = req.query.collection;
    info(collectionId);
    res.status(200).end();
  }
}
