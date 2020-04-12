import { reportError } from '../../utils/report-error';

import { Expr, LiteralExpr, GroupingExpr } from './types';
import { Token, TokenType } from '../scanner/types';

export class Parser {
  private tokens: Token[];

  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse = (): Expr | null => {
    const { expression } = this;

    try {
      return expression();
    } catch (_error) {
      return null;
    }
  };

  private advance = (): Token => {
    const { isAtEnd, previous } = this;

    if (!isAtEnd()) {
      this.current++;
    }
    return previous();
  };

  private check = (type: TokenType): boolean => {
    const { isAtEnd, peek } = this;

    if (isAtEnd()) {
      return false;
    }

    return peek().type === type;
  };

  private consume = (type: TokenType, message: string): Token | never => {
    const { advance, check, error, peek } = this;

    if (check(type)) {
      return advance();
    }

    throw error(peek(), message);
  };

  private error = (token: Token, message: string): void => {
    if (token.type === 'EOF') {
      reportError(`${message} at end of file.`);
    } else {
      reportError(message, { number: token.line, string: `at token "${token.lexeme}"` });
    }
  };

  private isAtEnd = (): boolean => {
    const { peek } = this;

    return peek().type === 'EOF';
  };

  private match = (...types: TokenType[]): boolean => {
    const { advance, check } = this;

    for (let type of types) {
      if (check(type)) {
        advance();
        return true;
      }
    }

    return false;
  };

  private peek = (): Token => {
    return this.tokens[this.current];
  };

  private previous = (): Token => {
    return this.tokens[this.current - 1];
  };

  private addition = (): Expr => {
    const { match, multiplication, previous } = this;

    let expr: Expr = multiplication();

    while (match('MINUS', 'PLUS')) {
      const operator: Token = previous();
      const right: Expr = multiplication();
      expr = {
        __kind: 'binary',
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  };

  private comparison = (): Expr => {
    const { addition, match, previous } = this;

    let expr: Expr = addition();

    while (match('GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL')) {
      const operator: Token = previous();
      const right: Expr = addition();
      expr = { __kind: 'binary', left: expr, operator, right };
    }

    return expr;
  };

  private equality = (): Expr => {
    const { comparison, match, previous } = this;

    let expr: Expr = comparison();

    while (match('BANG_EQUAL', 'EQUAL_EQUAL')) {
      const operator: Token = previous();
      const right: Expr = comparison();
      expr = { __kind: 'binary', left: expr, operator, right };
    }

    return expr;
  };

  private expression = (): Expr => {
    const { equality } = this;

    return equality();
  };

  private multiplication = (): Expr => {
    const { match, previous, unary } = this;

    let expr: Expr = unary();

    while (match('SLASH', 'STAR')) {
      const operator: Token = previous();
      const right: Expr = unary();
      expr = {
        __kind: 'binary',
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  };

  private primary = (): GroupingExpr | LiteralExpr | never => {
    const { consume, error, expression, match, peek, previous } = this;

    if (match('FALSE')) {
      return {
        __kind: 'literal',
        value: 'false',
      };
    }
    if (match('TRUE')) {
      return {
        __kind: 'literal',
        value: 'true',
      };
    }
    if (match('NIL')) {
      return {
        __kind: 'literal',
        value: 'nil',
      };
    }

    if (match('NUMBER', 'STRING')) {
      return {
        __kind: 'literal',
        value: previous().literal,
      };
    }

    if (match('LEFT_PAREN')) {
      const expr: Expr = expression();
      consume('RIGHT_PAREN', 'Expected ")" after expression.');
      return {
        __kind: 'grouping',
        expression: expr,
      };
    }

    error(peek(), 'Expected expression');
  };

  private unary = (): Expr => {
    const { match, previous, primary, unary } = this;

    if (match('BANG', 'MINUS')) {
      const operator: Token = previous();
      const right: Expr = unary();
      return {
        __kind: 'unary',
        operator,
        right,
      };
    }

    return primary();
  };
}
