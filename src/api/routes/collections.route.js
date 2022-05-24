import { Router } from 'express';
import CollectionsCtrl from '../controllers/collections.controller.js';

const router = new Router();

router.get('/', CollectionsCtrl.apiGetPublicCollections);
router.route('/:id')
  .delete(CollectionsCtrl.apiDeleteCollection)
  .post(CollectionsCtrl.apiPostCollectionEntry);

export default router;
