import { Router } from 'express';
import CollectionsCtrl from '../controllers/collections.controller.js';

const router = new Router();

// router.delete('/', CollectionsCtrl.apiDeleteCollection)
router.post('/:id', CollectionsCtrl.apiPostCollectionEntry);

export default router;
