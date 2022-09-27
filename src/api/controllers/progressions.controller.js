import { verifyToken } from '../../firebase.js';
import { info } from '../../utils/logger.js';
import getTokenFrom from '../../utils/requests.js';
import ProgressionsDAO from '../dao/progressionsDAO.js';

export default class ProgressionsController {
	static async apiGetPublicProgressions(req, res, next) {
		const PROGRESSION_PER_PAGE = 20;
		const { progressionsList, totalNumProgs } = await ProgressionsDAO.getProgressions();
		const body = {
			progressions: progressionsList,
			page: 0,
			filters: {},
			entries_per_page: PROGRESSION_PER_PAGE,
			total_results: totalNumProgs,
		};
		res.json(body);
	}

	static async apiUpdateProgression(req, res, next) {
		const pId = req.params.id
		const {_id, ...updatedProg} = req.body.entry

		try {
			const result = await ProgressionsDAO.updateProgression(pId, updatedProg)
			res.json(result)
		} catch (error) {
			next(error)
		}
	}

	static async apiDeleteProgression(req, res, next) {
		try {
			const {id} = req.params
			const {user_id} = await verifyToken(getTokenFrom(req))
			const {owner_id} = await ProgressionsDAO.getSingleProgression(id)
			// check that progression is not public
			if (!owner_id) {
				res.status(403).end()
				return
			}
			// check that progression belongs to user
			if(owner_id !== user_id) {
				res.status(401).end()
				return
			}
			await ProgressionsDAO.deleteProgression(id)
			res.status(204).end()
			
		} catch (error) {
			next(error)
		}
	}
}
