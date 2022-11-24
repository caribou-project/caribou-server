import express from 'express';
import dotenv from 'dotenv';
import Cache from 'node-cache';

import routes from '@routes';

import { createAdapter, createQueues, processQueue } from '@services/queue';
import { connectRedis, storeRarities } from '@services/store';
import { connect } from '@services/database';
import './types/declares';

dotenv.config();
const app = express();

const queues = createQueues(["subtitles", "contentScore"]);

(async () => {
    const store = new Cache();
    const redisClient = await connectRedis();

    const database = connect();
    await storeRarities(database, store);

    app.use((req, res, next) => {
        req.database = database;
        req.store = store;
        req.redis = redisClient;
        req.queues = queues;
        next();
    });
    
    const boardAdapter = createAdapter(Object.values(queues));
    app.use('/monitor', boardAdapter.getRouter());

    routes.get.forEach(route => app.get(route.path, route.resolve))
    routes.post.forEach(route => app.post(route.path, route.resolve))

    app.listen(process.env.PORT || 9833, () => {
        console.log("Caribou server listen at localhost:9833 port");
    });

    Object.values(queues)
        .map(queue => queue.process(processQueue({ database, store })));
})();
