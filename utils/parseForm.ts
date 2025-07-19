import formidable from 'formidable';
import type { NextApiRequest } from 'next';

export function parseForm(req: NextApiRequest): Promise<{
  fields: Record<string, string | string[]>;
  files: Record<string, any>;
}> {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}
