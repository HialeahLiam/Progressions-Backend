import { verifyToken } from "../../firebase.js"
import getTokenFrom from "../../utils/requests.js"

export default class DevController {

    static resetUserData = async(req, res) => {
        try {
        const user = await verifyToken(getTokenFrom(req))
        console.log(user)
        res.json({message: `You tried to reset data for ${user.email}, but this endpoint hasn't been implemented yet!`})
            
        } catch (error) {
            console.log(error)
        }
    }
}