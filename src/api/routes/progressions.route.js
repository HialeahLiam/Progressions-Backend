import { Router } from 'express';
import ProgressionsCtrl from '../controllers/progressions.controller.js';

const router = new Router();

router.get('/', ProgressionsCtrl.apiGetPublicProgressions);

router.route('/:id')
  .delete(ProgressionsCtrl.apiDeleteProgression)
  .put(ProgressionsCtrl.apiUpdateProgression);

export default router;
