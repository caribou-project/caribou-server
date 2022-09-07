const fs = require('fs');

const summary_file = fs.readFileSync('./subtitles/files/summary.json', 'utf8');
const summary_json = JSON.parse(summary_file);

const word_rarities = summary_json.reduce((obj, [word, usage_count]) => {
    obj[word] = 1 / usage_count / summary_json.length
    return obj;
}, {});


const summary_with_rarity_points = summary_json.map(([word, count]) => ([
    word, count, word_rarities[word]
]));
fs.writeFileSync('./subtitles/files/summary.json', JSON.stringify(summary_with_rarity_points, null, 4));

const tracks = fs.readdirSync('./subtitles/files');
tracks.forEach(track => {
    if(!/^[0-9]+/.test(track)){ return };
    const track_summary = JSON.parse(fs.readFileSync(`./subtitles/files/${track}/summary.json`, 'utf8'));
    const track_metadata = JSON.parse(fs.readFileSync(`./subtitles/files/${track}/metadata.json`, 'utf8'));
    const track_summary_rarity_point = track_summary.reduce((sum, [word, count]) => {
        return sum + (count * word_rarities[word])
    }, 0);


    const json_metadata_body = JSON.stringify(Object.assign({}, track_metadata, {
        track_summary_rarity_point: Number((track_summary_rarity_point * 100).toFixed(3))
    }), null, 4);
    fs.writeFileSync(`./subtitles/files/${track}/metadata.json`, json_metadata_body);
});

console.log("The track summary rarity points are calculated for the all subtitles.");