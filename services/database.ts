import { MongoClient } from 'mongodb';
const URI = process.env.NODE_ENV === "production"
    ? process.env.MONGO_DB_URI_PROD
    : process.env.MONGO_DB_URI_DEV;

export const connect = () => {
    const uri = URI;
    if(!uri){
        throw new Error("MONGO_DB_URI has not been defined");
    }
    const client = new MongoClient(uri);
    return client.db('caribou');
}