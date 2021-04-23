'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/ico',
  json: 'application/json',
  svg: 'image/svg+xml',
};

class Client {
  constructor(req, res, application) {
    this.req = req;
    this.res = res;
    this.application = application;
  }

  async loadFilebyLink(link, storagePath) {
    const data = this.application.getLink(link);
    if (!data) throw new Error(`No such link: ${link}`);

    const [token, filePath, fileName] = data.split(':');
    const name = fileName.slice(fileName.lastIndexOf('/') + 1);
    const buffer = await fsp.readFile(
      path.join(storagePath, token, filePath),
      'utf-8'
    );
    this.res.setHeader('Content-disposition', `attachment; filename=${name}`);
    this.res.end(buffer);
  }

  static() {
    try {
      const url = this.req.url === '/' ? '/index.html' : this.req.url;
      const fileExt = path.extname(url).substring(1);

      if (MIME_TYPES[fileExt]) {
        this.res.writeHead(200, { 'Content-Type': MIME_TYPES[fileExt] });
        const data = this.application.staticFiles.get(url);
        this.res.end(data);
        return;
      }

      this.res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      const data = this.application.staticFiles.get('/index.html');
      this.res.end(data);
      // this.application.logger.log(`${url} Not Found`);
      // this.res.writeHead(404, 'Not Found');
      // this.res.end('404: Not Found!');
    } catch (err) {
      this.application.logger.error(err);
    }
  }
}

module.exports = Client;
