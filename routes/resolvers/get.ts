import { Request, Response } from 'express';
import OSAPI from '@services/opensubtitles';
import { ISearchParams } from '@services/opensubtitles/types';
import { mergeTracks } from '@utils';
import { Sort } from 'mongodb';

export const searchSubtitles = async (req: Request, res: Response) => {
    const { limit = 20, offset = 0 } = req.query;

    if (Number.isNaN(Number(limit))) {
        res.status(500).json({ error: "limit parameter must be a number" })
    };
    if (Number.isNaN(Number(offset))) {
        res.status(500).json({ error: "offset parameter must be a number" })
    };

    const defaultParams: ISearchParams = { order_by: "download_count", order_direction: "desc", languages: "en", type: "Movie" };
    const results = await OSAPI.search(Object.assign({}, defaultParams, req.query));

    if (results instanceof Error) {
        return res.status(500).json({ error: results.message });
    }

    const merged_tracks = mergeTracks(results.data);
    return res.json(merged_tracks);
}

export const getSubtitle = async (req: Request, res: Response) => {
    const subtitleRecord = await req.database.collection('subtitles').findOne({ track_id: Number(req.params.track_id) });

    if (!subtitleRecord) {
        const jobs = await req.queues.subtitles.getJobs(["active", "waiting", "delayed", "paused"]);
        const isQueued = jobs.some(job => job.data.track_id === Number(req.params.track_id));

        const defaultParams: ISearchParams = {
            order_by: "download_count", order_direction: "desc",
            languages: "en", type: "Movie", id: Number(req.params.track_id)
        };
        const results = await OSAPI.search(Object.assign({}, defaultParams, req.query));

        if (results instanceof Error) return res.status(500).json({ error: results.message });
        if (results.total_count <= 0) return res.status(404).json({ error: "Subtitle not found" });

        const [data] = results.data;

        const subtitle = {
            ...data.attributes.feature_details,
            track_id: data.attributes.feature_details.feature_id,
            links: data.attributes.related_links,
            opensubtitles_id: data.attributes.legacy_subtitle_id,
            contentScore: "-",
            lastUpdate: new Date()
        };

        if (isQueued) {
            return res.json({
                ...subtitle,
                words: {
                    completed: false, status: "queued", data: [],
                    message: "The subtitle is in queue to be processed",
                }
            });
        }

        await req.queues.subtitles.add({ method: "calculateRarities", track_id: Number(req.params.track_id) });
        return res.json({
            ...subtitle,
            words: {
                completed: false, status: "queued", data: [],
                message: "The subtitle added to the queue to be processed",
            }
        })
    }

    if (!(subtitleRecord?.lastUpdate) || subtitleRecord.lastUpdate < Date.now() - 1000 * 60 * 60 * 24) {
        await req.queues.contentScore.add({ method: "updateContentScore", track_id: Number(req.params.track_id) });
    }

    const words = await req.database.collection('words')
        .aggregate([{
            $match: { track_id: subtitleRecord.track_id }
        },
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
        },
        { $sort: { rarityScore: -1 } },
        ]).toArray()

    const response = Object.assign({}, subtitleRecord, {
        words: {
            completed: true, status: "completed", data: words,
            message: "Word rarities was calculated.",
        }
    });
    return res.json(response);
}

export const getSubtitles = async (req: Request, res: Response) => {
    const { limit = 20, offset = 0, sort = { contentScore: -1 } } = req.query;
    const subtitles = await req.database.collection('subtitles').find()
        .sort(sort as Sort)
        .limit(Number(limit))
        .skip(Number(offset))
        .toArray();

    return res.json(subtitles);
}