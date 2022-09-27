import { Router } from "express";
import DevController from "../controllers/dev.controller.js";

const router = new Router()

router.get('/resetSignedInUserData', DevController.resetUserData)


export default router