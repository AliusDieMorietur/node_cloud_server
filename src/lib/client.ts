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
  private req;
  private res;
  private application;

  constructor(req, res, application) {
    this.req = req;
    this.res = res;
    this.application = application
  }

  parseUrl(url): string {
    if (url === '/') return '/index.html';

    const techDomains = ['/assets', '/css', '/js', '/favicon.ico'];
    const reservedDomains = ['/temporary', '/calc'];
    const index = url.indexOf('/', 1);
    const [domain, param] = index === -1 
      ? [url, '']
      : [url.slice(0, index), url.slice(index)];

    if (techDomains.includes(domain)) return url;

    const addon: any = Array
      .from(this.application.static.keys())
      .filter(key => param.includes(key));

    // if (reservedDomains.includes(domain)) {
    //   if (addon[0]) return addon[0];
    //   return '/index.html';
    // }

    if (reservedDomains.includes(domain)) 
      return addon[0] ? addon[0] : '/index.html';

    return 'Not found';
  }

  static() {
    try {

      const url = this.req.url === '/' ? '/index.html' : this.req.url;
      // const url = this.parseUrl(this.req.url)
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