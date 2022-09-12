
type OrderType = "language" | "download_count" | "new_download_count" | "hearing_impaired" | "hd" | "format" | "fps" | "votes" | "points" | "ratings" | "from_trusted" | "foreign_parts_only" | "ai_translated" | "machine_translated" | "upload_date" | "release" | "comments";
type OrderDirection = "asc" | "desc";

export interface IDownloadParams{
    file_id: string;
}

export interface ISearchParams {
    ai_translated?: string;
    episode_number?: number;
    foreign_parts_only?: string;
    hearing_impaired?: string;
    id?: number;
    imdb_id?: number;
    languages?: string;
    machine_translated?: string;
    moviehash?: string;
    moviehash_match?: string;
    order_by?: OrderType;
    order_direction?: OrderDirection;
    page?: number;
    parent_feature_id?: number;
    parent_imdb_id?: number;
    parent_tmdb_id?: number;
    query?: string;
    season_number?: number;
    tmdb_id?: number;
    trusted_sources?: string;
    type?: string;
    user_id?: number;
    year?: number
}