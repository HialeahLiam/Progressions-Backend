import { error } from '../../utils/logger';
import CollectionsDAO from '../dao/collectionsDAO';

export default class CollectionsController {
  static apiDeleteCollection = async (req, res) => {
    res.status(400).end();
  };

  // TODO: return all descendent collections and progressions as well
  // not just top level collections.
  // Read https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
  // on how to cal getEntries() inside a loop.
  static apiGetPublicCollections = async (req, res, next) => {
    let collections;
    try {
      collections = await CollectionsDAO.getTopLevelPublicCollections();
      const queue = [...collections];
      while (queue.length > 0) {
        const parent = queue.shift();

        // eslint-disable-next-line no-await-in-loop
        const children = await CollectionsDAO.getEntries(parent._id.toString());

        parent.entries = children;
        if (parent.entry_type === 'collection') {
          queue.push(...children);
        }
      }
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

      res.json(collectionResponse);
    } catch (e) {
      next(e);
    }
  };
}
