import { Router } from 'express';
import CollectionsCtrl from '../controllers/collections.controller.js';

const router = new Router();

router.get('/', CollectionsCtrl.apiGetPublicCollections);
router.post('/:id', CollectionsCtrl.apiPostCollectionEntry);
router.route('/collections/:id')
  .delete(CollectionsCtrl.apiDeleteCollection)
  .post(CollectionsCtrl.apiPostCollectionEntry);

export default router;
