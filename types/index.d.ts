import { Db } from "mongodb";

declare module 'parse-srt' {
    var content: any;
    export = content;
}

declare namespace Express{
    export interface Request {
        database?: Db
    }
}
