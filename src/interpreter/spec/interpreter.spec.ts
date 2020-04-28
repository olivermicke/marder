import { evaluate, interpret } from '../interpreter';
import { Environment } from '../environment';

import {
  BlockExpr,
  CallExpr,
  Expr,
  ExpressionStmt,
  FuncDefStmt,
  LetStmt,
  LetMutStmt,
  PrintStmt,
  ReassignmentStmt,
  Stmt,
  VariableExpr,
} from '../parser/types';
import { Token } from '../scanner/types';

let consoleSpy: jest.SpyInstance;
let processSpy: jest.SpyInstance;

const consoleLogMock = jest.fn();
const processExitMock = jest.fn();

const PROCESS_EXIT = 'PROCESS_EXIT';

const createFunc = ({
  statements = [],
  parameterNames = [],
  args = [],
}: {
  statements: Stmt[];
  parameterNames: string[];
  args: Expr[];
}): [FuncDefStmt, CallExpr, PrintStmt] => {
  const funcName: Token = { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' };
  const callExpr: CallExpr = {
    __kind: 'callExpr',
    arguments: args,
    callee: {
      __kind: 'variableExpr',
      name: funcName,
    },
  };

  return [
    {
      __kind: 'funcDefStmt',
      block: {
        __kind: 'blockExpr',
        statements,
      },
      name: funcName,
      parameters: parameterNames.map(createVariableExpr),
    },
    callExpr,
    createPrintStmt(callExpr),
  ];
};

const createPrintStmt = (expr: Expr): PrintStmt => ({
  __kind: 'printStmt',
  expression: expr,
});

const createVariableExpr = (name: string): VariableExpr => ({
  __kind: 'variableExpr',
  name: {
    lexeme: name,
    line: 1,
    literal: name,
    type: 'IDENTIFIER',
  },
});

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('evaluates AST and returns result', () => {
    interpret([
      createPrintStmt({
        __kind: 'literalExpr',
        value: 'Hello',
      }),
    ]);
    expect(consoleLogMock).toBeCalledWith('Hello');
  });

  describe('expressions', () => {
    describe('binary expressions', () => {
      describe('are evaluated correctly', () => {
        test('for operator "and"', () => {
          [
            [true, true, 'true'],
            [true, false, 'false'],
            [false, true, 'false'],
            [false, false, 'false'],
            [true, 'nil', 'false'],
            ['nil', true, 'false'],
            [false, 'nil', 'false'],
            ['nil', false, 'false'],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: 'and',
                  line: 1,
                  literal: null,
                  type: 'AND',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
            ]);
            expect(consoleLogMock).toBeCalledWith(expected);
          });
        });

        test('for operator "!="', () => {
          [
            [true, true, 'false'],
            [true, false, 'true'],
            [false, true, 'true'],
            [false, false, 'false'],
            [true, 'nil', 'true'],
            ['nil', true, 'true'],
            [false, 'nil', 'true'],
            ['nil', false, 'true'],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: '!=',
                  line: 1,
                  literal: null,
                  type: 'BANG_EQUAL',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
            ]);
            expect(consoleLogMock).toBeCalledWith(expected);
          });
        });

        test('for operator "=="', () => {
          [
            [true, true, 'true'],
            [true, false, 'false'],
            [false, true, 'false'],
            [false, false, 'true'],
            [true, 'nil', 'false'],
            ['nil', true, 'false'],
            [false, 'nil', 'false'],
            ['nil', false, 'false'],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: '==',
                  line: 1,
                  literal: null,
                  type: 'EQUAL_EQUAL',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
            ]);
            expect(consoleLogMock).toBeCalledWith(expected);
          });
        });

        test('for operator "<"', () => {
          [
            [true, true, PROCESS_EXIT],
            [true, false, PROCESS_EXIT],
            [false, true, PROCESS_EXIT],
            [false, false, PROCESS_EXIT],
            [true, 'nil', PROCESS_EXIT],
            ['nil', true, PROCESS_EXIT],
            [false, 'nil', PROCESS_EXIT],
            ['nil', false, PROCESS_EXIT],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: '<',
                  line: 1,
                  literal: null,
                  type: 'LESS',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
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
            [true, true, PROCESS_EXIT],
            [true, false, PROCESS_EXIT],
            [false, true, PROCESS_EXIT],
            [false, false, PROCESS_EXIT],
            [true, 'nil', PROCESS_EXIT],
            ['nil', true, PROCESS_EXIT],
            [false, 'nil', PROCESS_EXIT],
            ['nil', false, PROCESS_EXIT],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: '<=',
                  line: 1,
                  literal: null,
                  type: 'LESS_EQUAL',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
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
            [true, true, PROCESS_EXIT],
            [true, false, PROCESS_EXIT],
            [false, true, PROCESS_EXIT],
            [false, false, PROCESS_EXIT],
            [true, 'nil', PROCESS_EXIT],
            ['nil', true, PROCESS_EXIT],
            [false, 'nil', PROCESS_EXIT],
            ['nil', false, PROCESS_EXIT],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: '>',
                  line: 1,
                  literal: null,
                  type: 'GREATER',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
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
            [true, true, PROCESS_EXIT],
            [true, false, PROCESS_EXIT],
            [false, true, PROCESS_EXIT],
            [false, false, PROCESS_EXIT],
            [true, 'nil', PROCESS_EXIT],
            ['nil', true, PROCESS_EXIT],
            [false, 'nil', PROCESS_EXIT],
            ['nil', false, PROCESS_EXIT],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: '>=',
                  line: 1,
                  literal: null,
                  type: 'GREATER_EQUAL',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
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
            [true, true, PROCESS_EXIT],
            [true, false, PROCESS_EXIT],
            [false, true, PROCESS_EXIT],
            [false, false, PROCESS_EXIT],
            [true, 'nil', PROCESS_EXIT],
            ['nil', true, PROCESS_EXIT],
            [false, 'nil', PROCESS_EXIT],
            ['nil', false, PROCESS_EXIT],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: '-',
                  line: 1,
                  literal: null,
                  type: 'MINUS',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
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
            [true, true, 'true'],
            [true, false, 'true'],
            [false, true, 'true'],
            [false, false, 'false'],
            [true, 'nil', 'true'],
            ['nil', true, 'true'],
            [false, 'nil', 'false'],
            ['nil', false, 'false'],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: 'or',
                  line: 1,
                  literal: null,
                  type: 'OR',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
            ]);
            expect(consoleLogMock).toBeCalledWith(expected);
          });
        });

        test('for operator "+"', () => {
          [
            [true, true, PROCESS_EXIT],
            [true, false, PROCESS_EXIT],
            [false, true, PROCESS_EXIT],
            [false, false, PROCESS_EXIT],
            [true, 'nil', PROCESS_EXIT],
            ['nil', true, PROCESS_EXIT],
            [false, 'nil', PROCESS_EXIT],
            ['nil', false, PROCESS_EXIT],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: '+',
                  line: 1,
                  literal: null,
                  type: 'PLUS',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
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
            [true, true, PROCESS_EXIT],
            [true, false, PROCESS_EXIT],
            [false, true, PROCESS_EXIT],
            [false, false, PROCESS_EXIT],
            [true, 'nil', PROCESS_EXIT],
            ['nil', true, PROCESS_EXIT],
            [false, 'nil', PROCESS_EXIT],
            ['nil', false, PROCESS_EXIT],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: '/',
                  line: 1,
                  literal: null,
                  type: 'SLASH',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
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
            [true, true, PROCESS_EXIT],
            [true, false, PROCESS_EXIT],
            [false, true, PROCESS_EXIT],
            [false, false, PROCESS_EXIT],
            [true, 'nil', PROCESS_EXIT],
            ['nil', true, PROCESS_EXIT],
            [false, 'nil', PROCESS_EXIT],
            ['nil', false, PROCESS_EXIT],
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
              createPrintStmt({
                __kind: 'binaryExpr',
                left: { __kind: 'literalExpr', value: a },
                operator: {
                  lexeme: '*',
                  line: 1,
                  literal: null,
                  type: 'STAR',
                },
                right: { __kind: 'literalExpr', value: b },
              }),
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

    describe('block expressions', () => {
      test("can be nested and have access to their parents' scope", () => {
        const outerScopedVar: LetStmt = {
          __kind: 'letStmt',
          initializer: { __kind: 'literalExpr', value: 'read from outer scope' },
          name: { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' },
        };

        const innerScope: BlockExpr = {
          __kind: 'blockExpr',
          statements: [
            createPrintStmt({
              __kind: 'variableExpr',
              name: outerScopedVar.name,
            }),
          ],
        };

        const outerScope: BlockExpr = {
          __kind: 'blockExpr',
          statements: [outerScopedVar, { __kind: 'expressionStmt', expression: innerScope }],
        };

        interpret([{ __kind: 'expressionStmt', expression: outerScope }]);
        expect(consoleLogMock).toBeCalledWith('read from outer scope');
      });

      test('create scope', () => {
        const scopedVar: LetStmt = {
          __kind: 'letStmt',
          initializer: { __kind: 'literalExpr', value: 'scoped expr' },
          name: { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' },
        };
        const printStmt: PrintStmt = createPrintStmt({
          __kind: 'variableExpr',
          name: scopedVar.name,
        });

        const block: ExpressionStmt = {
          __kind: 'expressionStmt',
          expression: {
            __kind: 'blockExpr',
            statements: [scopedVar, printStmt],
          },
        };

        interpret([block, printStmt]);
        expect(consoleLogMock).toBeCalledWith('scoped expr');
        expect(processExitMock).toBeCalledTimes(1);
      });

      test('have read access to global scope', () => {
        const globalVar: LetStmt = {
          __kind: 'letStmt',
          initializer: { __kind: 'literalExpr', value: 'bar' },
          name: { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' },
        };
        const printStmt: PrintStmt = createPrintStmt({
          __kind: 'variableExpr',
          name: globalVar.name,
        });

        const block: ExpressionStmt = {
          __kind: 'expressionStmt',
          expression: {
            __kind: 'blockExpr',
            statements: [printStmt],
          },
        };

        interpret([globalVar, block]);
        expect(consoleLogMock).toBeCalledWith('bar');
      });

      test('have write access to global scope', () => {
        const globalVar: LetMutStmt = {
          __kind: 'letMutStmt',
          initializer: { __kind: 'literalExpr', value: 'bar' },
          name: { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' },
        };
        const printGlobalVar: PrintStmt = createPrintStmt({
          __kind: 'variableExpr',
          name: globalVar.name,
        });

        const reassignmentStmt: ReassignmentStmt = {
          __kind: 'reassignmentStmt',
          expression: {
            __kind: 'literalExpr',
            value: 'reassigned successfully',
          },
          name: globalVar.name,
        };
        const block: ExpressionStmt = {
          __kind: 'expressionStmt',
          expression: {
            __kind: 'blockExpr',
            statements: [reassignmentStmt],
          },
        };

        interpret([globalVar, block, printGlobalVar]);
        expect(consoleLogMock).toBeCalledWith('reassigned successfully');
      });

      test('return value of its last expression', () => {
        const blockExpr: BlockExpr = {
          __kind: 'blockExpr',
          statements: [
            {
              __kind: 'expressionStmt',
              expression: {
                __kind: 'literalExpr',
                value: 'foo',
              },
            },
          ],
        };
        const printBlockValue: PrintStmt = createPrintStmt(blockExpr);

        interpret([printBlockValue]);
        expect(consoleLogMock).toBeCalledWith('foo');
      });

      test('scoped variables can be mutated', () => {
        const scopedVar: LetMutStmt = {
          __kind: 'letMutStmt',
          initializer: { __kind: 'literalExpr', value: 'scoped expr' },
          name: { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' },
        };
        const reassignmentStmt: ReassignmentStmt = {
          __kind: 'reassignmentStmt',
          expression: { __kind: 'literalExpr', value: 'mutated' },
          name: scopedVar.name,
        };
        const printStmt: PrintStmt = createPrintStmt({ __kind: 'variableExpr', name: scopedVar.name });

        const block: ExpressionStmt = {
          __kind: 'expressionStmt',
          expression: {
            __kind: 'blockExpr',
            statements: [scopedVar, reassignmentStmt, printStmt],
          },
        };

        interpret([block]);
        expect(consoleLogMock).toBeCalledWith('mutated');
      });
    });

    describe('call expressions', () => {
      test('detect clash between parameters and local variables when called', () => {
        const [funcDefStmt, , printFuncStmt] = createFunc({
          args: [],
          parameterNames: ['n'],
          statements: [
            {
              __kind: 'letStmt',
              initializer: {
                __kind: 'literalExpr',
                value: 50,
              },
              name: { lexeme: 'n', line: 1, literal: 'n', type: 'IDENTIFIER' },
            },
          ],
        });

        interpret([funcDefStmt, printFuncStmt]);
        expect(processExitMock).toBeCalledWith(1);
      });

      test('raise error when more args than parameters', () => {
        const [funcDefStmt, callExpr] = createFunc({
          args: [{ __kind: 'literalExpr', value: 100 }],
          parameterNames: [],
          statements: [],
        });

        interpret([funcDefStmt, createPrintStmt(callExpr)]);
        expect(processExitMock).toBeCalledWith(1);
      });

      test('raise error when more parameters than args', () => {
        const [funcDefStmt, callExpr] = createFunc({
          args: [],
          parameterNames: ['n'],
          statements: [],
        });

        interpret([funcDefStmt, createPrintStmt(callExpr)]);
        expect(processExitMock).toBeCalledWith(1);
      });

      describe('return correct result when called', () => {
        test('without arguments', () => {
          const [funcDefStmt, , printFuncStmt] = createFunc({
            args: [],
            parameterNames: [],
            statements: [
              {
                __kind: 'expressionStmt',
                expression: {
                  __kind: 'literalExpr',
                  value: 40,
                },
              },
            ],
          });

          interpret([funcDefStmt, printFuncStmt]);
          expect(consoleLogMock).toBeCalledWith('40');
        });

        test('with one argument', () => {
          const [funcDefStmt, , printFuncStmt] = createFunc({
            args: [{ __kind: 'literalExpr', value: 100 }],
            parameterNames: ['n'],
            statements: [
              {
                __kind: 'expressionStmt',
                expression: createVariableExpr('n'),
              },
            ],
          });

          interpret([funcDefStmt, printFuncStmt]);
          expect(consoleLogMock).toBeCalledWith('100');
        });

        test('with two arguments', () => {
          const [funcDefStmt, , printFuncStmt] = createFunc({
            args: [
              { __kind: 'literalExpr', value: 100 },
              { __kind: 'literalExpr', value: 11 },
            ],
            parameterNames: ['a', 'b'],
            statements: [
              {
                __kind: 'expressionStmt',
                expression: {
                  __kind: 'binaryExpr',
                  left: createVariableExpr('a'),
                  operator: {
                    lexeme: '+',
                    line: 1,
                    literal: null,
                    type: 'PLUS',
                  },
                  right: createVariableExpr('b'),
                },
              },
            ],
          });

          interpret([funcDefStmt, printFuncStmt]);
          expect(consoleLogMock).toBeCalledWith('111');
        });
      });

      describe('first class support', () => {
        test('callback', () => {
          /*
            func call(fn) {
              fn();
            };

            func greet() {
              "Hello!";
            };

            print call(greet);
          */
          interpret([
            {
              __kind: 'funcDefStmt',
              block: {
                __kind: 'blockExpr',
                statements: [
                  {
                    __kind: 'expressionStmt',
                    expression: {
                      __kind: 'callExpr',
                      arguments: [],
                      callee: {
                        __kind: 'variableExpr',
                        name: {
                          lexeme: 'fn',
                          line: 2,
                          literal: 'fn',
                          type: 'IDENTIFIER',
                        },
                      },
                    },
                  },
                ],
              },
              name: {
                lexeme: 'call',
                line: 1,
                literal: 'call',
                type: 'IDENTIFIER',
              },
              parameters: [
                {
                  __kind: 'variableExpr',
                  name: {
                    lexeme: 'fn',
                    line: 1,
                    literal: 'fn',
                    type: 'IDENTIFIER',
                  },
                },
              ],
            },
            {
              __kind: 'funcDefStmt',
              block: {
                __kind: 'blockExpr',
                statements: [
                  {
                    __kind: 'expressionStmt',
                    expression: {
                      __kind: 'literalExpr',
                      value: 'Hello!',
                    },
                  },
                ],
              },
              name: {
                lexeme: 'greet',
                line: 5,
                literal: 'greet',
                type: 'IDENTIFIER',
              },
              parameters: [],
            },
            createPrintStmt({
              __kind: 'callExpr',
              arguments: [
                {
                  __kind: 'variableExpr',
                  name: {
                    lexeme: 'greet',
                    line: 9,
                    literal: 'greet',
                    type: 'IDENTIFIER',
                  },
                },
              ],
              callee: {
                __kind: 'variableExpr',
                name: {
                  lexeme: 'call',
                  line: 9,
                  literal: 'call',
                  type: 'IDENTIFIER',
                },
              },
            }),
          ]);
          expect(consoleLogMock).toBeCalledWith('Hello!');
        });

        test('calling function on function callees', () => {
          /*
            func foo() {
              func bar() {
                "Hello";
              };

              bar;
            };

            print foo()();
          */

          interpret([
            {
              __kind: 'funcDefStmt',
              block: {
                __kind: 'blockExpr',
                statements: [
                  {
                    __kind: 'funcDefStmt',
                    block: {
                      __kind: 'blockExpr',
                      statements: [{ __kind: 'expressionStmt', expression: { __kind: 'literalExpr', value: 'Hello' } }],
                    },
                    name: {
                      lexeme: 'bar',
                      line: 1,
                      literal: 'bar',
                      type: 'IDENTIFIER',
                    },
                    parameters: [],
                  },
                  {
                    __kind: 'expressionStmt',
                    expression: {
                      __kind: 'variableExpr',
                      name: {
                        lexeme: 'bar',
                        line: 1,
                        literal: 'bar',
                        type: 'IDENTIFIER',
                      },
                    },
                  },
                ],
              },
              name: { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' },
              parameters: [],
            },
            createPrintStmt({
              __kind: 'callExpr',
              arguments: [],
              callee: {
                __kind: 'callExpr',
                arguments: [],
                callee: {
                  __kind: 'variableExpr',
                  name: {
                    lexeme: 'foo',
                    line: 1,
                    literal: 'foo',
                    type: 'IDENTIFIER',
                  },
                },
              },
            }),
          ]);
          expect(consoleLogMock).toBeCalledWith('Hello');
        });

        test('nesting functions', () => {
          /*
            func outer(str) {
              func inner() {
                str;
              };

              inner();
            };

            print outer("foo");
          */
          interpret([
            {
              __kind: 'funcDefStmt',
              block: {
                __kind: 'blockExpr',
                statements: [
                  {
                    __kind: 'funcDefStmt',
                    block: {
                      __kind: 'blockExpr',
                      statements: [
                        {
                          __kind: 'expressionStmt',
                          expression: {
                            __kind: 'variableExpr',
                            name: {
                              lexeme: 'str',
                              line: 3,
                              literal: 'str',
                              type: 'IDENTIFIER',
                            },
                          },
                        },
                      ],
                    },
                    name: {
                      lexeme: 'inner',
                      line: 2,
                      literal: 'inner',
                      type: 'IDENTIFIER',
                    },
                    parameters: [],
                  },
                  {
                    __kind: 'expressionStmt',
                    expression: {
                      __kind: 'callExpr',
                      arguments: [],
                      callee: {
                        __kind: 'variableExpr',
                        name: {
                          lexeme: 'inner',
                          line: 6,
                          literal: 'inner',
                          type: 'IDENTIFIER',
                        },
                      },
                    },
                  },
                ],
              },
              name: {
                lexeme: 'outer',
                line: 1,
                literal: 'outer',
                type: 'IDENTIFIER',
              },
              parameters: [
                {
                  __kind: 'variableExpr',
                  name: {
                    lexeme: 'str',
                    line: 1,
                    literal: 'str',
                    type: 'IDENTIFIER',
                  },
                },
              ],
            },
            createPrintStmt({
              __kind: 'callExpr',
              arguments: [
                {
                  __kind: 'literalExpr',
                  value: 'foo',
                },
              ],
              callee: {
                __kind: 'variableExpr',
                name: {
                  lexeme: 'outer',
                  line: 9,
                  literal: 'outer',
                  type: 'IDENTIFIER',
                },
              },
            }),
          ]);
          expect(consoleLogMock).toBeCalledWith('foo');
        });

        test('binding funcs to variables', () => {
          interpret([
            {
              __kind: 'funcDefStmt',
              block: {
                __kind: 'blockExpr',
                statements: [
                  {
                    __kind: 'expressionStmt',
                    expression: {
                      __kind: 'binaryExpr',
                      left: {
                        __kind: 'variableExpr',
                        name: {
                          lexeme: 'n',
                          line: 2,
                          literal: 'n',
                          type: 'IDENTIFIER',
                        },
                      },
                      operator: {
                        lexeme: '*',
                        line: 2,
                        literal: null,
                        type: 'STAR',
                      },
                      right: {
                        __kind: 'literalExpr',
                        value: 2,
                      },
                    },
                  },
                ],
              },
              name: {
                lexeme: 'double',
                line: 1,
                literal: 'double',
                type: 'IDENTIFIER',
              },
              parameters: [
                {
                  __kind: 'variableExpr',
                  name: {
                    lexeme: 'n',
                    line: 1,
                    literal: 'n',
                    type: 'IDENTIFIER',
                  },
                },
              ],
            },
            {
              __kind: 'letStmt',
              initializer: {
                __kind: 'variableExpr',
                name: {
                  lexeme: 'double',
                  line: 5,
                  literal: 'double',
                  type: 'IDENTIFIER',
                },
              },
              name: {
                lexeme: 'd',
                line: 5,
                literal: 'd',
                type: 'IDENTIFIER',
              },
            },
            createPrintStmt({
              __kind: 'callExpr',
              arguments: [
                {
                  __kind: 'literalExpr',
                  value: 3,
                },
              ],
              callee: {
                __kind: 'variableExpr',
                name: {
                  lexeme: 'd',
                  line: 6,
                  literal: 'd',
                  type: 'IDENTIFIER',
                },
              },
            }),
          ]);
          expect(consoleLogMock).toBeCalledWith('6');
        });
      });
    });

    describe('grouping expressions', () => {
      test('precedence is correct', () => {
        // (2 + 2) * 2
        const expected = '8';
        interpret([
          createPrintStmt({
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
          }),
        ]);
        expect(consoleLogMock).toBeCalledWith(expected);
      });
    });

    describe('if expressions', () => {
      describe('single if branch', () => {
        const createPrintIfExpr = (conditionValue: boolean | string): PrintStmt =>
          createPrintStmt({
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
                        value: 'foo',
                      },
                    },
                  ],
                },
                condition: { __kind: 'literalExpr', value: conditionValue },
              },
            ],
          });

        test('is evaluated when it should', () => {
          interpret([createPrintIfExpr('true')]);
          expect(consoleLogMock).toBeCalledWith('foo');
        });

        test('returns "nil" when condition was not met', () => {
          interpret([createPrintIfExpr(false)]);
          expect(consoleLogMock).toBeCalledWith('nil');
        });
      });

      describe('nested branches', () => {
        test('"if" & "else if"', () => {
          /*
            if 3 <= 2 {
              "foo";
            } else if true {
              "bar";
            };
          */
          interpret([
            createPrintStmt({
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
                          value: 'foo',
                        },
                      },
                    ],
                  },
                  condition: {
                    __kind: 'binaryExpr',
                    left: { __kind: 'literalExpr', value: 3 },
                    operator: { lexeme: '<=', line: 1, literal: null, type: 'LESS_EQUAL' },
                    right: { __kind: 'literalExpr', value: 2 },
                  },
                },
                {
                  block: {
                    __kind: 'blockExpr',
                    statements: [
                      {
                        __kind: 'expressionStmt',
                        expression: {
                          __kind: 'literalExpr',
                          value: 'bar',
                        },
                      },
                    ],
                  },
                  condition: { __kind: 'literalExpr', value: true },
                },
              ],
            }),
          ]);
          expect(consoleLogMock).toBeCalledWith('bar');
        });

        test('"if" & "else if"', () => {
          /*
            if "false" {
              "foo";
            } else {
              "bar";
            };
          */
          interpret([
            createPrintStmt({
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
                          value: 'foo',
                        },
                      },
                    ],
                  },
                  condition: {
                    __kind: 'literalExpr',
                    value: false,
                  },
                },
                {
                  block: {
                    __kind: 'blockExpr',
                    statements: [
                      {
                        __kind: 'expressionStmt',
                        expression: {
                          __kind: 'literalExpr',
                          value: 'bar',
                        },
                      },
                    ],
                  },
                  condition: null,
                },
              ],
            }),
          ]);
          expect(consoleLogMock).toBeCalledWith('bar');
        });
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
          createPrintStmt({
            __kind: 'literalExpr',
            value: literal,
          }),
        ]);
        expect(consoleLogMock).toBeCalledWith(expected);
      });
    });

    describe('unary expressions', () => {
      test.each`
        literal    | expected
        ${'nil'}   | ${'true'}
        ${true}    | ${'false'}
        ${false}   | ${'true'}
        ${'false'} | ${'false'}
        ${'foo'}   | ${'false'}
      `('unary "!" works correctly with literal "$literal"', ({ literal, expected }) => {
        interpret([
          createPrintStmt({
            __kind: 'unaryExpr',
            operator: { lexeme: '!', line: 1, literal: null, type: 'BANG' },
            right: {
              __kind: 'literalExpr',
              value: literal,
            },
          }),
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
          createPrintStmt({
            __kind: 'unaryExpr',
            operator: { lexeme: '-', line: 1, literal: null, type: 'MINUS' },
            right: {
              __kind: 'literalExpr',
              value: literal,
            },
          }),
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
    describe('expression statements', () => {
      test('can be printed', () => {
        interpret([createPrintStmt({ __kind: 'literalExpr', value: 'foo' })]);

        expect(consoleLogMock).toBeCalledWith('foo');
      });

      test('return its assigned value', () => {
        const value = evaluate(
          {
            __kind: 'expressionStmt',
            expression: {
              __kind: 'literalExpr',
              value: 'Success!',
            },
          },
          new Environment({ enclosingEnv: null }),
        );
        expect(value).toEqual('Success!');
      });
    });

    describe('let statements', () => {
      const letStmt: LetStmt = {
        __kind: 'letStmt',
        initializer: { __kind: 'literalExpr', value: 'bar' },
        name: { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' },
      };

      test('cannot be mutated', () => {
        const mutationStatement: ReassignmentStmt = {
          __kind: 'reassignmentStmt',
          expression: { __kind: 'literalExpr', value: 'mutated' },
          name: { lexeme: letStmt.name.lexeme, line: 1, literal: letStmt.name.literal, type: 'IDENTIFIER' },
        };

        interpret([letStmt, mutationStatement]);
        expect(processExitMock).toBeCalledWith(1);
      });

      test('cannot be reassigned', () => {
        const reassignmentStatement: LetStmt = {
          __kind: 'letStmt',
          initializer: { __kind: 'literalExpr', value: 'bar2' },
          name: { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' },
        };

        interpret([letStmt, reassignmentStatement]);
        expect(processExitMock).toBeCalledWith(1);
      });

      test('do not yield another statement', () => {
        expect(evaluate(letStmt, new Environment({ enclosingEnv: null }))).toEqual(null);
      });

      test('initialize a variable which can be used as expression', () => {
        const printStmt: PrintStmt = createPrintStmt({
          __kind: 'variableExpr',
          name: letStmt.name,
        });

        interpret([letStmt, printStmt]);
        expect(consoleLogMock).toBeCalledWith((letStmt as any).initializer.value);
      });
    });

    describe('let mut statements', () => {
      const letMutStmt: LetMutStmt = {
        __kind: 'letMutStmt',
        initializer: { __kind: 'literalExpr', value: 'bar' },
        name: { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' },
      };

      test('can be mutated', () => {
        const mutationStatement: ReassignmentStmt = {
          __kind: 'reassignmentStmt',
          expression: { __kind: 'literalExpr', value: 'mutated' },
          name: { lexeme: letMutStmt.name.lexeme, line: 1, literal: letMutStmt.name.literal, type: 'IDENTIFIER' },
        };
        const printStmt: PrintStmt = createPrintStmt({
          __kind: 'variableExpr',
          name: letMutStmt.name,
        });

        interpret([letMutStmt, mutationStatement, printStmt]);
        expect(consoleLogMock).toBeCalledWith('mutated');
      });

      test('cannot be reassigned', () => {
        const reassignmentStatement: LetMutStmt = {
          __kind: 'letMutStmt',
          initializer: { __kind: 'literalExpr', value: 'bar2' },
          name: { lexeme: 'foo', line: 1, literal: 'foo', type: 'IDENTIFIER' },
        };

        interpret([letMutStmt, reassignmentStatement]);
        expect(processExitMock).toBeCalledWith(1);
      });

      test('do not yield another statement', () => {
        expect(evaluate(letMutStmt, new Environment({ enclosingEnv: null }))).toEqual(null);
      });

      test('initialize a variable which can be used as expression', () => {
        const printStmt: PrintStmt = createPrintStmt({
          __kind: 'variableExpr',
          name: letMutStmt.name,
        });

        interpret([letMutStmt, printStmt]);
        expect(consoleLogMock).toBeCalledWith((letMutStmt as any).initializer.value);
      });
    });

    describe('print statements', () => {
      const printStatement: PrintStmt = createPrintStmt({
        __kind: 'literalExpr',
        value: 'foo',
      });

      test('do not yield another statement', () => {
        expect(evaluate(printStatement, new Environment({ enclosingEnv: null }))).toEqual(null);
      });

      test('log the expression', () => {
        interpret([printStatement]);
        expect(consoleLogMock).toBeCalledWith((printStatement as any).expression.value as any);
      });
    });
  });
});
