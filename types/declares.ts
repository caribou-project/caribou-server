import { Db } from 'mongodb';
import { Queue as IQueue } from 'bull';

declare global {
    namespace Express {
        interface Request {
            database: Db;
            redis: any;
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