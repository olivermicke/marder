import readline from 'readline';

import { interpret } from '../interpreter/interpreter';
import { Parser } from '../interpreter/parser/parser';
import { Scanner } from '../interpreter/scanner/scanner';

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
      const statements = new Parser(tokens).parse();
      interpret(statements);
    } catch (e) {
      console.log(e);
    }

    read();
  });
};

export const runPrompt = (): void => {
  read();
};
