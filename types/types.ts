/// <reference path="../types/response.d.ts" />

import { DoneCallback, Job, Queue as IQueue } from "bull";
import { Db, ObjectId } from 'mongodb';
import NodeCache from 'node-cache';

export type SummaryType = [string, number]
export type ICreateQueue = (queue_alias: string) => IQueue;
export type MethodResponse = {
    status: "OK" | "ERROR";
    message?: string;
}

export type MethodInput = {
    database: Db;
    job: Job;
    store: NodeCache;
}

export type CreateQueueReturn = {
    [key in string]: IQueue
}

export type ProcessQueueInput = {
    database: Db;
    store: NodeCache;
}

export type ProcessQueueReturn = {
    (job: Job, done: DoneCallback): Promise<void>;
}

export type Record = {
    _id: ObjectId;
    word: string;
    count: number;
    rarity: number;
}