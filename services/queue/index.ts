import Queue, { Queue as IQueue, Job, DoneCallback } from "bull"
import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';

import Methods from '@services/queue/methods';
import {
    ICreateQueue, MethodResponse, ProcessQueueInput,
    ProcessQueueReturn, IQueueMethod, CreateQueueReturn, Store
} from "@types";

const REDIS_URL = process.env.REDIS_URL;

const createQueue: ICreateQueue = (queue_alias): IQueue => {
    const queue = new Queue(queue_alias, REDIS_URL);
    queue.on('error', err => {
        if (err.message.trim() === "connect ETIMEDOUT") {
            return console.log("[ERROR] Couldn't connect to the redis service.")
        }
        console.log(`Unexpected error: ${err.message}`);
    })
    return queue;
}

export const createQueues = (aliases: string[]): CreateQueueReturn => {
    return aliases
        .reduce((obj, alias) => ({ ...obj, [alias]: createQueue(alias) }), {})
}

export const processQueue = ({ database, store }: ProcessQueueInput): ProcessQueueReturn => async (job, done) => {
    if (!(job?.data?.method)) {
        return done(new Error("No method provided."));
    }

    if (!(typeof job.data.method === "string") || !Methods[job.data.method]) {
        return done(new Error("Invalid method provided."));
    }

    const queueMethod: IQueueMethod = Methods[job.data.method];
    queueMethod({ database, job, store })
        .then((response: MethodResponse) => {
            if (response?.status === "OK") {
                job.log(JSON.stringify(response));
                return done(null, response);
            }

            if (response?.status === "ERROR") {
                job.log(JSON.stringify(response));
                return done(new Error(response.message));
            }
        })
}

export const createAdapter = (queues: IQueue[]): ExpressAdapter => {
    const adapter = new ExpressAdapter();
    adapter.setBasePath('/monitor');

    createBullBoard({
        queues: queues.map(queue => new BullAdapter(queue)),
        serverAdapter: adapter
    });

    return adapter;
}