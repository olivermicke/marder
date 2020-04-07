export const reportError = (message: string, exitCode: number): never => {
  console.log(message);
  process.exit(exitCode);
};
