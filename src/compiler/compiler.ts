import { readFileSync } from 'fs';

export const compile = (path: string): never => {
  const fileContent = readFileSync(path, 'utf-8');
  console.log(fileContent);
  process.exit(0);
};
