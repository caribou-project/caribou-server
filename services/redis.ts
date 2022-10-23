import { Db } from 'mongodb';
import { RedisClientType } from '@redis/client';
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;

export const connectRedis = async () => {
    let client: ReturnType<typeof createClient>;
    if(REDIS_URL){
        client = createClient({ url: REDIS_URL });
    }else{
        client = createClient();
    }

    await client.connect();
    return client;
}

export const storeRarities = async (db: Db, redis: ReturnType<typeof createClient>) => {
    await redis.flushAll();

    const records = await db.collection('rarities').find({}).toArray();
    return Promise.all(records.map(record => {
        const rarity = 1 / record.count / records.length;
        return redis.set(record.word, JSON.stringify({ rarity, count: record.count }));
    }));
}