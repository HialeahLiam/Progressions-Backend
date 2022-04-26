import { Router } from 'express';
import ProgressionsCtrl from '../controllers/progressions.controller';

const router = new Router();

router.get('/', ProgressionsCtrl.apiGetPublicProgressions);

router.post('/', ProgressionsCtrl.apiCreateProgression);

export default router;
