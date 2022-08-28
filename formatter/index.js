const fs = require('fs');
var parseSRT = require('parse-srt')

const subtitles_dir = './subtitles/sample';
const dirs = fs.readdirSync(subtitles_dir);

for(var dir of dirs){
    const dir_content = fs.readdirSync(`${subtitles_dir}/${dir}`)
    dir_content
        .filter(el => el.endsWith(".srt"))
        .forEach(filename => {
            const file_content = fs.readFileSync(`${subtitles_dir}/${dir}/${filename}`, 'utf-8') 
            const json = parseSRT(file_content);
            fs.writeFileSync(`${subtitles_dir}/${dir}/${filename.replace(".srt", ".json")}`, JSON.stringify(json, null, 4))
        });
}