import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const read = (): void => {
  rl.question('> ', function (input: string) {
    if (input === 'exit') {
      return rl.close();
    }

    console.log(input);
    read();
  });
};

export const runPrompt = (): void => {
  read();
};
