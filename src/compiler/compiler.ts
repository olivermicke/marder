import { readFileSync } from 'fs';

import { printAST } from './parser/ast-printer';
import { Parser } from './parser/parser';
import { Scanner } from './scanner/scanner';

export const compile = (path: string): never => {
  const fileContent = readFileSync(path, 'utf-8');
  const tokens = new Scanner(fileContent).scanTokens();

  console.log('=== SOURCE ===');
  console.log(fileContent);
  console.log('==============');
  console.log('=== TOKENS ===');
  console.log(tokens);
  console.log('==============');
  console.log('=== prtAST ===');
  console.log(printAST(new Parser(tokens).parse()));
  console.log('==============');
  process.exit(0);
};
