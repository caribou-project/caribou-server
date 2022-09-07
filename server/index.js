import express from 'express';
import fs from 'fs';

const app = express();

const loadSubtitles = (includeSummary = false) => {
    const subs = fs.readdirSync('./subtitles/files/')
    return subs.map(sub => {
        if (!/[0-9]+/g.test(sub)) return;

        let returnValue = {};

        const metadata_file = fs.readFileSync(`./subtitles/files/${sub}/metadata.json`, "utf8");
        const metadata_json_file = JSON.parse(metadata_file);
        returnValue = {...returnValue, metadata_json_file};

        if(includeSummary){
            const summary_file = fs.readFileSync(`./subtitles/files/${sub}/summary.json`, "utf8");
            const summary_json_file = JSON.parse(summary_file);
            returnValue = {...returnValue, summary_json_file};
        }

        return returnValue;
    }).filter(Boolean);
}


app.get("/list-movies", (req, res) => {
    const { includeSummary = false } = req.query;
    const subtitles = loadSubtitles(includeSummary);
    return res.json(subtitles);
});

app.listen(process.env.PORT || 9833, () => {
    console.log("Caribou server listen at localhost:9833 port");
});