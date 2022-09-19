import { createClient } from 'redis';
const REDIS_URL = process.env.REDIS_URL;

export const connectRedis = async () => {
    const client = createClient({ url: REDIS_URL });
    client.on('error', (err) => console.log('Redis Client Error', err));

    await client.connect();
    return client;
}

export const storeRarities = async (db, redis) => {
    const records = await db.collection('rarities').find({}).toArray();
    records.forEach(record => {
        const rarity = 1 / record.count / records.length;
        redis.set(record.word, JSON.stringify({ rarity, count: record.count }));
    });
}