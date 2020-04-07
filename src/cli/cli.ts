import { extname, resolve } from 'path';

import { throwCLIError } from './cli-errors';
import { compile } from '../compiler/compiler';
import { runPrompt } from '../prompt/prompt';

export const runCLI = (): void => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    process.env.IS_INTERACTIVE = 'true';

    runPrompt();
  } else if (args.length === 1) {
    process.env.IS_INTERACTIVE = 'false';

    const filePath = resolve(args[0]);

    if (extname(filePath) !== '.mad') {
      throwCLIError({ type: 'INVALID_FILE_EXTENSION' });
    }

    try {
      compile(args[0]);
    } catch (error) {
      switch (error.code) {
        case 'EACCES': {
          throwCLIError({ type: 'FILE_MISSING_PERMISSIONS', filePath });
          break;
        }
        case 'ENOENT': {
          throwCLIError({ type: 'FILE_NOT_FOUND', filePath });
          break;
        }
        default:
          throw error;
      }
    }
  } else {
    throwCLIError({ type: 'TOO_MANY_ARGS' });
  }
};
