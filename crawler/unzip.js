const fs = require('fs');
const yauzl = require("yauzl");
const { execSync } = require('child_process');

const extract = (file_path, output_path) => {
    return new Promise((resolve, reject) => {
        yauzl.open(file_path, { lazyEntries: true }, (err, zipfile) => {
            if (err) return reject(err);
            zipfile.readEntry();
            zipfile.on("entry", entry => {
                if (/\/$/.test(entry.fileName)) {
                    zipfile.readEntry();
                } else {
                    zipfile.openReadStream(entry, function (err, readStream) {
                        if (err) throw err;
                        if (!fs.existsSync(output_path)) fs.mkdirSync(output_path)
                        readStream.on('end', () => zipfile.readEntry())
                        readStream.pipe(fs.createWriteStream(output_path + "/" + entry.fileName));
                    })
                }
            });
            zipfile.on('end', () => {
                execSync(`ls ${output_path} | grep -v '.srt$' | xargs printf -- '${output_path}/%s\n' | xargs rm`)
                return resolve();
            });
        })
    })
}

module.exports = extract