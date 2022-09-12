import { Request, Response } from 'express';

export interface SignificantWord{
    word: string;
    count: number;
    significancy: number;
}

export interface Metadata{
    id: string;
    name: string;
    download?: string;
    imdb: string;
    complexity?: number;
    imdb_id: string;
    lang: string;
    significant_words?: SignificantWord[]
}

export interface loadMovie{
    id: string;
    count: number;
}

export interface loadMovies{
    limit: number;
    offset: number;
}

export interface SRTJSONContent{
    id: number;
    start: number;
    end: number;
    text: string;
}

export interface OSRowData{
    id: string;
    name: string;
    download: string;
    imdb_id: string;
    imdb: string;
}

export interface IRoute{
    path: string;
    resolve: (req: Request, res: Response) => void;
}

export interface IRoutes{
    get: IRoute[],
    post: IRoute[],
}