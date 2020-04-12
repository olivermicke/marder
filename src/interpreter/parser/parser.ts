import { reportError } from '../../utils/report-error';

import { Expr, ExpressionStmt, PrintStmt, Stmt, VarStmt } from './types';
import { Token, TokenType } from '../scanner/types';

const EXPECTED_SEMICOLON = 'Expected ";" after expression';

export class Parser {
  private tokens: Token[];

  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse = (): Stmt[] | null => {
    try {
      const { declaration, isAtEnd } = this;

      const statements: Stmt[] = [];

      while (!isAtEnd()) {
        statements.push(declaration());
      }

      return statements;
    } catch (_error) {
      return null;
    }
  };

  // Helpers
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
      reportError(`${message} at end of file.`, null);
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

    for (const type of types) {
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

  // Expressions
  private expression = (): Expr => {
    const { equality } = this;

    return equality();
  };

  private addition = (): Expr => {
    const { match, multiplication, previous } = this;

    let expr: Expr = multiplication();

    while (match('MINUS', 'PLUS')) {
      const operator: Token = previous();
      const right: Expr = multiplication();
      expr = {
        __kind: 'binaryExpr',
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

    while (match('AND', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL', 'OR')) {
      const operator: Token = previous();
      const right: Expr = addition();
      expr = { __kind: 'binaryExpr', left: expr, operator, right };
    }

    return expr;
  };

  private equality = (): Expr => {
    const { comparison, match, previous } = this;

    let expr: Expr = comparison();

    while (match('BANG_EQUAL', 'EQUAL_EQUAL')) {
      const operator: Token = previous();
      const right: Expr = comparison();
      expr = { __kind: 'binaryExpr', left: expr, operator, right };
    }

    return expr;
  };

  private multiplication = (): Expr => {
    const { match, previous, unary } = this;

    let expr: Expr = unary();

    while (match('SLASH', 'STAR')) {
      const operator: Token = previous();
      const right: Expr = unary();
      expr = {
        __kind: 'binaryExpr',
        left: expr,
        operator,
        right,
      };
    }

    return expr;
  };

  private primary = (): Expr | never => {
    const { consume, error, expression, match, peek, previous } = this;

    if (match('FALSE')) {
      return {
        __kind: 'literalExpr',
        value: 'false',
      };
    }
    if (match('TRUE')) {
      return {
        __kind: 'literalExpr',
        value: 'true',
      };
    }
    if (match('NIL')) {
      return {
        __kind: 'literalExpr',
        value: 'nil',
      };
    }

    if (match('NUMBER', 'STRING')) {
      return {
        __kind: 'literalExpr',
        value: previous().literal,
      };
    }

    if (match('IDENTIFIER')) {
      return {
        __kind: 'variableExpr',
        name: previous(),
      };
    }

    if (match('LEFT_PAREN')) {
      const expr: Expr = expression();
      consume('RIGHT_PAREN', 'Expected ")" after expression');
      return {
        __kind: 'groupingExpr',
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
        __kind: 'unaryExpr',
        operator,
        right,
      };
    }

    return primary();
  };

  // Statements
  private statement = (): Stmt => {
    const { expressionStatement, match, printStatement } = this;

    if (match('PRINT')) {
      return printStatement();
    }

    return expressionStatement();
  };

  private declaration = (): Stmt | null => {
    const { match, statement, varDeclaration } = this;

    if (match('VAR')) {
      return varDeclaration();
    }

    return statement();
  };

  private expressionStatement = (): ExpressionStmt => {
    const { consume, expression } = this;

    const expr: Expr = expression();
    consume('SEMICOLON', EXPECTED_SEMICOLON);

    return {
      __kind: 'expressionStmt',
      expression: expr,
    };
  };

  private printStatement = (): PrintStmt => {
    const { consume, expression } = this;

    const expr: Expr = expression();
    consume('SEMICOLON', EXPECTED_SEMICOLON);

    return {
      __kind: 'printStmt',
      expression: expr,
    };
  };

  private varDeclaration = (): VarStmt => {
    const { consume, expression, match } = this;

    const name: Token = consume('IDENTIFIER', 'Expected variable name');

    if (!match('EQUAL')) {
      reportError('Expected assignment', { number: name.line, string: `Token: ${name.lexeme}` });
    }

    const initializer = expression();

    consume('SEMICOLON', 'Expected ";" after variable declaration');

    return {
      __kind: 'varStmt',
      initializer,
      name,
    };
  };
}
