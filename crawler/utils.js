
const stripText = x => {
    return x.replace(/(\n|\r|\t)/gm, "");
}

const waitFor = t => new Promise(resolve => setTimeout(resolve, t));

module.exports = {
    stripText,
    waitFor
}
