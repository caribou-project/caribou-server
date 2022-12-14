import AdmZip from 'adm-zip';
import parseSRT from 'parse-srt';

String.prototype.stripChars = function () {
    return this
        .replace(new RegExp("(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})", "gim"), " ")
        .replace(/(<[^>]*>|\-|[0-9]+|[\.\?\+\*\!\=\"\/\\\]\[\]\)\(\)\,\:])/g, " ")
        .replace(/\'/g, "")
        .toLowerCase();
}

export const extractToSrt3rdParty = (file: Buffer) => {
    const entries = new AdmZip(file).getEntries()
    return entries
        .filter(entry => entry.entryName.endsWith(".srt"))
        .reduce((text, el) => {
            text += parseSRT(el.getData().toString('utf8')).map(line => line.text)
                .join(" ").stripChars();
            return text;
        }, "");
};

export const extractToSrt = (file: String) => {
    return parseSRT(file).map(line => line.text).join(" ").stripChars();
}

export const countWords = (text: string, track_id: number): {word: string, count: number, track_id: number}[] => {
    const words = text.split(" ");
    return Object.entries(words.reduce((acc, word) => {
        if(!word) return acc;
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {})).map(([word, count]: [string, number]) => ({ word, count, track_id }));
}