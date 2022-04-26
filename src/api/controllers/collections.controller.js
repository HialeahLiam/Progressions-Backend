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
    } catch (error) {
      next(error);
    }
  };
  // ----------------------------------------------------------------
}