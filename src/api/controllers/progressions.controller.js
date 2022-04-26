import ProgressionsDAO from '../dao/progressionsDAO.js';

export default class ProgressionsController {
  static async apiGetPublicProgressionS(req, res, next) {
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
}
