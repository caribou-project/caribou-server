import { Request, Response } from 'express';
import OSAPI from '@services/opensubtitles';
import { extractToSrt, countWords } from '@utils/parser';
import { ISearchParams } from '../../services/opensubtitles/types';

export const getSubtitles = async (req: Request, res: Response) => {
    const { limit = 20, offset = 0 } = req.query;

    if (Number.isNaN(Number(limit))) {
        res.status(500).json({ error: "limit parameter must be a number" })
    };
    if (Number.isNaN(Number(offset))) {
        res.status(500).json({ error: "offset parameter must be a number" })
    };

    const defaultParams: ISearchParams = { order_by: "download_count", order_direction: "desc", languages: "en" }
    const results = await OSAPI.search(Object.assign({}, defaultParams, req.query));
    return res.json(results);
}

export const getSubtitle = async (req: Request, res: Response) => {
    const defaultParams: ISearchParams = { order_by: "download_count", order_direction: "desc", languages: "en" }

    const doesExist = await req.database.collection('subtitles').findOne({ imdb_id: Number(req.params.imdb_id) });
    if(doesExist) return res.json(doesExist);

    const params = Object.assign({}, defaultParams, req.params);

    const results = await OSAPI.search(params);
    if(!results || results?.total_count <= 0) {
        return res.status(404).json({ error: "Subtitle not found" });
    }

    const [subtitle] = results.data;
    if(!subtitle?.attributes?.legacy_subtitle_id){
        return res.status(404).json({ error: "Subtitle legacy file not found" });
    }

    const content = await OSAPI.download3rdParty({ file_id: subtitle.attributes.legacy_subtitle_id })
    const rawData = extractToSrt(content);
    const words = Object.entries(countWords(rawData))
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count);

    const responseBody = {
        ...subtitle.attributes.feature_details,
        links: subtitle.attributes.related_links,
        subtitle_id: subtitle.attributes.legacy_subtitle_id,
        words
    };

    await req.database.collection('subtitles').insertOne(responseBody);
    return res.json(responseBody);
}