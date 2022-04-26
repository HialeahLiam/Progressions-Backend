import { Router } from 'express'
import UsersCtrl from '../controllers/users.controller.js'

const router = new Router()

router.route('/')
    .get(UsersCtrl.apiGetUsers)
    .post(UsersCtrl.register)
router.route('/:id/collections')
    .get(UsersCtrl.getCollections)
    .post(UsersCtrl.createCollection)

export default router;