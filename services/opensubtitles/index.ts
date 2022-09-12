import fetch from 'node-fetch';
import { ISearchParams, IDownloadParams } from './types';
import qs from 'qs';
import dotenv from 'dotenv';
dotenv.config();

const ENDPOINT = "https://api.opensubtitles.com/api/v1";
const API_KEY = process.env.OS_API_KEY;

class OpenSubtitles {
    download = ({ file_id }: IDownloadParams) => {
        return fetch(`${ENDPOINT}/download`, {
            method: "POST",
            headers: { 'Api-Key': API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ file_id: file_id }),
        }).then(res => {
            if (res.headers.get('content-type') === 'application/json') {
                return res.json();
            }
            return res.text()
        })
            .catch(err => {
                console.log(err);
                return { error: err };
            })
    }
    download3rdParty = ({ file_id }: IDownloadParams) => {
        return fetch(`https://dl.opensubtitles.org/tr/download/sub/${file_id}`)
            .then(res => res.buffer())
    }
    search = (params: ISearchParams | qs.ParsedQs) => {
        const query = qs.stringify(params);
        return fetch(`${ENDPOINT}/subtitles?` + query, {
            method: "GET",
            headers: { 'Api-Key': API_KEY, "Content-Type": "application/json" },
        })
            .then(res => {
                if (res.headers.get('Content-Type').includes('application/json')) {
                    return res.json();
                }
                return res.text()
            })
            .catch(err => {
                console.log(err);
                return { error: err };
            })
    }
}

export default new OpenSubtitles();