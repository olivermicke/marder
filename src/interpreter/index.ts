import { readFileSync } from 'fs';

import { interpret } from './interpreter';
import { Parser } from './parser/parser';
import { Scanner } from './scanner/scanner';

export const runInterpreter = (path: string): never => {
  const fileContent = readFileSync(path, 'utf-8');
  const tokens = new Scanner(fileContent).scanTokens();
  const statements = new Parser(tokens).parse();
  interpret(statements);

  process.exit(0);
};
