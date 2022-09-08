import fs from 'fs';
import parseSRT from 'parse-srt';
import { SRTJSONContent } from '../types';

const __dirname_abs = __dirname.split("/").slice(0, -1).join("/");
const subtitles_dir = '/subtitles/files';
const dirs = fs.readdirSync(__dirname_abs + subtitles_dir);

let subs = [];

const stripChars = (line: string) => {
    return line.replace(/<[^>]*>/g, " ").replace(/\-/g, "");
}

for(var dir of dirs){
    if(dir.endsWith(".json")) continue;

    const dir_content = fs.readdirSync(`${__dirname_abs}${subtitles_dir}/${dir}`)
    const filenames = dir_content
        .filter(el => el.endsWith(".srt"))
        .map(filename => {
            const file_content_srt = fs.readFileSync(`${__dirname_abs}${subtitles_dir}/${dir}/${filename}`, 'utf-8') 
            const file_content_json: SRTJSONContent[] = parseSRT(file_content_srt);
            const file_content_json_stripped = file_content_json
                .map(line => Object.assign({}, line, {text: stripChars(line.text)}))
            const output_name = `${subtitles_dir}/${dir}/${filename.replace(".srt", ".json")}`;
            fs.writeFileSync(__dirname_abs + output_name, JSON.stringify(file_content_json_stripped, null, 4));
            return output_name;
        });
    subs.push([dir, filenames]);
}

fs.writeFileSync(`${__dirname_abs}${subtitles_dir}/index.json`, JSON.stringify(subs, null, 4));