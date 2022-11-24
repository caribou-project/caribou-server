import { Db } from 'mongodb';
import { Queue as IQueue } from 'bull';
import { createClient } from 'redis';

declare global {
    namespace Express {
        interface Request {
            database: Db;
            redis: ReturnType<typeof createClient>;
            queues: {
                [key in string]: IQueue
            }
        }
    }
}

declare global {
    interface String {
      stripChars: () => string;
    }
  }
