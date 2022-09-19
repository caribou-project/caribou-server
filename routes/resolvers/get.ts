import { Request, Response } from 'express';
import OSAPI from '@services/opensubtitles';
import { ISearchParams } from '@services/opensubtitles/types';

export const getSubtitles = async (req: Request, res: Response) => {
    const { limit = 20, offset = 0 } = req.query;

    if (Number.isNaN(Number(limit))) {
        res.status(500).json({ error: "limit parameter must be a number" })
    };
    if (Number.isNaN(Number(offset))) {
        res.status(500).json({ error: "offset parameter must be a number" })
    };

    const defaultParams: ISearchParams = { order_by: "download_count", order_direction: "desc", languages: "en", type: "Movie" };
    const results = await OSAPI.search(Object.assign({}, defaultParams, req.query));
    return res.json(results);
}

export const getSubtitle = async (req: Request, res: Response) => {
    const doesExist = await req.database.collection('subtitles').findOne({ track_id: Number(req.params.track_id) });

    if(!doesExist){
        const jobs = await req.queues.subtitles.getJobs(["active", "waiting", "delayed", "paused"]);
        const isQueued = jobs.some(job => job.data.track_id === Number(req.params.track_id));
        if(isQueued){
            return res.json({ status: "in-queue", message: "The movie is waiting in the queue" });
        }

        await req.queues.subtitles.add({ method: "calculateRarities", track_id: Number(req.params.track_id) });
        return res.json({ status: "queued", message: "The movie added to the queue" })
    }

    const words = await req.database.collection('words')
        .aggregate([{
            $match: { track_id: doesExist.track_id }
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

    const response = Object.assign({}, doesExist, { words });
    return res.json({
        status: "calculated",
        response
    });
}