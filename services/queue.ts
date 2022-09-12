import Queue, { Queue as IQueue } from "bull"

const REDIS_URL = process.env.REDIS_URL;

const createQueue = (queue_alias): IQueue => {
    const queue = new Queue(queue_alias, REDIS_URL);
    queue.on('error', err => {
        if (err.message.trim() === "connect ETIMEDOUT") {
            return console.log("[ERROR] Couldn't connect to the redis service.")
        }
        console.log(`Unexpected error: ${err.message}`);
    })
    return queue;
}

export const createQueues = (aliases: string[]) => {
    return aliases.map(createQueue)
}