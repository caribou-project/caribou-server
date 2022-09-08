
const stripText = (x: string) => {
    return x.replace(/(\n|\r|\t)/gm, "");
}

const waitFor = (t: number) => new Promise(resolve => setTimeout(resolve, t));

export {
    stripText,
    waitFor
}
