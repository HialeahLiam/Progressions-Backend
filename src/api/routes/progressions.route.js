import { Router } from 'express';
import ProgessionsCtrl from '../controllers/progressions.controller';

const router = new Router();

router.get('/', ProgessionsCtrl.apiGetPublicProgressionS);

export default router;
