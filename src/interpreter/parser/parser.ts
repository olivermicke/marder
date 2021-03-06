import { reportError } from '../../utils/report-error';

import {
  BlockExpr,
  Expr,
  ExpressionStmt,
  FuncDefStmt,
  LetMutStmt,
  LetStmt,
  PrintStmt,
  Stmt,
  VariableExpr,
  CallExpr,
} from './types';
import { Token, TokenType } from '../scanner/types';

const EXPECTED_SEMICOLON = 'Expected ";" after expression';

export class Parser {
  private pendingExpr: Expr[] = [];
  private tokens: Token[];

  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse = (): Stmt[] | null => {
    try {
      const { statement, isAtEnd } = this;

      const statements: Stmt[] = [];

      while (!isAtEnd()) {
        statements.push(statement());
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

  private peekNext = (): Token | null => {
    return this.tokens[this.current + 1] ?? null;
  };

  private previous = (): Token | null => {
    return this.tokens[this.current - 1] ?? null;
  };

  private nthPreviousToken = (n: number): Token | null => {
    return this.tokens[this.current - n] ?? null;
  };

  // Statements
  private statement = (): Stmt => {
    const { declaration, match, printStatement } = this;

    if (match('PRINT')) {
      return printStatement();
    }

    return declaration();
  };

  private declaration = (): Stmt => {
    const { functionDeclaration, match, reassignment, variableDeclaration } = this;

    if (match('LET')) {
      if (match('MUT')) {
        return variableDeclaration({ isMutable: true });
      } else {
        return variableDeclaration({ isMutable: false });
      }
    } else if (match('FUNC')) {
      return functionDeclaration();
    }

    return reassignment();
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

  private reassignment = (): Stmt => {
    const { check, consume, expression, expressionStatement, peekNext } = this;

    if (check('IDENTIFIER') && peekNext()?.type === 'EQUAL') {
      const name = consume('IDENTIFIER', 'Expected identifier in reassignment statement');
      consume('EQUAL', 'Expected "=" after reassignment.');
      const expr: Expr = expression();
      consume('SEMICOLON', 'Expected semicolon after reassignment statement.');

      return {
        __kind: 'reassignmentStmt',
        name,
        expression: expr,
      };
    }

    return expressionStatement();
  };

  private functionDeclaration = (): FuncDefStmt => {
    const { blockExpression, consume, expression, match } = this;

    const name: Token = consume('IDENTIFIER', 'Expected function name');
    const parameters: VariableExpr[] = [];

    consume('LEFT_PAREN', 'Expected "("');
    let shouldLoop = true;
    while (shouldLoop) {
      if (match('RIGHT_PAREN')) {
        shouldLoop = false;
      } else {
        const expr: VariableExpr = expression() as VariableExpr;
        parameters.push(expr);
        if (!match('COMMA')) {
          shouldLoop = false;
          consume('RIGHT_PAREN', 'Expected ")"');
        }
      }
    }

    const block = blockExpression();
    if (block === null) {
      reportError('Invalid block expression', { number: name.line, string: `at function "${name.literal}"` });
    }

    consume('SEMICOLON', 'Expected ";" after function declaration');

    return {
      __kind: 'funcDefStmt',
      block,
      name,
      parameters,
    };
  };

  private variableDeclaration = ({ isMutable }: { isMutable: boolean }): LetStmt | LetMutStmt => {
    const { consume, expression, match } = this;

    const name: Token = consume('IDENTIFIER', 'Expected variable name');

    if (!match('EQUAL')) {
      reportError('Expected assignment', { number: name.line, string: `Token: ${name.lexeme}` });
    }

    const initializer = expression();

    consume('SEMICOLON', 'Expected ";" after variable declaration');

    return {
      __kind: isMutable ? 'letMutStmt' : 'letStmt',
      initializer,
      name,
    };
  };

  // Expressions
  private expression = (): Expr => {
    const { block, match, pipe } = this;

    const expr = block();
    if (match('PIPE')) {
      return pipe(expr);
    }
    return expr;
  };

  private block = (): Expr => {
    const { blockExpression, ifExpr } = this;

    const blockExpr = blockExpression();

    return blockExpr === null ? ifExpr() : blockExpr;
  };

  private pipe = (firstExpr: Expr): Expr | never => {
    const { block, match, peek } = this;

    this.pendingExpr.push(firstExpr);

    while (true) {
      const expr: Expr = block();

      if (peek().type === 'SEMICOLON') {
        return expr;
      } else if (match('PIPE')) {
        this.pendingExpr.push(expr);
      } else {
        reportError('Expected ";" or "->"');
      }
    }
  };

  private blockExpression = (): BlockExpr | null => {
    const { match, statement } = this;

    if (!match('LEFT_BRACE')) {
      return null;
    }

    const statements: Stmt[] = [];
    while (!match('RIGHT_BRACE')) {
      statements.push(statement());
    }

    return {
      __kind: 'blockExpr',
      statements,
    };
  };

  private call = (): Expr => {
    const { finishParenCall, match, nthPreviousToken, primary } = this;

    const expr: Expr = primary();

    if (match('LEFT_PAREN')) {
      return finishParenCall(expr);
    } else if (nthPreviousToken(2)?.type === 'PIPE') {
      return {
        __kind: 'callExpr',
        arguments: [this.pendingExpr.pop()],
        callee: expr,
      };
    } else {
      return expr;
    }
  };

  private finishParenCall = (callee: Expr): CallExpr => {
    const { check, consume, expression, match, nthPreviousToken } = this;

    const argsArrays: Expr[][] = [];

    let index = 0;
    let shouldLoop = true;
    while (shouldLoop) {
      argsArrays[index] = [];
      // For example: 10 -> add(20)
      if (nthPreviousToken(3)?.type === 'PIPE') {
        argsArrays[index].push(this.pendingExpr.pop());
      }

      if (!check('RIGHT_PAREN')) {
        do {
          argsArrays[index].push(expression());
        } while (match('COMMA'));
      }

      index++;

      consume('RIGHT_PAREN', 'Expect ")" after arguments.');
      if (!match('LEFT_PAREN')) {
        shouldLoop = false;
      }
    }

    const callExpr = {} as CallExpr;
    let currentNode: CallExpr = callExpr;
    argsArrays.forEach((argsArray, index) => {
      currentNode['__kind'] = 'callExpr';
      currentNode.arguments = argsArray;
      currentNode.callee = {} as CallExpr;

      if (index === argsArrays.length - 1) {
        currentNode.callee = callee;
      } else {
        currentNode = currentNode.callee;
      }
    });

    return callExpr;
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

  private parseBranch = (shouldParseCondition: boolean): { block: BlockExpr; condition: Expr } => {
    const { blockExpression, expression } = this;

    const condition: Expr = shouldParseCondition ? expression() : null;

    const block: BlockExpr = blockExpression();
    if (block === null) {
      reportError('Expected block after condition');
    }
    return { block, condition };
  };

  private parseIfExpr = (): Expr | never => {
    const { match, parseBranch, peek } = this;

    const branches = [];

    let shouldLoop = true;
    while (shouldLoop) {
      branches.push(parseBranch(true));

      if (peek().type === 'SEMICOLON') {
        shouldLoop = false;
      } else if (match('ELSE')) {
        if (!match('IF')) {
          branches.push(parseBranch(false));
          shouldLoop = false;
        }
      } else {
        reportError('Expected ";" or "else" after `if` expression block');
      }
    }

    return {
      __kind: 'ifExpr',
      branches,
    };
  };

  private ifExpr = (): Expr => {
    const { equality, match, parseIfExpr } = this;

    if (match('IF')) {
      return parseIfExpr();
    }
    return equality();
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

  private unary = (): Expr => {
    const { call, match, previous, unary } = this;

    if (match('BANG', 'MINUS')) {
      const operator: Token = previous();
      const right: Expr = unary();
      return {
        __kind: 'unaryExpr',
        operator,
        right,
      };
    }

    return call();
  };

  private primary = (): Expr | never => {
    const { consume, error, expression, match, peek, previous } = this;

    if (match('FALSE')) {
      return {
        __kind: 'literalExpr',
        value: false,
      };
    }
    if (match('TRUE')) {
      return {
        __kind: 'literalExpr',
        value: true,
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
      const name = previous();

      return {
        __kind: 'variableExpr',
        name,
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
}
