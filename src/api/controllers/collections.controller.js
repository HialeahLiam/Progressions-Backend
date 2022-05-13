import { error } from '../../utils/logger';
import CollectionsDAO from '../dao/collectionsDAO';

export default class CollectionsController {
  /**
   * Might not make sense to make these endpoints since anyone could manipulate
   * collections in  database. Probably best to place these actions in /users and
   * use authentication.
   *
   * UPDATE: you could use Jwt tokens to get valid user id. Users need valid token
   * to use these endpoints and their id must batch the _id stored in the collections
   * they're manipulating.
   */
  // ----------------------------------------------------------------
  static apiDeleteCollection = async (req, res) => {
    // const query = { containsProgressions: { $exists: false } };
    // const result = await collections.deleteMany(query);
    // console.log('Deleted the following collection documents:');
    // console.log(result);
  };

  // TODO: return all descendent collections and progressions as well
  // not just top level collections.
  // Read https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
  // on how to cal getEntries() inside a loop.
  static apiGetPublicCollections = async (req, res, next) => {
    let collections;
    try {
      collections = await CollectionsDAO.getTopLevelPublicCollections();
      res.json({ collections });
    } catch (e) {
      next(e);
    }
  };

  // TODO check user token
  static apiPostCollectionEntry = async (req, res, next) => {
    try {
      const { entry } = req.body;
      const { id } = req.params;

      let collectionResponse;

      if (!entry.type) {
        res.status(400).json({
          error: `body must have type of either 
          "collection" or "progression"`,
        });
      }
      if (entry.type === 'collection') {
        collectionResponse = await CollectionsDAO.addCollectionToCollection(id, entry);
      } else if (entry.type === 'progression') {
        collectionResponse = await CollectionsDAO.addProgressionToCollection(id, entry);
      }
    } catch (e) {
      next(e);
    }
  };
  // ----------------------------------------------------------------
}
