/// <reference path="../types/response.d.ts" />

import { DoneCallback, Job, Queue as IQueue } from "bull";
import { Db } from 'mongodb';
import { RedisClientType } from '@redis/client';

export type SummaryType = [string, number]
export type ICreateQueue = (queue_alias: string) => IQueue;
export type MethodResponse = {
    status: "OK" | "ERROR";
    message?: string;
}

export type MethodInput = {
    database: Db;
    job: Job;
    redis: RedisClientType;
}

