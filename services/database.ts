import { MongoClient } from 'mongodb';

export const connect = () => {
    const uri = process.env.MONGO_DB_URI;
    if(!uri){
        throw new Error("MONGO_DB_URI has not been defined");
    }
    const client = new MongoClient(uri);
    return client.db('caribou');
}