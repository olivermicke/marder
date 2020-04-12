import { throwScannerError } from './scanner-errors';

import { Keyword, Token, TokenType } from './types';

const isDigit = (char: string): boolean => /[0-9]/.test(char);
const isAlpha = (char: string): boolean => /[a-z_A-Z]/.test(char);
const isAlphaNumeric = (char: string): boolean => isDigit(char) || isAlpha(char);

const keywords: Record<Keyword, TokenType> = {
  and: 'AND',
  class: 'CLASS',
  else: 'ELSE',
  false: 'FALSE',
  for: 'FOR',
  func: 'FUNC',
  if: 'IF',
  nil: 'NIL',
  or: 'OR',
  print: 'PRINT',
  return: 'RETURN',
  super: 'SUPER',
  this: 'THIS',
  true: 'TRUE',
  var: 'VAR',
  while: 'WHILE',
};

export class Scanner {
  private source: string;
  private tokens: Token[] = [];

  private start = 0;
  private current = 0;
  private line = 1;

  constructor(source: string) {
    this.source = source;
  }

  scanTokens = (): Token[] => {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({
      lexeme: '',
      line: this.line,
      literal: null,
      type: 'EOF',
    });

    return this.tokens;
  };

  private scanToken = (): void => {
    const { addToken, advance, identifier, isAtEnd, match, number, peek, string } = this;

    const char: string = advance();
    switch (char) {
      case '(':
        addToken('LEFT_PAREN');
        break;
      case ')':
        addToken('RIGHT_PAREN');
        break;
      case '{':
        addToken('LEFT_BRACE');
        break;
      case '}':
        addToken('RIGHT_BRACE');
        break;
      case ',':
        addToken('COMMA');
        break;
      case '.':
        addToken('DOT');
        break;
      case '+':
        addToken('PLUS');
        break;
      case ';':
        addToken('SEMICOLON');
        break;
      case '*':
        addToken('STAR');
        break;
      case '/':
        if (match('/')) {
          while (peek() !== '\n' && !isAtEnd()) {
            advance();
          }
        } else {
          addToken('SLASH');
        }
        break;
      case '-':
        addToken(match('>') ? 'PIPE' : 'MINUS');
        break;
      case '!':
        addToken(match('=') ? 'BANG_EQUAL' : 'BANG');
        break;
      case '=':
        addToken(match('=') ? 'EQUAL_EQUAL' : 'EQUAL');
        break;
      case '<':
        addToken(match('=') ? 'LESS_EQUAL' : 'LESS');
        break;
      case '>':
        addToken(match('=') ? 'GREATER_EQUAL' : 'GREATER');
        break;
      case ' ':
      case '\r':
      case '\t':
        break;
      case '\n':
        this.line++;
        break;
      case '"':
        string();
        break;
      default:
        if (isDigit(char)) {
          number();
          break;
        } else if (isAlpha(char)) {
          identifier();
          break;
        } else {
          throwScannerError({
            type: 'UNEXPECTED_TOKEN',
            lineNumber: this.line,
            token: char,
          });
          break;
        }
    }
  };

  private isAtEnd = (): boolean => {
    return this.current >= this.source.length;
  };

  private advance = (): string => {
    this.current++;
    return this.source.charAt(this.current - 1);
  };

  private addToken = (type: TokenType, literal?: Token['literal']): void => {
    const text: string = this.source.substring(this.start, this.current);

    this.tokens.push({
      lexeme: text,
      line: this.line,
      literal: literal ?? null,
      type,
    });
  };

  private match = (expected: string): boolean => {
    if (this.isAtEnd()) {
      return false;
    }

    if (this.source.charAt(this.current) !== expected) {
      return false;
    }

    this.current++;
    return true;
  };

  private peek = (): string => {
    if (this.isAtEnd()) {
      return '\0';
    }

    return this.source.charAt(this.current);
  };

  private peekNext = (): string => {
    if (this.current + 1 >= this.source.length) {
      return '\0';
    }

    return this.source.charAt(this.current + 1);
  };

  private string = (): void => {
    const { addToken, advance, isAtEnd, peek } = this;

    while (peek() !== '"' && !isAtEnd()) {
      if (peek() === '\n') this.line++;
      advance();
    }

    if (isAtEnd()) {
      throwScannerError({ type: 'UNTERMINATED_STRING', lineNumber: this.line });
      return;
    }

    advance();

    const value: string = this.source.substring(this.start + 1, this.current - 1);
    addToken('STRING', value);
  };

  private number = (): void => {
    const { addToken, advance, peek, peekNext } = this;

    while (isDigit(peek())) {
      advance();
    }

    if (peek() === '.' && isDigit(peekNext())) {
      advance();

      while (isDigit(peek())) {
        advance();
      }
    }

    addToken('NUMBER', parseFloat(this.source.substring(this.start, this.current)));
  };

  private identifier = (): void => {
    const { addToken, advance, peek } = this;

    while (isAlphaNumeric(peek())) {
      advance();
    }

    const identifier = this.source.substring(this.start, this.current);
    const tokenType: TokenType | undefined = (keywords as any)[identifier];
    if (tokenType) {
      addToken(tokenType);
    } else {
      addToken('IDENTIFIER', identifier);
    }
  };
}
