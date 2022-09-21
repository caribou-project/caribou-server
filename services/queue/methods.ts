import throat from 'throat';
import fetch from 'node-fetch';
import { MethodResponse, MethodInput } from "@types"
import OSAPI from '@services/opensubtitles';
import { extractToSrt, countWords } from '@utils/parser';

const calculateRarities = async ({ database, redis, job }: MethodInput): Promise<MethodResponse> => {
    if (!(job?.data?.track_id)) {
        return { status: "ERROR", message: "No track_id provided." }
    }

    const result = await OSAPI.search({ id: job.data.track_id });
    if(typeof result === "string"){
        return { status: "ERROR", message: "Service didn't return a JSON body value" }
    }
    if(result instanceof Error){
        return { status: "ERROR", message: result.message };
    }

    if (!result || result?.total_count <= 0) {
        return { status: "ERROR", message: "Subtitle not found" }
    }

    const [subtitle] = result.data;
    if (!subtitle?.attributes?.legacy_subtitle_id) {
        return { status: "ERROR", message: "Subtitle legacy file not found" };
    }

    const TRACK_ID = subtitle.attributes.feature_details.feature_id;
    const file_ids = subtitle.attributes.files.map(file => file.file_id);

    const file_ids_requests = file_ids.map(throat(1, file_id => OSAPI.download({file_id})));
    const file_download_objects = await Promise.all(file_ids_requests);

    const file_content_requests = file_download_objects
        .map(throat(1, content_request => fetch(content_request.link).then(res => res.text())));

    const file_contents = await Promise.all(file_content_requests);

    const files_concatenated = file_contents.map(extractToSrt)
        .reduce((sum, text) => {
            sum += text;
            return sum;
        });
    
    if(files_concatenated.length <= 0){
        return { status: "ERROR", message: "Subtitle file is empty" };
    }

    // count words by injecting the insertedId of subtitle object to the words array
    const words = countWords(files_concatenated, TRACK_ID);
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

export default {
    calculateRarities
}