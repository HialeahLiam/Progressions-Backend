export const info = (...params) => {
	// We don't want to log info or errors during testing because logs will
	// interrupt test output in the console.
	if (process.env.NODE_ENV !== 'test') { console.log(...params); }
};

export const error = (...params) => {
	if (process.env.NODE_ENV !== 'test') { console.error(...params); }
};

