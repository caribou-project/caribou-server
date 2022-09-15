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
    if (doesExist) {
        const words = await req.database.collection('words')
            .aggregate([{
                $match: { opensubtitles_id: doesExist.opensubtitles_id }
            },
            { $sort: { rarityScore: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'rarities',
                    localField: 'word',
                    foreignField: 'word',
                    as: 'rarity'
                }
            }, {
                $unwind: { path: '$rarity' }
            }, {
                $project: {
                    word: 1, count: 1,
                    rarityScore: { $multiply: ["$count", "$rarity.rarity"] }
                }
            }])
            .toArray()

        const response = Object.assign({}, doesExist, { words: words });
        return res.json(response);
    }

    const params = Object.assign({}, defaultParams, req.params);

    const results = await OSAPI.search(params);
    if (!results || results?.total_count <= 0) {
        return res.status(404).json({ error: "Subtitle not found" });
    }

    const [subtitle] = results.data;
    if (!subtitle?.attributes?.legacy_subtitle_id) {
        return res.status(404).json({ error: "Subtitle legacy file not found" });
    }

    const content = await OSAPI.download3rdParty({ file_id: subtitle.attributes.legacy_subtitle_id })
    const rawData = extractToSrt(content);

    // count words by injecting the insertedId of subtitle object to the words array
    const words = countWords(rawData, subtitle.attributes.legacy_subtitle_id);

    const countOfWords = await req.database.collection('rarities').countDocuments();

    let contentScore = 0;

    const writeDocs_promise = words.map(async ({ word, count }) => {
        const cachedWord = JSON.parse((await req.redis.get(word)) || "{}");
        const rarity = 1 / (count + (cachedWord?.count || 0)) / (countOfWords || words.length);
        contentScore += count * rarity;
        req.redis.set(word, JSON.stringify({ rarity, count: count + (cachedWord?.count || 0) }));

        return {
            updateOne: {
                filter: { word },
                update: {
                    $inc: { count },
                    /* the count value must be stored in a memory-based storage */
                    $set: { rarity }
                },
                upsert: true
            }
        }
    });
    const writeDocs = await Promise.all(writeDocs_promise);
    await req.database.collection('rarities').bulkWrite(writeDocs);
    await req.database.collection('words').insertMany(words);

    const responseBody = {
        ...subtitle.attributes.feature_details,
        links: subtitle.attributes.related_links,
        opensubtitles_id: subtitle.attributes.legacy_subtitle_id,
        contentScore
    };

    // writing the subtitle to the database
    const subtitleRecord = await req.database.collection('subtitles').insertOne(responseBody);

    return res.json(responseBody);
}