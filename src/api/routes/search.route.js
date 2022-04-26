import { Router } from 'express';
import SearchCtrl from '../controllers/search.controller.js';

/**
 * The /search endpoint is meant to emulate Spotify's /search. One of the reasons
 * Spotify probably chose to make this an endpoint is be able to search Albums and
 * Tracks simultaneously. Since progressions belong to collection, like Tracks belong
 * to Albums, it is more logical to designate the search functionality to its own route instead of
 * deciding to place it in /progressions or/ collections.
 */

const router = new Router();

router.get('/', SearchCtrl.apiSearchProgressionsAndCollections);

export default router;
