import { Router } from 'express';
import UsersCtrl from '../controllers/users.controller.js';

const router = new Router();

router.route('/').get(UsersCtrl.apiGetUsers);
router.route('/register').post(UsersCtrl.register);
router.route('/login').post(UsersCtrl.login);
router.route('/:id/collections')
.get(UsersCtrl.apiGetCollections)
.post(UsersCtrl.apiCreateTopLevelCollection);
router.get('/:id/collections/search', UsersCtrl.apiSearchUsersCollections)

export default router;
