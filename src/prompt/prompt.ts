import readline from 'readline';

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

    console.log(new Scanner(input).scanTokens());
    read();
  });
};

export const runPrompt = (): void => {
  read();
};
