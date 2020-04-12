import { Parser } from '../parser';

import { Expr, Stmt } from '../types';
import { Token } from '../../scanner/types';

const EOF_TOKEN: Token = { lexeme: 'EOF', line: 1, literal: null, type: 'EOF' };
const SEMICOLON_TOKEN: Token = { lexeme: ';', line: 1, literal: null, type: 'SEMICOLON' };

let consoleSpy: jest.SpyInstance;
let processSpy: jest.SpyInstance;

const consoleLogMock = jest.fn();
const processExitMock = jest.fn();

const createValidStatement = (...tokens: Token[]): Stmt =>
  new Parser([...tokens, SEMICOLON_TOKEN, EOF_TOKEN]).parse()[0];
const createValidExpression = (...tokens: Token[]): Expr =>
  (createValidStatement(...tokens) as { __kind: any; expression: Expr }).expression;

describe('parser', () => {
  beforeAll(() => {
    // @ts-ignore
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(consoleLogMock);
    // @ts-ignore
    processSpy = jest.spyOn(process, 'exit').mockImplementation(processExitMock);
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    processSpy.mockRestore();
  });

  test('creates correct AST', () => {
    const expression = createValidExpression(
      { lexeme: '(', line: 1, literal: null, type: 'LEFT_PAREN' },
      { lexeme: '-', line: 1, literal: null, type: 'MINUS' },
      { lexeme: '1', line: 1, literal: 1, type: 'NUMBER' },
      { lexeme: '+', line: 1, literal: null, type: 'PLUS' },
      { lexeme: '2', line: 1, literal: 2, type: 'NUMBER' },
      { lexeme: '*', line: 1, literal: null, type: 'STAR' },
      { lexeme: '2', line: 1, literal: 2, type: 'NUMBER' },
      { lexeme: '==', line: 1, literal: null, type: 'EQUAL_EQUAL' },
      { lexeme: '3', line: 1, literal: 3, type: 'NUMBER' },
      { lexeme: ')', line: 1, literal: null, type: 'RIGHT_PAREN' },
      { lexeme: '==', line: 1, literal: null, type: 'EQUAL_EQUAL' },
      { lexeme: '(', line: 1, literal: null, type: 'LEFT_PAREN' },
      { lexeme: 'nil', line: 1, literal: 'nil', type: 'NIL' },
      { lexeme: '!=', line: 1, literal: null, type: 'BANG_EQUAL' },
      { lexeme: 'true', line: 1, literal: 'true', type: 'TRUE' },
      { lexeme: ')', line: 1, literal: null, type: 'RIGHT_PAREN' },
    );

    expect(expression).toEqual({
      __kind: 'binaryExpr',
      left: {
        __kind: 'groupingExpr',
        expression: {
          __kind: 'binaryExpr',
          left: {
            __kind: 'binaryExpr',
            left: {
              __kind: 'unaryExpr',
              operator: { lexeme: '-', line: 1, literal: null, type: 'MINUS' },
              right: {
                __kind: 'literalExpr',
                value: 1,
              },
            },
            operator: {
              lexeme: '+',
              line: 1,
              literal: null,
              type: 'PLUS',
            },
            right: {
              __kind: 'binaryExpr',
              left: {
                __kind: 'literalExpr',
                value: 2,
              },
              operator: {
                lexeme: '*',
                line: 1,
                literal: null,
                type: 'STAR',
              },
              right: {
                __kind: 'literalExpr',
                value: 2,
              },
            },
          },
          operator: { lexeme: '==', line: 1, literal: null, type: 'EQUAL_EQUAL' },
          right: {
            __kind: 'literalExpr',
            value: 3,
          },
        },
      },
      operator: {
        lexeme: '==',
        line: 1,
        literal: null,
        type: 'EQUAL_EQUAL',
      },
      right: {
        __kind: 'groupingExpr',
        expression: {
          __kind: 'binaryExpr',
          left: {
            __kind: 'literalExpr',
            value: 'nil',
          },
          operator: {
            lexeme: '!=',
            line: 1,
            literal: null,
            type: 'BANG_EQUAL',
          },
          right: {
            __kind: 'literalExpr',
            value: 'true',
          },
        },
      },
    });
  });

  test('throws error on missing semicolon', () => {
    const statements = new Parser([{ lexeme: '3', line: 1, literal: 3, type: 'NUMBER' }, EOF_TOKEN]).parse();

    expect(statements).toEqual(null);
    expect(processExitMock).toBeCalledWith(1);
  });

  describe('expressions', () => {
    describe('binary expressions', () => {
      test.each`
        lexeme   | type
        ${'and'} | ${'AND'}
        ${'!='}  | ${'BANG_EQUAL'}
        ${'=='}  | ${'EQUAL_EQUAL'}
        ${'>'}   | ${'GREATER'}
        ${'>='}  | ${'GREATER_EQUAL'}
        ${'<'}   | ${'LESS'}
        ${'<='}  | ${'LESS_EQUAL'}
        ${'-'}   | ${'MINUS'}
        ${'or'}  | ${'OR'}
        ${'+'}   | ${'PLUS'}
        ${'/'}   | ${'SLASH'}
        ${'*'}   | ${'STAR'}
      `('parses binary expressions of lexeme "$lexeme"', ({ lexeme, type }) => {
        const left: Token = { lexeme: '2', line: 1, literal: 2, type: 'NUMBER' };
        const operator: Token = { lexeme, line: 1, literal: null, type };
        const right: Token = { lexeme: '2', line: 1, literal: 2, type: 'NUMBER' };

        expect(createValidExpression(left, operator, right)).toEqual({
          __kind: 'binaryExpr',
          left: {
            __kind: 'literalExpr',
            value: left.literal,
          },
          operator: {
            lexeme,
            line: 1,
            literal: null,
            type,
          },
          right: {
            __kind: 'literalExpr',
            value: right.literal,
          },
        });
      });
    });

    describe('grouping expressions', () => {
      it('wrap an expression', () => {
        expect(
          createValidExpression(
            { lexeme: '(', line: 1, literal: null, type: 'LEFT_PAREN' },
            { lexeme: '2', line: 1, literal: 2, type: 'NUMBER' },
            { lexeme: ')', line: 1, literal: null, type: 'RIGHT_PAREN' },
          ),
        ).toEqual({
          __kind: 'groupingExpr',
          expression: {
            __kind: 'literalExpr',
            value: 2,
          },
        });
      });

      it('throw an error when no valid expression', () => {
        const statements = new Parser([
          { lexeme: '(', line: 1, literal: null, type: 'LEFT_PAREN' },
          SEMICOLON_TOKEN,
          EOF_TOKEN,
        ]).parse();

        expect(statements).toEqual(null);
        expect(processExitMock).toBeCalledWith(1);
      });
    });

    describe('literal expressions', () => {
      test.each`
        lexeme     | literal  | type        | expected
        ${'1'}     | ${1}     | ${'NUMBER'} | ${1}
        ${'foo'}   | ${'foo'} | ${'STRING'} | ${'foo'}
        ${'false'} | ${null}  | ${'FALSE'}  | ${'false'}
        ${'true'}  | ${null}  | ${'TRUE'}   | ${'true'}
        ${'nil'}   | ${null}  | ${'NIL'}    | ${'nil'}
      `('parses literal of lexeme "$lexeme"', ({ lexeme, literal, type, expected }) => {
        const expression = { lexeme, line: 1, literal, type };

        expect(createValidExpression(expression)).toEqual({
          __kind: 'literalExpr',
          value: expected,
        });
      });
    });

    describe('variable expressions', () => {
      const expression: Token = { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' };
      expect(createValidExpression(expression)).toEqual({
        __kind: 'variableExpr',
        name: expression,
      });
    });

    describe('unary expressions', () => {
      test.each`
        lexeme | type
        ${'!'} | ${'BANG'}
        ${'-'} | ${'MINUS'}
      `('parses unary expressions of lexeme "$lexeme"', ({ lexeme, type }) => {
        const operator: Token = { lexeme, line: 1, literal: null, type };
        const right: Token = { lexeme: '2', line: 1, literal: 2, type: 'NUMBER' };

        expect(createValidExpression(operator, right)).toEqual({
          __kind: 'unaryExpr',
          operator,
          right: {
            __kind: 'literalExpr',
            value: right.literal,
          },
        });
      });
    });
  });

  describe('statements', () => {
    test('expression statement', () => {
      const expression: Token = { lexeme: 'Hello, world!', line: 1, literal: 'Hello, world!', type: 'STRING' };

      expect(createValidStatement(expression)).toEqual({
        __kind: 'expressionStmt',
        expression: {
          __kind: 'literalExpr',
          value: expression.literal,
        },
      });
    });

    describe('print statement', () => {
      const printToken: Token = { lexeme: 'print', line: 1, literal: null, type: 'PRINT' };

      test('works correctly', () => {
        const expressionToken: Token = { lexeme: 'Hello, world!', line: 1, literal: 'Hello, world!', type: 'STRING' };

        expect(createValidStatement(printToken, expressionToken)).toEqual({
          __kind: 'printStmt',
          expression: {
            __kind: 'literalExpr',
            value: expressionToken.literal,
          },
        });
      });

      test('throws error when missing expression', () => {
        new Parser([printToken, SEMICOLON_TOKEN, EOF_TOKEN]).parse();
        expect(processExitMock).toBeCalledWith(1);
      });
    });
  });

  test('var statement', () => {
    const varToken: Token = { lexeme: 'var', line: 1, literal: null, type: 'VAR' };
    const identifier: Token = { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' };
    const equal: Token = { lexeme: '=', line: 1, literal: null, type: 'EQUAL' };
    const expression: Token = { lexeme: 'success', line: 1, literal: 'success', type: 'STRING' };

    expect(createValidStatement(varToken, identifier, equal, expression)).toEqual({
      __kind: 'varStmt',
      name: identifier,
      initializer: {
        __kind: 'literalExpr',
        value: expression.literal,
      },
    });
  });
});
