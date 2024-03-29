import { Router } from 'express';
import CollectionsCtrl from '../controllers/collections.controller.js';

const router = new Router();

router.get('/', CollectionsCtrl.apiGetPublicCollections);
router.get('/search', CollectionsCtrl.apiSearchCollections)
router.post('/public', CollectionsCtrl.apiPublishCollection)
router.route('/:id')
  .delete(CollectionsCtrl.apiDeleteCollection)
  .post(CollectionsCtrl.apiPostCollectionEntry);

export default router;
