import { readFileSync } from 'fs';

import { interpret } from './interpreter';
import { Parser } from './parser/parser';
import { Scanner } from './scanner/scanner';

export const runInterpreter = (path: string): never => {
  const fileContent = readFileSync(path, 'utf-8');
  const tokens = new Scanner(fileContent).scanTokens();
  // console.log(JSON.stringify(tokens, null, 4));
  const statements = new Parser(tokens).parse();
  console.log(JSON.stringify(statements, null, 4));
  interpret(statements);

  process.exit(0);
};
