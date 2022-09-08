import fetch from 'node-fetch';
import fs from 'fs';
import {pipeline} from 'stream/promises';
import throat from 'throat';
import unzip from './unzip';
import { stripText, waitFor } from './utils';
import { OSRowData } from '../types';

const __dirname_abs = __dirname.split("/").slice(0, -1).join("/");
// controls the existence of subdirectories
if(!fs.existsSync(__dirname_abs + '/subtitles')) fs.mkdirSync(__dirname_abs + '/subtitles');
if(!fs.existsSync(__dirname_abs + '/subtitles/archive')) fs.mkdirSync(__dirname_abs + '/subtitles/archive');
if(!fs.existsSync(__dirname_abs + '/subtitles/files')) fs.mkdirSync(__dirname_abs + '/subtitles/files');
if(!fs.existsSync(__dirname_abs + '/.cache')) fs.writeFileSync(__dirname_abs + '/.cache', "");

let cached_paths = fs.readFileSync('./.cache', 'utf-8');

const parser = {
    value: /<a class="bnone" .*?>(.*?)<\/a.*?\/subtitleserve\/sub\/([0-9]*)".*?imdb\.com\/title\/([a-z0-9]+)?\/"/gm,
    resolve: ([_, name, id, imdb_id]: [any, string, string, string]): OSRowData => ({
        id,
        name,
        download: `https://dl.opensubtitles.org/tr/download/sub/${id}`,
        imdb_id: imdb_id.replace("tt", ""),
        imdb: `http://www.imdb.com/title/${imdb_id}/`
    })
}

const getFileContent = async (download_link: string) => {
    const response = await fetch(download_link, { headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": "\"Chromium\";v=\"104\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"104\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-site",
        "upgrade-insecure-requests": "1",
        "Referer": "https://www.opensubtitles.org/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    } });
    if(response.headers.get('content-type') !== "application/zip"){
        return null;
    }

    return response.body;
}

const downloadSource = async (source: OSRowData, output_path: string) => {
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

const getMovies = async (lang: string, letter: string, offset: number, max: number): Promise<any> => {
    if(offset >= max) return "";

    // getMovies works recursively
    const next = () => getMovies(lang, letter, offset + 40, max);

    const path_url = `sublanguageid-${lang}/moviename-${letter}/sort-8/asc-0/offset-${offset}`;
    if(cached_paths.includes(path_url)) return next();

    const target_url = `https://www.opensubtitles.org/tr/search/${path_url}`;
    console.log(`URL ― ${target_url}`)
    let source = await fetch(target_url)
        .then(res => res.text());

    const sources = [...stripText(source).matchAll(parser.value)].map((el: any) => {
        return parser.resolve(el)
    });

    return Promise.all(sources.map(throat(1, async source => {
        const source_path = __dirname_abs + `/subtitles/archive/${source.id}.zip`;
        const extract_path = __dirname_abs + `/subtitles/files/${source.id}`;
        await downloadSource(source, source_path);
        console.log(`― ${source.id} downloaded`)
        await unzip(source_path, extract_path)
        createMetadata(source, `${extract_path}/metadata.json`);
        await waitFor(1000);
    }))).then(_ => {
        cached_paths += path_url + "\n";
        fs.writeFileSync('./.cache', cached_paths);
        return next();
    })
}

const createMetadata = (content: OSRowData, output_path: string) => {
    fs.writeFileSync(output_path, JSON.stringify(content), "utf-8");
}

getMovies("eng", "a", 0, 500);