import Queue, { Queue as IQueue, Job, DoneCallback } from "bull"
import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';

import { Db } from 'mongodb';
import * as Methods from '@services/queue/methods';
import { ICreateQueue} from "@types";

const REDIS_URL = process.env.REDIS_URL;

const createQueue: ICreateQueue = (queue_alias): IQueue => {
    const queue = new Queue(queue_alias, REDIS_URL);
    queue.on('error', err => {
        if (err.message.trim() === "connect ETIMEDOUT") {
            return console.log("[ERROR] Couldn't connect to the redis service.")
        }
        console.log(`Unexpected error: ${err.message}`);
    })
    return queue;
}

export const createQueues = (aliases: string[]): { [key in string]: IQueue} => {
    return aliases
        .reduce((obj, alias) => ({ ...obj, [alias]: createQueue(alias) }), {})
}

export const processQueue = ({ database, redis }: { database: Db, redis: any }) => async (job: Job, done: DoneCallback) => {
    if(!(job?.data?.method)){
        return done(new Error("No method provided."));
    }

    if(!(typeof job.data.method === "string") || !Methods[job.data.method]){
        return done(new Error("Invalid method provided."));
    }

    Methods[job.data.method]({ database, redis, job })
        .then(response => {
            if (response?.status === "OK") {
                done(null, response);
            }

            if (response?.status === "ERROR") {
                return done(new Error(response.message));
            }

            return done(new Error(JSON.stringify(response || {})));
        }).catch(error => {
            done(new Error(error.message));
        })
}

export const createAdapter = (queues: IQueue[]): ExpressAdapter => {
    const adapter = new ExpressAdapter();
    adapter.setBasePath('/admin/queues');

    createBullBoard({
        queues: queues.map(queue => new BullAdapter(queue)),
        serverAdapter: adapter
    });

    return adapter;
}