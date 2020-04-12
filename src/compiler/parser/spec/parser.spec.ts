import { Parser } from '../parser';

describe('parser', () => {
  test('creates correct AST', () => {
    const ast = new Parser([
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
      { lexeme: 'EOF', line: 1, literal: null, type: 'EOF' },
    ]).parse();

    expect(ast).toEqual({
      __kind: 'binary',
      left: {
        __kind: 'grouping',
        expression: {
          __kind: 'binary',
          left: {
            __kind: 'binary',
            left: {
              __kind: 'unary',
              operator: { lexeme: '-', line: 1, literal: null, type: 'MINUS' },
              right: {
                __kind: 'literal',
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
              __kind: 'binary',
              left: {
                __kind: 'literal',
                value: 2,
              },
              operator: {
                lexeme: '*',
                line: 1,
                literal: null,
                type: 'STAR',
              },
              right: {
                __kind: 'literal',
                value: 2,
              },
            },
          },
          operator: { lexeme: '==', line: 1, literal: null, type: 'EQUAL_EQUAL' },
          right: {
            __kind: 'literal',
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
        __kind: 'grouping',
        expression: {
          __kind: 'binary',
          left: {
            __kind: 'literal',
            value: 'nil',
          },
          operator: {
            lexeme: '!=',
            line: 1,
            literal: null,
            type: 'BANG_EQUAL',
          },
          right: {
            __kind: 'literal',
            value: 'true',
          },
        },
      },
    });
  });
});
