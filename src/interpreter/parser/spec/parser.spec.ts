import { Parser } from '../parser';

import { BlockExpr, Expr, Stmt } from '../types';
import { Token } from '../../scanner/types';

const EOF_TOKEN: Token = { lexeme: 'EOF', line: 1, literal: null, type: 'EOF' };

const COMMA_TOKEN: Token = { lexeme: ',', line: 1, literal: null, type: 'COMMA' };
const SEMICOLON_TOKEN: Token = { lexeme: ';', line: 1, literal: null, type: 'SEMICOLON' };

const LEFT_PAREN_TOKEN: Token = { lexeme: '(', line: 1, literal: null, type: 'LEFT_PAREN' };
const RIGHT_PAREN_TOKEN: Token = { lexeme: ')', line: 1, literal: null, type: 'RIGHT_PAREN' };
const LEFT_BRACE_TOKEN: Token = { lexeme: '{', line: 1, literal: null, type: 'LEFT_BRACE' };
const RIGHT_BRACE_TOKEN: Token = { lexeme: '}', line: 1, literal: null, type: 'RIGHT_BRACE' };
const PIPE_TOKEN: Token = { lexeme: '->', line: 1, literal: null, type: 'PIPE' };

const IF_TOKEN: Token = { lexeme: 'if', line: 1, literal: null, type: 'IF' };
const ELSE_TOKEN: Token = { lexeme: 'else', line: 1, literal: null, type: 'ELSE' };

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

  test('binding func to variable', () => {
    const tokens: Token[] = [
      {
        lexeme: 'func',
        line: 1,
        literal: null,
        type: 'FUNC',
      },
      {
        lexeme: 'double',
        line: 1,
        literal: 'double',
        type: 'IDENTIFIER',
      },
      {
        lexeme: '(',
        line: 1,
        literal: null,
        type: 'LEFT_PAREN',
      },
      {
        lexeme: 'n',
        line: 1,
        literal: 'n',
        type: 'IDENTIFIER',
      },
      {
        lexeme: ')',
        line: 1,
        literal: null,
        type: 'RIGHT_PAREN',
      },
      {
        lexeme: '{',
        line: 1,
        literal: null,
        type: 'LEFT_BRACE',
      },
      {
        lexeme: 'n',
        line: 2,
        literal: 'n',
        type: 'IDENTIFIER',
      },
      {
        lexeme: '*',
        line: 2,
        literal: null,
        type: 'STAR',
      },
      {
        lexeme: '2',
        line: 2,
        literal: 2,
        type: 'NUMBER',
      },
      {
        lexeme: ';',
        line: 2,
        literal: null,
        type: 'SEMICOLON',
      },
      {
        lexeme: '}',
        line: 3,
        literal: null,
        type: 'RIGHT_BRACE',
      },
      {
        lexeme: ';',
        line: 3,
        literal: null,
        type: 'SEMICOLON',
      },
      {
        lexeme: 'let',
        line: 5,
        literal: null,
        type: 'LET',
      },
      {
        lexeme: 'd',
        line: 5,
        literal: 'd',
        type: 'IDENTIFIER',
      },
      {
        lexeme: '=',
        line: 5,
        literal: null,
        type: 'EQUAL',
      },
      {
        lexeme: 'double',
        line: 5,
        literal: 'double',
        type: 'IDENTIFIER',
      },
      {
        lexeme: ';',
        line: 5,
        literal: null,
        type: 'SEMICOLON',
      },
      {
        lexeme: 'print',
        line: 6,
        literal: null,
        type: 'PRINT',
      },
      {
        lexeme: 'd',
        line: 6,
        literal: 'd',
        type: 'IDENTIFIER',
      },
      {
        lexeme: '(',
        line: 6,
        literal: null,
        type: 'LEFT_PAREN',
      },
      {
        lexeme: '3',
        line: 6,
        literal: 3,
        type: 'NUMBER',
      },
      {
        lexeme: ')',
        line: 6,
        literal: null,
        type: 'RIGHT_PAREN',
      },
      {
        lexeme: ';',
        line: 6,
        literal: null,
        type: 'SEMICOLON',
      },
      {
        lexeme: '',
        line: 7,
        literal: null,
        type: 'EOF',
      },
    ];
    new Parser(tokens).parse();
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
            value: true,
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

      describe('calls with parens', () => {
        test('without arguments', () => {
          expect(createValidExpression(funcIdentifier, LEFT_PAREN_TOKEN, RIGHT_PAREN_TOKEN)).toEqual({
            __kind: 'callExpr',
            arguments: [],
            callee: {
              __kind: 'variableExpr',
              name: funcIdentifier,
            },
          });
        });

        test('with one argument', () => {
          const arg: Token = { lexeme: '1', line: 1, literal: 1, type: 'NUMBER' };

          expect(createValidExpression(funcIdentifier, LEFT_PAREN_TOKEN, arg, RIGHT_PAREN_TOKEN)).toEqual({
            __kind: 'callExpr',
            arguments: [
              {
                __kind: 'literalExpr',
                value: 1,
              },
            ],
            callee: {
              __kind: 'variableExpr',
              name: funcIdentifier,
            },
          });
        });

        test('with multiple arguments', () => {
          const argOne: Token = { lexeme: '1', line: 1, literal: 1, type: 'NUMBER' };
          const argTwo: Token = { lexeme: 'nil', line: 1, literal: null, type: 'NIL' };

          expect(
            createValidExpression(funcIdentifier, LEFT_PAREN_TOKEN, argOne, COMMA_TOKEN, argTwo, RIGHT_PAREN_TOKEN),
          ).toEqual({
            __kind: 'callExpr',
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
            callee: {
              __kind: 'variableExpr',
              name: funcIdentifier,
            },
          });
        });

        test('on callee', () => {
          const tokenOne: Token = { lexeme: 'one', line: 1, literal: 'one', type: 'IDENTIFIER' };
          const tokenTwo: Token = { lexeme: 'two', line: 1, literal: 'two', type: 'IDENTIFIER' };

          expect(
            createValidExpression(
              funcIdentifier,
              LEFT_PAREN_TOKEN,
              tokenOne,
              RIGHT_PAREN_TOKEN,
              LEFT_PAREN_TOKEN,
              tokenTwo,
              RIGHT_PAREN_TOKEN,
            ),
          ).toEqual({
            __kind: 'callExpr',
            arguments: [
              {
                __kind: 'variableExpr',
                name: tokenOne,
              },
            ],
            callee: {
              __kind: 'callExpr',
              arguments: [
                {
                  __kind: 'variableExpr',
                  name: tokenTwo,
                },
              ],
              callee: {
                __kind: 'variableExpr',
                name: funcIdentifier,
              },
            },
          });
        });
      });

      describe('calls with pipe', () => {
        describe('one arg', () => {
          test('single pipe', () => {
            const arg: Token = { lexeme: '3', line: 1, literal: 3, type: 'NUMBER' };

            expect(createValidExpression(arg, PIPE_TOKEN, funcIdentifier)).toEqual({
              __kind: 'callExpr',
              arguments: [{ __kind: 'literalExpr', value: 3 }],
              callee: {
                __kind: 'variableExpr',
                name: funcIdentifier,
              },
            });
          });

          test('double pipe', () => {
            const double: Token = { lexeme: 'double', line: 1, literal: 'double', type: 'IDENTIFIER' };
            const addTwo: Token = { lexeme: 'add_two', line: 1, literal: 'add_two', type: 'IDENTIFIER' };

            const arg: Token = { lexeme: '3', line: 1, literal: 3, type: 'NUMBER' };

            expect(createValidExpression(arg, PIPE_TOKEN, double, PIPE_TOKEN, addTwo)).toEqual({
              __kind: 'callExpr',
              arguments: [
                {
                  __kind: 'callExpr',
                  arguments: [{ __kind: 'literalExpr', value: arg.literal }],
                  callee: {
                    __kind: 'variableExpr',
                    name: double,
                  },
                },
              ],
              callee: {
                __kind: 'variableExpr',
                name: addTwo,
              },
            });
          });

          test('triple pipe', () => {
            const double: Token = { lexeme: 'double', line: 1, literal: 'double', type: 'IDENTIFIER' };
            const addTwo: Token = { lexeme: 'add_two', line: 1, literal: 'add_two', type: 'IDENTIFIER' };
            const triple: Token = { lexeme: 'triple', line: 1, literal: 'triple', type: 'IDENTIFIER' };

            const arg: Token = { lexeme: '3', line: 1, literal: 3, type: 'NUMBER' };

            expect(createValidExpression(arg, PIPE_TOKEN, double, PIPE_TOKEN, addTwo, PIPE_TOKEN, triple)).toEqual({
              __kind: 'callExpr',
              arguments: [
                {
                  __kind: 'callExpr',
                  arguments: [
                    {
                      __kind: 'callExpr',
                      arguments: [{ __kind: 'literalExpr', value: arg.literal }],
                      callee: {
                        __kind: 'variableExpr',
                        name: double,
                      },
                    },
                  ],
                  callee: {
                    __kind: 'variableExpr',
                    name: addTwo,
                  },
                },
              ],
              callee: {
                __kind: 'variableExpr',
                name: triple,
              },
            });
          });
        });

        describe('two args', () => {
          test('single pipe', () => {
            const argOne: Token = { lexeme: '1', line: 1, literal: 1, type: 'NUMBER' };
            const argTwo: Token = { lexeme: '2', line: 1, literal: 2, type: 'NUMBER' };
            const add: Token = { lexeme: 'add', line: 1, literal: 'add', type: 'IDENTIFIER' };

            expect(createValidExpression(argTwo, PIPE_TOKEN, add, LEFT_PAREN_TOKEN, argOne, RIGHT_PAREN_TOKEN)).toEqual(
              {
                __kind: 'callExpr',
                arguments: [
                  { __kind: 'literalExpr', value: 2 },
                  { __kind: 'literalExpr', value: 1 },
                ],
                callee: {
                  __kind: 'variableExpr',
                  name: { lexeme: 'add', line: 1, literal: 'add', type: 'IDENTIFIER' },
                },
              },
            );
          });

          test('double pipe', () => {
            const argOne: Token = { lexeme: '1', line: 1, literal: 1, type: 'NUMBER' };
            const argTwo: Token = { lexeme: '2', line: 1, literal: 2, type: 'NUMBER' };
            const argThree: Token = { lexeme: '3', line: 1, literal: 3, type: 'NUMBER' };
            const add: Token = { lexeme: 'add', line: 1, literal: 'add', type: 'IDENTIFIER' };
            const mult: Token = { lexeme: 'mult', line: 1, literal: 'mult', type: 'IDENTIFIER' };

            expect(
              createValidExpression(
                argThree,
                PIPE_TOKEN,
                add,
                LEFT_PAREN_TOKEN,
                argTwo,
                RIGHT_PAREN_TOKEN,
                PIPE_TOKEN,
                mult,
                LEFT_PAREN_TOKEN,
                argOne,
                RIGHT_PAREN_TOKEN,
              ),
            ).toEqual({
              __kind: 'callExpr',
              arguments: [
                {
                  __kind: 'callExpr',
                  arguments: [
                    { __kind: 'literalExpr', value: 3 },
                    { __kind: 'literalExpr', value: 2 },
                  ],
                  callee: {
                    __kind: 'variableExpr',
                    name: { lexeme: 'add', line: 1, literal: 'add', type: 'IDENTIFIER' },
                  },
                },
                { __kind: 'literalExpr', value: 1 },
              ],
              callee: {
                __kind: 'variableExpr',
                name: { lexeme: 'mult', line: 1, literal: 'mult', type: 'IDENTIFIER' },
              },
            });
          });

          test('multiple pipes with multiple args', () => {
            const argOne: Token = { lexeme: '1', line: 1, literal: 1, type: 'NUMBER' };
            const argTwo: Token = { lexeme: '2', line: 1, literal: 2, type: 'NUMBER' };
            const argThree: Token = { lexeme: '3', line: 1, literal: 3, type: 'NUMBER' };
            const argFour: Token = { lexeme: '4', line: 1, literal: 4, type: 'NUMBER' };
            const add: Token = { lexeme: 'add', line: 1, literal: 'add', type: 'IDENTIFIER' };
            const mult: Token = { lexeme: 'mult', line: 1, literal: 'mult', type: 'IDENTIFIER' };

            expect(
              createValidExpression(
                argFour,
                PIPE_TOKEN,
                add,
                LEFT_PAREN_TOKEN,
                argThree,
                RIGHT_PAREN_TOKEN,
                PIPE_TOKEN,
                mult,
                LEFT_PAREN_TOKEN,
                argTwo,
                COMMA_TOKEN,
                argOne,
                RIGHT_PAREN_TOKEN,
              ),
            ).toEqual({
              __kind: 'callExpr',
              arguments: [
                {
                  __kind: 'callExpr',
                  arguments: [
                    { __kind: 'literalExpr', value: 4 },
                    { __kind: 'literalExpr', value: 3 },
                  ],
                  callee: {
                    __kind: 'variableExpr',
                    name: { lexeme: 'add', line: 1, literal: 'add', type: 'IDENTIFIER' },
                  },
                },
                { __kind: 'literalExpr', value: 2 },
                { __kind: 'literalExpr', value: 1 },
              ],
              callee: {
                __kind: 'variableExpr',
                name: { lexeme: 'mult', line: 1, literal: 'mult', type: 'IDENTIFIER' },
              },
            });
          });
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

    describe('if expressions', () => {
      const conditionToken: Token = { lexeme: 'true', line: 1, literal: null, type: 'TRUE' };

      const createBlockTokens = (value: number): Token[] => [
        LEFT_BRACE_TOKEN,
        { lexeme: String(value), line: 1, literal: value, type: 'NUMBER' },
        SEMICOLON_TOKEN,
        RIGHT_BRACE_TOKEN,
      ];

      const createBlockExpr = (value: number): BlockExpr => ({
        __kind: 'blockExpr',
        statements: [
          {
            __kind: 'expressionStmt',
            expression: {
              __kind: 'literalExpr',
              value,
            },
          },
        ],
      });

      describe('are passed correctly for', () => {
        test('single if condition', () => {
          const value = 3;

          expect(createValidExpression(IF_TOKEN, conditionToken, ...createBlockTokens(value))).toEqual({
            __kind: 'ifExpr',
            branches: [
              {
                block: {
                  __kind: 'blockExpr',
                  statements: [
                    {
                      __kind: 'expressionStmt',
                      expression: {
                        __kind: 'literalExpr',
                        value,
                      },
                    },
                  ],
                },
                condition: {
                  __kind: 'literalExpr',
                  value: true,
                },
              },
            ],
          });
        });

        test('multiple branches', () => {
          const tokens: Token[] = [
            IF_TOKEN,
            { lexeme: 'false', line: 1, literal: null, type: 'FALSE' },
            ...createBlockTokens(1),
            ELSE_TOKEN,
            IF_TOKEN,
            { lexeme: 'true', line: 1, literal: null, type: 'TRUE' },
            ...createBlockTokens(2),
            ELSE_TOKEN,
            ...createBlockTokens(3),
          ];

          const expression = createValidExpression(...tokens);

          const expected = {
            __kind: 'ifExpr',
            branches: [
              {
                block: createBlockExpr(1),
                condition: {
                  __kind: 'literalExpr',
                  value: false,
                },
              },
              {
                block: createBlockExpr(2),
                condition: {
                  __kind: 'literalExpr',
                  value: true,
                },
              },
              {
                block: createBlockExpr(3),
                condition: null,
              },
            ],
          };

          expect(expression).toEqual(expected);
        });
      });

      describe('raise error when encountering', () => {
        test('consecutive "if"', () => {
          const tokens: Token[] = [
            IF_TOKEN,
            { lexeme: 'false', line: 1, literal: null, type: 'FALSE' },
            ...createBlockTokens(1),
            IF_TOKEN,
            { lexeme: 'true', line: 1, literal: null, type: 'TRUE' },
            ...createBlockTokens(2),
          ];

          createValidExpression(...tokens);

          expect(processExitMock).toBeCalledWith(1);
        });

        test('"if else" instead of "else if"', () => {
          const tokens: Token[] = [
            IF_TOKEN,
            { lexeme: 'false', line: 1, literal: null, type: 'FALSE' },
            ...createBlockTokens(1),
            IF_TOKEN,
            ELSE_TOKEN,
            { lexeme: 'true', line: 1, literal: null, type: 'TRUE' },
            ...createBlockTokens(2),
          ];

          createValidExpression(...tokens);

          expect(processExitMock).toBeCalledWith(1);
        });

        test('missing block', () => {
          const tokens: Token[] = [IF_TOKEN, { lexeme: 'false', line: 1, literal: null, type: 'FALSE' }];

          createValidExpression(...tokens);

          expect(processExitMock).toBeCalledWith(1);
        });
      });
    });

    describe('literal expressions', () => {
      test.each`
        lexeme     | literal    | type        | expected
        ${'1'}     | ${1}       | ${'NUMBER'} | ${1}
        ${'foo'}   | ${'foo'}   | ${'STRING'} | ${'foo'}
        ${'false'} | ${null}    | ${'FALSE'}  | ${false}
        ${'false'} | ${'false'} | ${'STRING'} | ${'false'}
        ${'true'}  | ${null}    | ${'TRUE'}   | ${true}
        ${'true'}  | ${'true'}  | ${'STRING'} | ${'true'}
        ${'nil'}   | ${null}    | ${'NIL'}    | ${'nil'}
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
