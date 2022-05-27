import getTokenFrom from '../../utils/requests';
import CollectionsDAO from '../dao/collectionsDAO';
import UsersController, { User } from './users.controller';

export default class CollectionsController {
  static apiDeleteCollection = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userJwt = getTokenFrom(req);
      const user = await User.decoded(userJwt);

      const { error } = user;

      if (error) {
        res.status(401).json({ error: error.message });
        return;
      }

      await CollectionsDAO.deleteCollection(id);

      const updatedUserCollections = await CollectionsDAO.getUserCollections(id);

      res.status(200).json({ collections: updatedUserCollections });
    } catch (e) {
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
      next(e);
    }
  };

  static apiPostCollectionEntry = async (req, res, next) => {
    try {
      const { entry, type } = req.body;
      const { id: parentId } = req.params;

      const userToken = getTokenFrom(req);
      const user = await User.decoded(userToken);

      let { error } = user;

      if (error) {
        res.status(401).json({ error: error.message });
        return;
      }

      if (!entry) {
        res.status(400).json({ error: 'Request must contain a "entry" key' });
        return;
      }


      if (type !== 'collection' && type !== 'progression') {
        res.status(400).json({
          error: `body must have "type" of either
          "collection" or "progression"`,
        });
        return;
      }


      const ownerId = await CollectionsDAO.getOwnerId(parentId);
      if (!ownerId) {
        res.status(404).json({ error: 'You cannot edit a public collection' });
        return;
      }
      if (ownerId !== user._id) {
        res.status(404).json({ error: 'You are trying to edit a collection that does not belong to you.' });
        return;
      }

      if(!entry.title) {
        res.status(400).json({error: 'Your entry needs a title.'})
        return
      }


      let collectionResponse;

      if (type === 'collection') {
        collectionResponse = await CollectionsDAO.addCollectionToCollection(parentId, entry);
      } else if (type === 'progression') {
        collectionResponse = await CollectionsDAO.addProgressionToCollection(parentId, entry);
      }


      if (collectionResponse.error) {
        res.status(400).json({error: collectionResponse.error})
        return
      }


      res.status(201).json({collection: collectionResponse});
    } catch (e) {
      next(e);
    }
  };
}
