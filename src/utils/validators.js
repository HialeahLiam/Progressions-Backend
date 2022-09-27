export const checkProgressionValidity = (progression) => {
    console.log('checkProgressionValidy')
    console.log(progression)
    const validity = {
        isValid: false
    }

    const {
        title,
        root,
        mode,
        chords,
        audio} = progression
    const {url, end_time, chord_start_times} = audio

    if (!title) {
        validity.error = 'Progression is missing title'
        return validity
    }
    // root could have a valid value of 0, which is falsey
    if (root === null || root === undefined) {
        validity.error = 'Progression is missing root'
        return validity
    }
    if (!mode) {
        validity.error = 'Progression is missing mode'
        return validity
    }
    if (!chords) {
        validity.error = 'Progression is missing chords'
        return validity
    }
    if (!audio || !end_time || !chord_start_times) {
        validity.error = 'Progression is missing audio property containing url, end_time, and chord_start_times'
        return validity
    }

    validity.isValid = true

    return validity
}