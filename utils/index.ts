
export const mergeTracks = (tracks: OpenSubtitlesResponse.Tracks[]) => {
    const merge_by = "imdb_id";

    const merged_tracks = tracks.reduce((obj, track) => {
        const imdb_id = track.attributes.feature_details[merge_by];
        if(!obj.hasOwnProperty(imdb_id)){
            obj[imdb_id] = track;
        }
        return obj;
    }, {});

    return Object.values(merged_tracks);
}