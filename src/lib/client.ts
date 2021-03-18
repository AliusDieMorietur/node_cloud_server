import * as path from 'path';
import { promises as fsp } from 'fs';

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

  async loadFilebyLink(link: string, storagePath: string): Promise<void> {
    const data = this.application.getLink(link);
    if (!data) throw new Error(`No such link: ${link}`) 

    const [token, filePath, fileName] = data.split(':'); 
    const name = fileName.slice(fileName.lastIndexOf('/') + 1);
    const buffer = await fsp.readFile(path.join(storagePath, token, filePath), 'utf-8')
    this.res.setHeader('Content-disposition', `attachment; filename=${name}`);
    this.res.end(buffer);
  }

  // static async loadFilebyLink(link: string, storagePath: string, req, res): Promise<void> {
  //   const linkPath = path.join(
  //     storagePath,
  //     'magnet_links.json'
  //   );
  //   const links = JSON.parse(await fsp.readFile(linkPath, 'utf-8'));
  //   const data = links[link] 
  //     ? links[link]
  //     : 'Not Found'; 
  //   const [token, filePath, fileName] = data.split(':'); 
  //   const buffer = await fsp.readFile(path.join(storagePath, token, filePath), 'utf-8')
  //   res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
  //   res.end(buffer);
  // }

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