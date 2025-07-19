 
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { promises as fs } from 'fs';
import formidable, { Fields, Files, File } from 'formidable';

export interface ParsedForm {
  fields: Fields;
  files: Files;
}

export async function parseForm(
  req: IncomingMessage
): Promise<ParsedForm> {
  const form = formidable({ multiples: true });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}
