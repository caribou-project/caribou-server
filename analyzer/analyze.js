const fs = require('fs');

const summary_file = fs.readFileSync('./subtitles/files/summary.json', 'utf8');
const summary_json = JSON.parse(summary_file);

const word_rarities = summary_json.reduce((obj, [word, usage_count]) => {
    obj[word] = 1 / usage_count / summary_json.length
    return obj;
}, {});

const tracks = fs.readdirSync('./subtitles/files');
const tracks_with_points = tracks.map(track => {
    if(!/^[0-9]+/.test(track)){ return };
    const track_summary = JSON.parse(fs.readFileSync(`./subtitles/files/${track}/summary.json`, 'utf8'));
    const track_metadata = JSON.parse(fs.readFileSync(`./subtitles/files/${track}/metadata.json`, 'utf8'));
    const track_summary_rarity_point = track_summary.reduce((sum, [word, count]) => {
        return sum + (count * word_rarities[word])
    }, 0);

    return {
        name: track_metadata.name,
        track,
        track_summary_rarity_point: Number((track_summary_rarity_point * 100).toFixed(3))
    }
}).filter(Boolean).sort((a, b) => b.track_summary_rarity_point - a.track_summary_rarity_point)

console.log({tracks_with_points});