import * as path from 'path';

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/ico',
  json: 'application/json',
  svg: 'image/svg+xml',
};

export class Client {
  constructor(private req, private res, private application) {}

  static() {
    try {

      const url = this.req.url === '/' ? '/index.html' : this.req.url;
      const fileExt = path.extname(url).substring(1);
      
      if (MIME_TYPES[fileExt]) {
        this.res.writeHead(200, { 'Content-Type': MIME_TYPES[fileExt] });
        const data = this.application.getStatic(url);
        this.res.end(data);
        return;
      }

      this.res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      const data = this.application.getStatic('/index.html');
      this.res.end(data);
      // this.application.logger.log(`${url} Not Found`);
      // this.res.writeHead(404, 'Not Found');
      // this.res.end('404: Not Found!');
    } catch (err) {
      this.application.logger.error(err);
    }
  }
}