import { readFileSync } from 'fs';

import { Scanner } from './scanner/scanner';

export const compile = (path: string): never => {
  const fileContent = readFileSync(path, 'utf-8');
  console.log('=== SOURCE ===');
  console.log(fileContent);
  console.log('==============');
  console.log('=== TOKENS ===');
  console.log(new Scanner(fileContent).scanTokens());
  console.log('==============');
  process.exit(0);
};
