import { evaluate, interpret } from '../interpreter';

import { PrintStmt, VarStmt } from '../parser/types';

let consoleSpy: jest.SpyInstance;
let processSpy: jest.SpyInstance;

const consoleLogMock = jest.fn();
const processExitMock = jest.fn();

const PROCESS_EXIT = 'PROCESS_EXIT';

describe('interpreter', () => {
  beforeAll(() => {
    consoleSpy = jest.spyOn(global.console, 'log').mockImplementation(consoleLogMock);
    // @ts-ignore
    processSpy = jest.spyOn(process, 'exit').mockImplementation(processExitMock);
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    processSpy.mockRestore();
  });

  it('evaluates AST and returns result', () => {
    const expected = 'Success!';
    interpret([
      {
        __kind: 'printStmt',
        expression: {
          __kind: 'literalExpr',
          value: expected,
        },
      },
    ]);

    expect(consoleLogMock).toBeCalledWith(expected);
  });

  describe('expressions', () => {
    describe('binary expressions', () => {
      describe('are evaluated correctly', () => {
        test('for operator "and"', () => {
          [
            ['true', 'true', 'true'],
            ['true', 'false', 'false'],
            ['false', 'true', 'false'],
            ['false', 'false', 'false'],
            ['true', 'nil', 'false'],
            ['nil', 'true', 'false'],
            ['false', 'nil', 'false'],
            ['nil', 'false', 'false'],
            ['nil', 'nil', 'false'],
            [1, 2, 'true'],
            [1, 1, 'true'],
            [1.6, 2.5, 'true'],
            [1.6, 1.6, 'true'],
            [2.6, 1.5, 'true'],
            ['foo', 'bar', 'true'],
            ['foo', 'foo', 'true'],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: 'and',
                    line: 1,
                    literal: null,
                    type: 'AND',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);
            expect(consoleLogMock).toBeCalledWith(expected);
          });
        });

        test('for operator "!="', () => {
          [
            ['true', 'true', 'false'],
            ['true', 'false', 'true'],
            ['false', 'true', 'true'],
            ['false', 'false', 'false'],
            ['true', 'nil', 'true'],
            ['nil', 'true', 'true'],
            ['false', 'nil', 'true'],
            ['nil', 'false', 'true'],
            ['nil', 'nil', 'false'],
            [1, 2, 'true'],
            [1, 1, 'false'],
            [1.6, 2.5, 'true'],
            [1.6, 1.6, 'false'],
            [2.6, 1.5, 'true'],
            ['foo', 'bar', 'true'],
            ['foo', 'foo', 'false'],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: '!=',
                    line: 1,
                    literal: null,
                    type: 'BANG_EQUAL',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);
            expect(consoleLogMock).toBeCalledWith(expected);
          });
        });

        test('for operator "=="', () => {
          [
            ['true', 'true', 'true'],
            ['true', 'false', 'false'],
            ['false', 'true', 'false'],
            ['false', 'false', 'true'],
            ['true', 'nil', 'false'],
            ['nil', 'true', 'false'],
            ['false', 'nil', 'false'],
            ['nil', 'false', 'false'],
            ['nil', 'nil', 'true'],
            [1, 2, 'false'],
            [1, 1, 'true'],
            [1.6, 2.5, 'false'],
            [1.6, 1.6, 'true'],
            [2.6, 1.5, 'false'],
            ['foo', 'bar', 'false'],
            ['foo', 'foo', 'true'],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: '==',
                    line: 1,
                    literal: null,
                    type: 'EQUAL_EQUAL',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);
            expect(consoleLogMock).toBeCalledWith(expected);
          });
        });

        test('for operator "<"', () => {
          [
            ['true', 'true', PROCESS_EXIT],
            ['true', 'false', PROCESS_EXIT],
            ['false', 'true', PROCESS_EXIT],
            ['false', 'false', PROCESS_EXIT],
            ['true', 'nil', PROCESS_EXIT],
            ['nil', 'true', PROCESS_EXIT],
            ['false', 'nil', PROCESS_EXIT],
            ['nil', 'false', PROCESS_EXIT],
            ['nil', 'nil', PROCESS_EXIT],
            [1, 2, 'true'],
            [1, 1, 'false'],
            [2, 1, 'false'],
            [1.6, 2.5, 'true'],
            [1.6, 1.6, 'false'],
            [2.6, 1.5, 'false'],
            ['foo', 'bar', PROCESS_EXIT],
            ['foo', 'foo', PROCESS_EXIT],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: '<',
                    line: 1,
                    literal: null,
                    type: 'LESS',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);

            if (expected === PROCESS_EXIT) {
              expect(processExitMock).toBeCalledWith(1);
            } else {
              expect(consoleLogMock).toBeCalledWith(expected);
            }
          });
        });

        test('for operator "<="', () => {
          [
            ['true', 'true', PROCESS_EXIT],
            ['true', 'false', PROCESS_EXIT],
            ['false', 'true', PROCESS_EXIT],
            ['false', 'false', PROCESS_EXIT],
            ['true', 'nil', PROCESS_EXIT],
            ['nil', 'true', PROCESS_EXIT],
            ['false', 'nil', PROCESS_EXIT],
            ['nil', 'false', PROCESS_EXIT],
            ['nil', 'nil', PROCESS_EXIT],
            [1, 2, 'true'],
            [1, 1, 'true'],
            [2, 1, 'false'],
            [1.6, 2.5, 'true'],
            [1.6, 1.6, 'true'],
            [2.6, 1.5, 'false'],
            ['foo', 'bar', PROCESS_EXIT],
            ['foo', 'foo', PROCESS_EXIT],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: '<=',
                    line: 1,
                    literal: null,
                    type: 'LESS_EQUAL',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);

            if (expected === PROCESS_EXIT) {
              expect(processExitMock).toBeCalledWith(1);
            } else {
              expect(consoleLogMock).toBeCalledWith(expected);
            }
          });
        });

        test('for operator ">"', () => {
          [
            ['true', 'true', PROCESS_EXIT],
            ['true', 'false', PROCESS_EXIT],
            ['false', 'true', PROCESS_EXIT],
            ['false', 'false', PROCESS_EXIT],
            ['true', 'nil', PROCESS_EXIT],
            ['nil', 'true', PROCESS_EXIT],
            ['false', 'nil', PROCESS_EXIT],
            ['nil', 'false', PROCESS_EXIT],
            ['nil', 'nil', PROCESS_EXIT],
            [1, 2, 'false'],
            [1, 1, 'false'],
            [2, 1, 'true'],
            [1.6, 2.5, 'false'],
            [1.6, 1.6, 'false'],
            [2.6, 1.5, 'true'],
            ['foo', 'bar', PROCESS_EXIT],
            ['foo', 'foo', PROCESS_EXIT],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: '>',
                    line: 1,
                    literal: null,
                    type: 'GREATER',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);

            if (expected === PROCESS_EXIT) {
              expect(processExitMock).toBeCalledWith(1);
            } else {
              expect(consoleLogMock).toBeCalledWith(expected);
            }
          });
        });

        test('for operator ">="', () => {
          [
            ['true', 'true', PROCESS_EXIT],
            ['true', 'false', PROCESS_EXIT],
            ['false', 'true', PROCESS_EXIT],
            ['false', 'false', PROCESS_EXIT],
            ['true', 'nil', PROCESS_EXIT],
            ['nil', 'true', PROCESS_EXIT],
            ['false', 'nil', PROCESS_EXIT],
            ['nil', 'false', PROCESS_EXIT],
            ['nil', 'nil', PROCESS_EXIT],
            [1, 2, 'false'],
            [1, 1, 'true'],
            [2, 1, 'true'],
            [1.6, 2.5, 'false'],
            [1.6, 1.6, 'true'],
            [2.6, 1.5, 'true'],
            ['foo', 'bar', PROCESS_EXIT],
            ['foo', 'foo', PROCESS_EXIT],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: '>=',
                    line: 1,
                    literal: null,
                    type: 'GREATER_EQUAL',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);

            if (expected === PROCESS_EXIT) {
              expect(processExitMock).toBeCalledWith(1);
            } else {
              expect(consoleLogMock).toBeCalledWith(expected);
            }
          });
        });

        test('for operator "-"', () => {
          [
            ['true', 'true', PROCESS_EXIT],
            ['true', 'false', PROCESS_EXIT],
            ['false', 'true', PROCESS_EXIT],
            ['false', 'false', PROCESS_EXIT],
            ['true', 'nil', PROCESS_EXIT],
            ['nil', 'true', PROCESS_EXIT],
            ['false', 'nil', PROCESS_EXIT],
            ['nil', 'false', PROCESS_EXIT],
            ['nil', 'nil', PROCESS_EXIT],
            [1, 2, '-1'],
            [1, 1, '0'],
            [2, 1, '1'],
            [1.6, 2.5, '-0.8999999999999999'],
            [1.6, 1.6, '0'],
            [2.6, 1.5, '1.1'],
            ['foo', 'bar', PROCESS_EXIT],
            ['foo', 'foo', PROCESS_EXIT],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: '-',
                    line: 1,
                    literal: null,
                    type: 'MINUS',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);

            if (expected === PROCESS_EXIT) {
              expect(processExitMock).toBeCalledWith(1);
            } else {
              expect(consoleLogMock).toBeCalledWith(expected);
            }
          });
        });

        test('for operator "or"', () => {
          [
            ['true', 'true', 'true'],
            ['true', 'false', 'true'],
            ['false', 'true', 'true'],
            ['false', 'false', 'false'],
            ['true', 'nil', 'true'],
            ['nil', 'true', 'true'],
            ['false', 'nil', 'false'],
            ['nil', 'false', 'false'],
            ['nil', 'nil', 'false'],
            [1, 2, 'true'],
            [1, 1, 'true'],
            [1.6, 2.5, 'true'],
            [1.6, 1.6, 'true'],
            [2.6, 1.5, 'true'],
            ['foo', 'bar', 'true'],
            ['foo', 'foo', 'true'],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: 'or',
                    line: 1,
                    literal: null,
                    type: 'OR',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);
            expect(consoleLogMock).toBeCalledWith(expected);
          });
        });

        test('for operator "+"', () => {
          [
            ['true', 'true', PROCESS_EXIT],
            ['true', 'false', PROCESS_EXIT],
            ['false', 'true', PROCESS_EXIT],
            ['false', 'false', PROCESS_EXIT],
            ['true', 'nil', PROCESS_EXIT],
            ['nil', 'true', PROCESS_EXIT],
            ['false', 'nil', PROCESS_EXIT],
            ['nil', 'false', PROCESS_EXIT],
            ['nil', 'nil', PROCESS_EXIT],
            [1, 2, '3'],
            [1, 1, '2'],
            [-2, 1, '-1'],
            [1.6, 2.5, '4.1'],
            [1.6, 1.6, '3.2'],
            [-2.6, 1.5, '-1.1'],
            ['foo', 'bar', 'foobar'],
            ['foo', 'foo', 'foofoo'],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: '+',
                    line: 1,
                    literal: null,
                    type: 'PLUS',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);

            if (expected === PROCESS_EXIT) {
              expect(processExitMock).toBeCalledWith(1);
            } else {
              expect(consoleLogMock).toBeCalledWith(expected);
            }
          });
        });

        test('for operator "/"', () => {
          [
            ['true', 'true', PROCESS_EXIT],
            ['true', 'false', PROCESS_EXIT],
            ['false', 'true', PROCESS_EXIT],
            ['false', 'false', PROCESS_EXIT],
            ['true', 'nil', PROCESS_EXIT],
            ['nil', 'true', PROCESS_EXIT],
            ['false', 'nil', PROCESS_EXIT],
            ['nil', 'false', PROCESS_EXIT],
            ['nil', 'nil', PROCESS_EXIT],
            [2, 1, '2'],
            [1, 2, '0.5'],
            [1, 1, '1'],
            [0, 2, '0'],
            [1, 0, PROCESS_EXIT],
            [-1, 2, '-0.5'],
            [1, -2, '-0.5'],
            [-1, -2, '0.5'],
            ['foo', 'bar', PROCESS_EXIT],
            ['foo', 'foo', PROCESS_EXIT],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: '/',
                    line: 1,
                    literal: null,
                    type: 'SLASH',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);

            if (expected === PROCESS_EXIT) {
              expect(processExitMock).toBeCalledWith(1);
            } else {
              expect(consoleLogMock).toBeCalledWith(expected);
            }
          });
        });

        test('for operator "*"', () => {
          [
            ['true', 'true', PROCESS_EXIT],
            ['true', 'false', PROCESS_EXIT],
            ['false', 'true', PROCESS_EXIT],
            ['false', 'false', PROCESS_EXIT],
            ['true', 'nil', PROCESS_EXIT],
            ['nil', 'true', PROCESS_EXIT],
            ['false', 'nil', PROCESS_EXIT],
            ['nil', 'false', PROCESS_EXIT],
            ['nil', 'nil', PROCESS_EXIT],
            [2, 1, '2'],
            [1, 2, '2'],
            [1, 1, '1'],
            [0, 2, '0'],
            [1, 0, '0'],
            [-1, 2, '-2'],
            [1, -2, '-2'],
            [-1, -2, '2'],
            ['foo', 'bar', PROCESS_EXIT],
            ['foo', 'foo', PROCESS_EXIT],
          ].forEach(([a, b, expected]) => {
            interpret([
              {
                __kind: 'printStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: a },
                  operator: {
                    lexeme: '*',
                    line: 1,
                    literal: null,
                    type: 'STAR',
                  },
                  right: { __kind: 'literalExpr', value: b },
                },
              },
            ]);

            if (expected === PROCESS_EXIT) {
              expect(processExitMock).toBeCalledWith(1);
            } else {
              expect(consoleLogMock).toBeCalledWith(expected);
            }
          });
        });
      });
    });

    describe('grouping expressions', () => {
      test('precedence is correct', () => {
        // (2 + 2) * 2
        const expected = '8';
        interpret([
          {
            __kind: 'printStmt',
            expression: {
              __kind: 'binaryExpr',
              left: {
                __kind: 'groupingExpr',
                expression: {
                  __kind: 'binaryExpr',
                  left: { __kind: 'literalExpr', value: 2 },
                  operator: { lexeme: '+', line: 1, literal: null, type: 'PLUS' },
                  right: { __kind: 'literalExpr', value: 2 },
                },
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
        ]);
        expect(consoleLogMock).toBeCalledWith(expected);
      });
    });

    describe('literal expressions', () => {
      test.each`
        literal    | expected
        ${2}       | ${'2'}
        ${'foo'}   | ${'foo'}
        ${'nil'}   | ${'nil'}
        ${'true'}  | ${'true'}
        ${'false'} | ${'false'}
      `('literal expression "$literal" is correctly stringified', ({ literal, expected }) => {
        interpret([
          {
            __kind: 'printStmt',
            expression: {
              __kind: 'literalExpr',
              value: literal,
            },
          },
        ]);
        expect(consoleLogMock).toBeCalledWith(expected);
      });
    });

    describe('unary expressions', () => {
      test.each`
        literal    | expected
        ${'nil'}   | ${'true'}
        ${'true'}  | ${'false'}
        ${'false'} | ${'true'}
        ${'foo'}   | ${'false'}
      `('unary "!" works correctly with literal "$literal"', ({ literal, expected }) => {
        interpret([
          {
            __kind: 'printStmt',
            expression: {
              __kind: 'unaryExpr',
              operator: { lexeme: '!', line: 1, literal: null, type: 'BANG' },
              right: {
                __kind: 'literalExpr',
                value: literal,
              },
            },
          },
        ]);
        expect(consoleLogMock).toBeCalledWith(expected);
      });

      test.each`
        literal    | expected
        ${3}       | ${'-3'}
        ${-3}      | ${'3'}
        ${0}       | ${'0'}
        ${-0}      | ${'0'}
        ${'true'}  | ${PROCESS_EXIT}
        ${'false'} | ${PROCESS_EXIT}
        ${'nil'}   | ${PROCESS_EXIT}
        ${'foo'}   | ${PROCESS_EXIT}
      `('unary "-" works correctly with literal "$literal"', ({ literal, expected }) => {
        interpret([
          {
            __kind: 'printStmt',
            expression: {
              __kind: 'unaryExpr',
              operator: { lexeme: '-', line: 1, literal: null, type: 'MINUS' },
              right: {
                __kind: 'literalExpr',
                value: literal,
              },
            },
          },
        ]);
        if (expected === PROCESS_EXIT) {
          expect(processExitMock).toBeCalledWith(1);
        } else {
          expect(consoleLogMock).toBeCalledWith(expected);
        }
      });
    });
  });

  describe('statements', () => {
    describe('expression statement', () => {
      test('can be printed', () => {
        interpret([{ __kind: 'printStmt', expression: { __kind: 'literalExpr', value: 'foo' } }]);
        expect(consoleLogMock).toBeCalledWith('foo');
      });
    });

    describe('print statement', () => {
      const printStatement: PrintStmt = {
        __kind: 'printStmt',
        expression: {
          __kind: 'literalExpr',
          value: 'foo',
        },
      };

      test('logs the expression', () => {
        interpret([printStatement]);
        expect(consoleLogMock).toBeCalledWith((printStatement as any).expression.value as any);
      });

      test('returns null', () => {
        expect(evaluate(printStatement)).toEqual(null);
      });
    });

    describe('var statement', () => {
      const varStmt: VarStmt = {
        __kind: 'varStmt',
        initializer: { __kind: 'literalExpr', value: 'bar' },
        name: { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' },
      };

      test('variable is initialized and can be printed', () => {
        const printStmt: PrintStmt = {
          __kind: 'printStmt',
          expression: {
            __kind: 'variableExpr',
            name: varStmt.name,
          },
        };

        interpret([varStmt, printStmt]);
        expect(consoleLogMock).toBeCalledWith((varStmt as any).initializer.value);
      });

      test('returns null', () => {
        expect(evaluate(varStmt)).toEqual(null);
      });
    });
  });
});
