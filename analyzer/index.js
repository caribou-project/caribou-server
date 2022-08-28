const fs = require('fs');

const subtitles_dir = './subtitles/files';
const tracks_index_file_path = subtitles_dir + '/index.json';
if(!fs.existsSync(tracks_index_file_path)){
    console.log("Please run the formatter script first.");
    process.exit();
}

let words_count_for_all = {};

const tracks = JSON.parse(fs.readFileSync(tracks_index_file_path, 'utf8'));
for(let track of tracks){
    const [track_id, parts] = track;
    let words_count_for_track = {};
    for(let sub of parts){
        const subs = JSON.parse(fs.readFileSync(`.${sub}`, 'utf8'));
        for(let sub of subs){
            [...sub.text.toLowerCase().matchAll(/[a-zA-Z\']+/g)].forEach(word => {
                words_count_for_track[word] = (words_count_for_track[word] || 0) + 1;
                words_count_for_all[word] = (words_count_for_all[word] || 0) + 1;
            })
        }
    }
    const words_count_for_track_sorted = Object.entries(words_count_for_track).sort((a, b) => b[1] - a[1]);
    fs.writeFileSync(`${subtitles_dir}/${track_id}/summary.json`, JSON.stringify(words_count_for_track_sorted, null, 4));
}

let words_count_for_all_sorted = Object.entries(words_count_for_all).sort((a, b) => b[1] - a[1]);
fs.writeFileSync(`${subtitles_dir}/summary.json`, JSON.stringify(words_count_for_all_sorted, null, 4));