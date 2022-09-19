import { MethodResponse, MethodInput } from "@types"
import OSAPI from '@services/opensubtitles';
import { extractToSrt, countWords } from '@utils/parser';

export const calculateRarities = async ({ database, redis, job }: MethodInput): Promise<MethodResponse> => {
    if (!(job?.data?.track_id)) {
        return { status: "ERROR", message: "No track_id provided." }
    }

    const results = await OSAPI.search({ id: job.data.track_id });
    if (!results || results?.total_count <= 0) {
        return { status: "ERROR", message: "Subtitle not found" }
    }

    const [subtitle] = results.data;
    if (!subtitle?.attributes?.legacy_subtitle_id) {
        return { status: "ERROR", message: "Subtitle legacy file not found" };
    }

    const TRACK_ID = subtitle.attributes.feature_details.feature_id;

    const content = await OSAPI.download3rdParty({ file_id: subtitle.attributes.legacy_subtitle_id })
    const rawData = extractToSrt(content);

    // count words by injecting the insertedId of subtitle object to the words array
    const words = countWords(rawData, TRACK_ID);
    const countOfWords = await database.collection('rarities').countDocuments();
    let contentScore = 0;

    const writeDocs_promise = words.map(async ({ word, count }) => {
        const cachedWord = JSON.parse((await redis.get(word)) || "{}");
        const rarity = 1 / (count + (cachedWord?.count || 0)) / (countOfWords || words.length);
        contentScore += count * rarity;
        redis.set(word, JSON.stringify({ rarity, count: count + (cachedWord?.count || 0) }));

        return {
            updateOne: {
                filter: { word },
                update: {
                    $inc: { count },
                    $set: { rarity }
                },
                upsert: true
            }
        }
    });
    const writeDocs = await Promise.all(writeDocs_promise);
    await database.collection('rarities').bulkWrite(writeDocs);
    await database.collection('words').insertMany(words);

    const responseBody = {
        ...subtitle.attributes.feature_details,
        track_id: TRACK_ID,
        links: subtitle.attributes.related_links,
        opensubtitles_id: subtitle.attributes.legacy_subtitle_id,
        contentScore
    };

    // writing the subtitle to the database
    await database.collection('subtitles').insertOne(responseBody);

    return { status: "OK", message: "Subtitle processed successfully", }
}