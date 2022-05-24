import getTokenFrom from '../../utils/requests';
import CollectionsDAO from '../dao/collectionsDAO';
import UsersController, { User } from './users.controller';

export default class CollectionsController {
  static apiDeleteCollection = async (req, res, next) => {
    try {
      console.log('CALLED');
      const { id } = req.params;
      const userJwt = getTokenFrom(req);
      const user = await User.decoded(userJwt);

      const { error } = user;

      if (error) {
        res.status(401).json({ error: error.message });
        return;
      }

      await CollectionsDAO.deleteCollection(id);

      console.log('DELETED');
      console.log(user._id);
      const updatedUserCollections = await UsersController.apiGetCollections(user._id);
      console.log('COLLECTIONS RETRIEVED');

      res.status(200).json({ collections: updatedUserCollections });
    } catch (e) {
      console.log(e);
      next(e);
    }
  };

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
      console.log(e);
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
