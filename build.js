const fs = require('fs');
const path = require('path');

const copy = (from, to, excludeFolders = [], excludeFiles = []) => {
    fs.readdir(from, { withFileTypes: true }, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            const concatFrom = path.join(from, file.name);
            const concatTo = path.join(to, file.name);
            
            if (file.isDirectory() && !excludeFolders.includes(file.name))
                copy(concatFrom, concatTo);

            if (!file.isDirectory() && !excludeFiles.includes(file.name)) {
                fs.mkdirSync(to, { recursive: true });
                fs.copyFileSync(concatFrom, concatTo);
            }
        }
    });
}

copy('./src/db', './target/db/');
copy('./src/react_cloud_client_web/build', './target/static', ['less', 'jsx_src']);
fs.mkdirSync("./target/storage", { recursive: true });
fs.mkdirSync("./target/logs", { recursive: true });
fs.appendFileSync("./target/logs/log.txt", "");
console.log();
