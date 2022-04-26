import ProgressionsDAO from '../dao/progressionsDAO.js';
import CollectionsDAO from '../dao/collectionsDAO.js';

export default class SearchController {
  static apiSearchProgressionsAndCollections(req, res, next) {
    const RESULTS_PER_PAGE = 20;
    let page;
    // TODO
    // Implement text search using Mongodb text index. Reference textSearchQuery in moviesDAO
    // in mflix as a example.
  }
}
