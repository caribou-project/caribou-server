import fetch from 'node-fetch';
import { ISearchParams, IDownloadParams } from './types';
import qs from 'qs';
import dotenv from 'dotenv';
dotenv.config();

const ENDPOINT = "https://api.opensubtitles.com/api/v1";
const { OS_API_KEY, OS_USERNAME, OS_PASSWORD } = process.env;

class OpenSubtitles {
    BEARER_TOKEN: string | null;

    constructor() {
        this.BEARER_TOKEN = null;
    }

    download = async ({ file_id }: IDownloadParams) => {
        if (!this.BEARER_TOKEN) await this.login();

        return fetch(`${ENDPOINT}/download`, {
            method: "POST",
            headers: {
                'Api-Key': OS_API_KEY,
                'Authorization': this.BEARER_TOKEN,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ file_id: file_id }),
        }).then(res => {
            if (res.headers.get('content-type').includes('application/json')) {
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
    search = (params: ISearchParams | qs.ParsedQs): Promise<OpenSubtitlesResponse.Result | Error> => {
        const query = qs.stringify(params);
        return fetch(`${ENDPOINT}/subtitles?` + query, {
            method: "GET",
            headers: { 'Api-Key': OS_API_KEY, "Content-Type": "application/json" },
        }).then(res => {
            if (res.headers.get('Content-Type').includes('application/json')) {
                return res.json();
            }
            return res.text().then(value => new Error("Service didn't return a JSON body value: " + value));
        })
    }
    login = () => {
        return fetch(`${ENDPOINT}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': OS_API_KEY
            },
            body: JSON.stringify({ username: OS_USERNAME, password: OS_PASSWORD })
        })
            .then(res => res.json())
            .then(res => {
                if (res.status === 200) {
                    this.BEARER_TOKEN = res.token;
                } else {
                    console.log("[―] Failed to login to OpenSubtitles");
                }
            })
            .catch(err => {
                console.log(`[!] Couldn't log into opensubtitles ${err.message}`);
            })
    }
}

export default new OpenSubtitles();