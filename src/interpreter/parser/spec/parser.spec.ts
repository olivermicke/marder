import { Parser } from '../parser';

import { Expr, Stmt } from '../types';
import { Token } from '../../scanner/types';

const EOF_TOKEN: Token = { lexeme: 'EOF', line: 1, literal: null, type: 'EOF' };

const COMMA_TOKEN: Token = { lexeme: ',', line: 1, literal: null, type: 'COMMA' };
const SEMICOLON_TOKEN: Token = { lexeme: ';', line: 1, literal: null, type: 'SEMICOLON' };

const LEFT_PAREN_TOKEN: Token = { lexeme: '(', line: 1, literal: null, type: 'LEFT_PAREN' };
const RIGHT_PAREN_TOKEN: Token = { lexeme: ')', line: 1, literal: null, type: 'RIGHT_PAREN' };
const LEFT_BRACE_TOKEN: Token = { lexeme: '{', line: 1, literal: null, type: 'LEFT_BRACE' };
const RIGHT_BRACE_TOKEN: Token = { lexeme: '}', line: 1, literal: null, type: 'RIGHT_BRACE' };

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

  beforeEach(() => {
    jest.clearAllMocks();
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

    describe('block expression', () => {
      const leftBrace: Token = { lexeme: '{', line: 1, literal: null, type: 'LEFT_BRACE' };
      const expression: Token = { lexeme: '3', line: 1, literal: 3, type: 'NUMBER' };
      const rightBrace: Token = { lexeme: '}', line: 1, literal: null, type: 'RIGHT_BRACE' };

      test('works as expected', () => {
        expect(createValidExpression(leftBrace, expression, SEMICOLON_TOKEN, rightBrace, SEMICOLON_TOKEN)).toEqual({
          __kind: 'blockExpr',
          statements: [
            {
              __kind: 'expressionStmt',
              expression: {
                __kind: 'literalExpr',
                value: expression.literal,
              },
            },
          ],
        });
      });
    });

    describe('function call expressions', () => {
      const funcIdentifier: Token = { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' };

      test('without arguments', () => {
        expect(createValidExpression(funcIdentifier, LEFT_PAREN_TOKEN, RIGHT_PAREN_TOKEN)).toEqual({
          __kind: 'funcCallExpr',
          arguments: [],
          name: funcIdentifier,
        });
      });

      test('with one argument', () => {
        const arg: Token = { lexeme: '1', line: 1, literal: 1, type: 'NUMBER' };

        expect(createValidExpression(funcIdentifier, LEFT_PAREN_TOKEN, arg, RIGHT_PAREN_TOKEN)).toEqual({
          __kind: 'funcCallExpr',
          arguments: [
            {
              __kind: 'literalExpr',
              value: 1,
            },
          ],
          name: funcIdentifier,
        });
      });

      test('with multiple arguments', () => {
        const argOne: Token = { lexeme: '1', line: 1, literal: 1, type: 'NUMBER' };
        const argTwo: Token = { lexeme: 'nil', line: 1, literal: null, type: 'NIL' };

        expect(
          createValidExpression(funcIdentifier, LEFT_PAREN_TOKEN, argOne, COMMA_TOKEN, argTwo, RIGHT_PAREN_TOKEN),
        ).toEqual({
          __kind: 'funcCallExpr',
          arguments: [
            {
              __kind: 'literalExpr',
              value: 1,
            },
            {
              __kind: 'literalExpr',
              value: 'nil',
            },
          ],
          name: funcIdentifier,
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

    test('variable expressions', () => {
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

    describe('func definition statement', () => {
      const func: Token = { lexeme: 'func', line: 1, literal: null, type: 'FUNC' };
      const funcIdentifier: Token = { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' };
      const expression: Token = { lexeme: 'Hello world', line: 1, literal: 'Hello world', type: 'STRING' };

      test('without parameters', () => {
        expect(
          createValidStatement(
            func,
            funcIdentifier,
            LEFT_PAREN_TOKEN,
            RIGHT_PAREN_TOKEN,
            LEFT_BRACE_TOKEN,
            expression,
            SEMICOLON_TOKEN,
            RIGHT_BRACE_TOKEN,
          ),
        ).toEqual({
          __kind: 'funcDefStmt',
          block: {
            __kind: 'blockExpr',
            statements: [
              {
                __kind: 'expressionStmt',
                expression: {
                  __kind: 'literalExpr',
                  value: expression.literal,
                },
              },
            ],
          },
          name: funcIdentifier,
          parameters: [],
        });
      });

      test('with one parameter', () => {
        const param: Token = { lexeme: 'x', line: 1, literal: 'x', type: 'IDENTIFIER' };

        expect(
          createValidStatement(
            func,
            funcIdentifier,
            LEFT_PAREN_TOKEN,
            param,
            RIGHT_PAREN_TOKEN,
            LEFT_BRACE_TOKEN,
            expression,
            SEMICOLON_TOKEN,
            RIGHT_BRACE_TOKEN,
          ),
        ).toEqual({
          __kind: 'funcDefStmt',
          block: {
            __kind: 'blockExpr',
            statements: [
              {
                __kind: 'expressionStmt',
                expression: {
                  __kind: 'literalExpr',
                  value: expression.literal,
                },
              },
            ],
          },
          name: funcIdentifier,
          parameters: [
            {
              __kind: 'variableExpr',
              name: param,
            },
          ],
        });
      });

      test('with multiple parameters', () => {
        const paramOne: Token = { lexeme: 'x', line: 1, literal: 'x', type: 'IDENTIFIER' };
        const comma: Token = { lexeme: ',', line: 1, literal: null, type: 'COMMA' };
        const paramTwo: Token = { lexeme: 'y', line: 1, literal: 'y', type: 'IDENTIFIER' };

        expect(
          createValidStatement(
            func,
            funcIdentifier,
            LEFT_PAREN_TOKEN,
            paramOne,
            comma,
            paramTwo,
            RIGHT_PAREN_TOKEN,
            LEFT_BRACE_TOKEN,
            expression,
            SEMICOLON_TOKEN,
            RIGHT_BRACE_TOKEN,
          ),
        ).toEqual({
          __kind: 'funcDefStmt',
          block: {
            __kind: 'blockExpr',
            statements: [
              {
                __kind: 'expressionStmt',
                expression: {
                  __kind: 'literalExpr',
                  value: expression.literal,
                },
              },
            ],
          },
          name: funcIdentifier,
          parameters: [
            {
              __kind: 'variableExpr',
              name: paramOne,
            },
            {
              __kind: 'variableExpr',
              name: paramTwo,
            },
          ],
        });
      });
    });

    test('let statement', () => {
      const letToken: Token = { lexeme: 'let', line: 1, literal: null, type: 'LET' };
      const identifier: Token = { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' };
      const equal: Token = { lexeme: '=', line: 1, literal: null, type: 'EQUAL' };
      const expression: Token = { lexeme: 'success', line: 1, literal: 'success', type: 'STRING' };

      expect(createValidStatement(letToken, identifier, equal, expression)).toEqual({
        __kind: 'letStmt',
        name: identifier,
        initializer: {
          __kind: 'literalExpr',
          value: expression.literal,
        },
      });
    });

    test('let mut statement', () => {
      const letToken: Token = { lexeme: 'let', line: 1, literal: null, type: 'LET' };
      const mutToken: Token = { lexeme: 'mut', line: 1, literal: null, type: 'MUT' };
      const identifier: Token = { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' };
      const equal: Token = { lexeme: '=', line: 1, literal: null, type: 'EQUAL' };
      const expression: Token = { lexeme: 'success', line: 1, literal: 'success', type: 'STRING' };

      expect(createValidStatement(letToken, mutToken, identifier, equal, expression)).toEqual({
        __kind: 'letMutStmt',
        name: identifier,
        initializer: {
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

    test('reassignment statement', () => {
      const identifierToken: Token = { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' };
      const equalToken: Token = { lexeme: '=', line: 1, literal: null, type: 'EQUAL' };
      const expressionToken: Token = { lexeme: 'bar', line: 1, literal: 'bar', type: 'STRING' };

      expect(createValidStatement(identifierToken, equalToken, expressionToken)).toEqual({
        __kind: 'reassignmentStmt',
        expression: {
          __kind: 'literalExpr',
          value: expressionToken.literal,
        },
        name: identifierToken,
      });
    });
  });
});
