import { Db } from 'mongodb';
import { Record } from '@types';
import { createClient } from 'redis';
import NodeCache from 'node-cache';

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

export const storeRarities = async (db: Db, cache: NodeCache) => {
    const records: Record[] = await db.collection('rarities').find({}).toArray();
    const rarities = records.map((record) => ({
        key: record.word,
        val: {
            rarity: 1 / record.count / records.length,
            count: record.count
        }
    }));
    return cache.mset(rarities)
}