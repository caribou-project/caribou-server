import express from 'express';
import dotenv from 'dotenv';
import routes from '@routes';

import { createQueues } from '@services/queue';
import { connect } from '@services/database';
import './types/declares';

dotenv.config();
const app = express();

const [queueSyncSubtitles] = createQueues(["queue_syncSubtitles"]);

app.use((req, res, next) => {
    req.database = connect();
    req.queues = {
        subtitles: queueSyncSubtitles
    }
    next();
})

routes.get.forEach(route => app.get(route.path, route.resolve))
routes.post.forEach(route => app.post(route.path, route.resolve))

app.listen(process.env.PORT || 9833, () => {
    console.log("Caribou server listen at localhost:9833 port");
});