import { Router } from 'express';
import CollectionsCtrl from '../controllers/collections.controller.js';

const router = new Router();

router.get('/', CollectionsCtrl.apiGetPublicCollections);
router.post('/:id', CollectionsCtrl.apiPostCollectionEntry);

export default router;
