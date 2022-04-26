// export default class CollectionsController {
//   // Might not make sense to make these endpoints since anyone could manipulate
//   // collections in  database. Probably best to place these actions in /users and
//   // use authentication.
//   // ----------------------------------------------------------------
//   static apiDeleteCollection = async (req, res) => {
//     const query = { containsProgressions: { $exists: false } };
//     const result = await collections.deleteMany(query);
//     console.log('Deleted the following collection documents:');
//     console.log(result);
//   };

//   static apiPostCollectionEntry = async (req, res, next) => {
//     try {
//       const { entry } = req.body;
//       const { id } = req.params;

//       const collection = await collections.findOne(ObjectId(id));
//       if (!collection) {
//         return res.status(400).json({ error: 'Collection with provided id does not exist.' });
//       }

//       if (collection) {
//         if (entry.type === 'collection') {
//           if (!entry.collection || !entry.collection.title) {
//             return res.status(400).end();
//           }

//           // Check if collection already has collection with provided title
//           const results = await collections.find({ parent_collection_id: collection._id }).toArray();
//           if (results.find((element) => element.title === entry.collection.title)) {
//             return res.json({
//               error: `Collection ${id} already contains a collection titled ${entry.collection.title}.`,
//             });
//           }

//           const newCollection = {
//             title: entry.collection.title,
//             parent_collection_id: ObjectId(id),
//             owner_id: collection.owner_id,
//           };
//           const result = await collections.insertOne(newCollection);
//           console.log(`A document was inserted into collections with the _id: ${result.insertedId}`);
//           return res.json(newCollection);
//         }
//       }
//       return res.status(400).end();
//     } catch (error) {
//       next(error);
//     }
//   };
//   // ----------------------------------------------------------------
// }
