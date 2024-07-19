import { Readable } from 'stream';

export function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // Indica el final del stream.
  return stream;
}
