import fs from 'fs';
import { Metadata, loadMovie, loadMovies } from '../types';
import { SummaryType } from '../types/types';

const loadRarities = () => {
    return JSON.parse(fs.readFileSync('./subtitles/files/rarities.json', 'utf-8'));
}

const rarities = loadRarities();

const tidyMetadata = (metadata: Metadata) => {
    return {
        ...metadata,
        imdb_id: metadata.imdb.split("/").slice(-2)[0].replace("tt", ""),
        lang: "en"
    }
}

const loadMovies = ({limit, offset}: loadMovies) => {
    const subs = fs.readdirSync('./subtitles/files/');
    return subs.map(sub => {
        if (!/[0-9]+/g.test(sub)) return;
        const metadata_file = fs.readFileSync(`./subtitles/files/${sub}/metadata.json`, "utf8");
        return tidyMetadata(JSON.parse(metadata_file));
    }).filter(Boolean).slice(offset, offset + limit);
}

const loadMovie = ({id, count}: loadMovie) => {
    if(!fs.existsSync(`./subtitles/files/${id}`)){
        throw new Error("Movie couldn't be found for this ID");
    }

    const metadata: Metadata = JSON.parse(fs.readFileSync(`./subtitles/files/${id}/metadata.json`, 'utf8'));
    const summary: SummaryType[] = JSON.parse(fs.readFileSync(`./subtitles/files/${id}/summary.json`, 'utf8'));

    const significant_words = summary.map(([word, count]) => ({
            word, count, significancy: rarities[word] * count
        }))
        .sort((a, b) => b.significancy - a.significancy)
        .slice(0, count);

    return { ...tidyMetadata(metadata), significant_words }
}

export {
    loadMovie,
    loadMovies
}