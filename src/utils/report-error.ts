type Line = {
  number: number;
  string: string;
};

export const reportError = (message: string, line?: Line): void | never => {
  const isInteractive = process.env.IS_INTERACTIVE === 'true';

  console.log(`Error: ${message}`);

  if (line && !isInteractive) {
    console.log('\n');
    console.log(`[Line: ${line.number}]: ${line.string}`);
  }

  if (!isInteractive) {
    process.exit(1);
  }
};
