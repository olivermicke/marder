import { reportError } from '../utils/report-error';

type CLIErrors =
  | { type: 'FILE_MISSING_PERMISSIONS'; filePath: string }
  | { type: 'FILE_NOT_FOUND'; filePath: string }
  | { type: 'INVALID_FILE_EXTENSION' }
  | { type: 'TOO_MANY_ARGS' };

export const throwCLIError = (error: CLIErrors): void => {
  let errorMessage: string;

  switch (error.type) {
    case 'FILE_MISSING_PERMISSIONS':
      errorMessage = `Unauthorized to read file at path ${error.filePath}`;
      break;
    case 'FILE_NOT_FOUND':
      errorMessage = `File not found at ${error.filePath}`;
      break;
    case 'INVALID_FILE_EXTENSION':
      errorMessage = "Wrong file extension. Expected '.mad'";
      break;
    case 'TOO_MANY_ARGS':
      errorMessage = 'Invalid number of arguments';
      break;
  }

  reportError(errorMessage);
};
