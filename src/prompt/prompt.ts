import readline from 'readline';

import { printAST } from '../compiler/parser/ast-printer';
import { Parser } from '../compiler/parser/parser';
import { Scanner } from '../compiler/scanner/scanner';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const read = (): void => {
  rl.question('> ', function (input: string) {
    if (input === 'exit') {
      return rl.close();
    }

    try {
      const tokens = new Scanner(input).scanTokens();
      console.log(printAST(new Parser(tokens).parse()));
    } catch (e) {
      console.log(e);
    }

    read();
  });
};

export const runPrompt = (): void => {
  read();
};
