const fetch = require('node-fetch');
const fs = require('fs');
const {pipeline} = require('stream/promises');
const throat = require('throat');
const unzip = require('./unzip');
const { stripText, waitFor } = require('./utils');

const __dirname_abs = __dirname.split("/").slice(0, -1).join("/");
// controls the existence of subdirectories
if(!fs.existsSync(__dirname_abs + '/subtitles')) fs.mkdirSync(__dirname_abs + '/subtitles');
if(!fs.existsSync(__dirname_abs + '/subtitles/archive')) fs.mkdirSync(__dirname_abs + '/subtitles/archive');
if(!fs.existsSync(__dirname_abs + '/subtitles/files')) fs.mkdirSync(__dirname_abs + '/subtitles/files');

let cached_paths = fs.readFileSync('./.cache', 'utf-8');

const parser = {
    value: /<a class="bnone" .*?>(.*?)<\/a.*?\/subtitleserve\/sub\/([0-9]*)".*?imdb\.com\/title\/([a-z0-9]+)?\/"/gm,
    resolve: ([_, name, id, imdb_id]) => ({
        id,
        name,
        download: `https://dl.opensubtitles.org/en/download/sub/${id}`,
        imdb: `http://www.imdb.com/title/${imdb_id}/`
    })
}

const getFileContent = async (download_link) => {
    const response = await fetch(download_link, { headers: {} });
    if(response.headers.get('content-type') !== "application/zip"){
        return null;
    }

    return response.body;
}

const downloadSource = async (source, output_path) => {
    const sourceBody = await getFileContent(source.download);
    if(!sourceBody){
        console.log(`― ${source.download} is not available, your request might be blocked by Cloudflare.`)
        return process.exit();
    }
    return pipeline(
        sourceBody,
        fs.createWriteStream(output_path)
    )
}

const getMovies = async (lang, letter, offset, max) => {
    if(offset >= max) return "";

    // getMovies works recursively
    const next = () => getMovies(lang, letter, offset + 40, max);

    const path_url = `sublanguageid-${lang}/moviename-${letter}/offset-${offset}`;
    if(cached_paths.includes(path_url)) return next();

    const target_url = `https://www.opensubtitles.org/tr/search/${path_url}`;
    console.log(`URL ― ${target_url}`)
    let source = await fetch(target_url)
        .then(res => res.text());

    const sources = [...stripText(source).matchAll(parser.value)].map(parser.resolve);

    return Promise.all(sources.map(throat(1, async source => {
        console.log(`― ${source.id} downloaded`)
        const source_path = __dirname_abs + `/subtitles/archive/${source.id}.zip`;
        const extract_path = __dirname_abs + `/subtitles/files/${source.id}`;
        await downloadSource(source, source_path);
        await unzip(source_path, extract_path)
        createMetadata(source, `${extract_path}/metadata.json`);
        await waitFor(1000);
    }))).then(_ => {
        cached_paths += path_url + "\n";
        fs.writeFileSync('./.cache', cached_paths);
        return next();
    })
}

const createMetadata = (content, output_path) => {
    fs.writeFileSync(output_path, JSON.stringify(content), "utf-8");
}

getMovies("eng", "a", 0, 500);