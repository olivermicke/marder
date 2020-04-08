import { Line, reportError } from '../../utils/report-error';

type ScannerErrors =
  | { type: 'UNEXPECTED_TOKEN'; lineNumber: number; token: string }
  | { type: 'UNTERMINATED_STRING'; lineNumber: number };

export const throwScannerError = (error: ScannerErrors): void => {
  let errorMessage: string;

  switch (error.type) {
    case 'UNEXPECTED_TOKEN':
      errorMessage = `Unexpected token "${error.token}"`;
      break;
    case 'UNTERMINATED_STRING':
      errorMessage = 'Unterminated string';
      break;
  }

  const line: Line | null = error.lineNumber
    ? {
        number: error.lineNumber,
        string: 'show line here. to be implemented.',
      }
    : null;

  reportError(errorMessage, line);
};
