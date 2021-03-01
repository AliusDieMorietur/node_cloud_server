import * as path from 'path';
import { promises as fsp } from 'fs';

export const upload = async (dirPath: string, names: string[], buffers: Buffer[]): Promise<void> => {
  if (buffers.length !== names.length) {
    let error = 'Buffers or it`s names corrupted';
    throw new Error(error);
  }

  for (let i = 0; i < names.length; i++) {
    const fileName = path.join(dirPath, names[i]);
    const buffer = buffers[i];
    await fsp.writeFile(fileName, buffer);
  }
}

export const download = async (path: string, connection): Promise<any> => {
  const buffer = await fsp.readFile(path);
  console.log(buffer);
  connection.send(buffer);
}

