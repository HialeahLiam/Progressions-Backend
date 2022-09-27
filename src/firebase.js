import { initializeApp, cert } from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';

initializeApp({
	credential: cert(
		{
			projectId: 'progressions-c6217',
			clientEmail: 'firebase-adminsdk-tsy7l@progressions-c6217.iam.gserviceaccount.com',
			privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCh21xAFt+Vt8Y2\nEacQI5xwfIzefIO/DPgzmGzdBj55L5TpKUFMzxaxz5iyHR7rjWQfoeQABuEDRMxe\nGX5/bzpKjWn41vlUgp3WR7g1Q1PGvYiwqXGky7IC/wO27+tP1jm/sFOoF0tKoz9K\nWgE5F1khTcwhJAAFPLE1cvFbMFIkrX3v86SS8qG6zlUIrY9uMy0HBhzE7QpLnE7l\nGTXXKjAGwGi51/F9Wb4ye2AtonCfyUrTN+wgTRrz4FEYBul8mBejI+zTpDu0ABjn\nFina/CPhurDRnqaG2VfzYZ9fdcfylksEhTI6U31uH5nbgcB5fH45pov0a03ZZ06e\nWjkJlp8VAgMBAAECggEAGlDfoV32sVGFbSIWnxWjKFjf0Ia/Ju91ZXIpdRBAVRTK\n6dP21YWwI23k3kTE07iT6F66gtSbfhwP/Fa5zf9oI1n1ums9c6OfBQl5JlPRibUk\nRdDu9MPXqAwNbw94G21xyzxghapv5+0965lRrJYivDr5bwP66t8Q0udi3ZgwKt02\nNOBLZOIU0cRugtPszA2++A8oiSt0EID15ETIfh/oNj2RBIB6DFs0nz8qB+x9zY9b\ni2BDwjmRzcinE7zmNBiei69Ji+e7FEMWO5effchLTnkh4BdHu+jMHrmTvQsned1F\nDPou2B2HLsOaO0VPxnVIweGqxjgGoA3uvEzSEEPuWwKBgQDLmfkYDOg8+v7xgKEw\nItE940hiizEZupbuILWps7GXozqNUlRyDYJWriZYHS1nhqjiVT5slA77YmtFIUPi\nwBEClLai3DxJkKVAS9EaZ5mJHJDU+3ZssmgA2FZHcDLpx7MYxkRV6EWf9J+xvPdu\nE0FQ/2WvW639QDSWLGmJCUyTcwKBgQDLgxkQ/neeeSuN+kcG0oXjIbhOt5QBGMla\nigP7KTcqrKMBX9yeLlrSjNSGvBq1IQbqO/tqwRolHAkLhaboAiUReCQ/NeabWPBg\n+A7xEry1cZTbv0HmpnU1JUMkjc5F97550fdlYHjp/ygecXZLudNDQS+6YCQcNaws\nNGX+W2qxVwKBgQCf20S4nWm6d1e0RkpIgQ3IiatLs/3ZNadLUGNR2sSVSpOuYfXr\nlq+/Xvy8Mix0HEZ9bnCUz6rztVKD9JpYbnTskdbUCBdNq0QUN3L2SGFERilxD/7r\nWShPgYw8ittuslzsFr+Qs832yRqZcsTSqEugTOaJyHHTZZXkUvqJncOCAQKBgQCD\nPhA0PWa29D16WiTj6XAegehyG0F/U5TGpqralkHVa2/TuxZzjEFV9yw3l6dBmAL1\nm6kPt2g89k9+9rokdP2ivm/hs8j79edPIanBHexEtvLgo/7D2CVOGLGsKScVSCe2\nOAnrfsN7Y+ljeJhpTXVIsgktkEK5ToOyHjiISDwOEQKBgBHO/yWibsccPGIlIusc\nnMuiCJNkKNTPw1a1kumfRD6PEqFCK5Fazr3hlPAR3dPhKpiPs48FTWqYJRSbcjtw\nnFQW0gTCVdW/CeSLNUnX4oJPkbJUrel9DezHf6k3NE3MRsCb7w7iBc89kvURrQmG\n+AqOhdKUgygc0kF/ssYj/wRc\n-----END PRIVATE KEY-----\n'
		}
	)
});

export const verifyToken = async (token) => getAuth().verifyIdToken(token);

export const getUserWithUid = async(uid) => getAuth().getUser(uid)



