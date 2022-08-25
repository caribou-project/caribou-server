const fetch = require('node-fetch');
const fs = require('fs');
const {pipeline} = require('stream/promises');
const throat = require('throat');

const cached_paths = fs.readFileSync('./.cache', 'utf-8');

const stripText = x => {
    return x.replace(/(\n|\r)/gm, "");
}

const parser = {
    value: /<a class="bnone" .*?>(.*?)<\/a.*?\/subtitleserve\/sub\/([0-9]*)"/gm,
    resolve: ([_, name, id]) => ({
        id,
        name,
        download: `https://dl.opensubtitles.org/en/download/sub/${id}`
    })
}

const downloadSource = async (source) => {
    return pipeline(
        (await fetch(source.download)).body,
        fs.createWriteStream(__dirname + `/subtitles/archive/${source.name}.zip`)
    )
}

const getMovies = async (lang, letter, offset, max) => {
    if(offset >= max) return "";

    const next = () => getMovies(lang, letter, offset + 40, max);

    const path_url = `sublanguageid-${lang}/moviename-${letter}/offset-${offset}`;
    if(cached_paths.includes(path_url)) return next();

    fs.writeFileSync('./.cache', path_url + "\n");

    const target_url = `https://www.opensubtitles.org/tr/search/${path_url}`;
    console.log(`URL ― ${target_url}`)
    let source = await fetch(target_url)
        .then(res => res.text());
    const sources = [...stripText(source).matchAll(parser.value)]
        .map(parser.resolve);
    return Promise.all(sources.map(throat(1, downloadSource))).then(_ => {
        return next();
    })
}

getMovies("eng", "a", 0, 300)