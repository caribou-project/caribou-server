import { createClient } from 'redis';

export const connectRedis = async () => {
    const client = createClient();
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