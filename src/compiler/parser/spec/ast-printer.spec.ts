import { parenthesize, printAST } from '../ast-printer';

describe('ast-printer', () => {
  describe('prints', () => {
    describe('expressions', () => {
      test('binary expressions', () => {
        const result = printAST({
          __kind: 'binary',
          left: {
            __kind: 'literal',
            value: 1,
          },
          operator: {
            lexeme: '+',
            line: 1,
            literal: null,
            type: 'PLUS',
          },
          right: {
            __kind: 'literal',
            value: 2,
          },
        });
        expect(result).toEqual('(+ 1 2)');
      });

      test('grouping expressions', () => {
        const result = printAST({
          __kind: 'grouping',
          expression: {
            __kind: 'literal',
            value: 'foo',
          },
        });
        expect(result).toEqual('(group foo)');
      });

      test.each`
        value    | type        | expected
        ${'foo'} | ${'string'} | ${'foo'}
        ${123}   | ${'number'} | ${'123'}
        ${null}  | ${'nil'}    | ${'nil'}
      `('literal expressions of type $type', ({ expected, value }) => {
        expect(
          printAST({
            __kind: 'literal',
            value,
          }),
        ).toBe(expected);
      });

      test('unary expressions', () => {
        const result = printAST({
          __kind: 'unary',
          operator: {
            lexeme: '!',
            line: 1,
            literal: null,
            type: 'BANG',
          },
          right: {
            __kind: 'literal',
            value: 1,
          },
        });
        expect(result).toEqual('(! 1)');
      });

      test('integration: nested expressions', () => {
        const result = printAST({
          __kind: 'binary',
          left: {
            __kind: 'unary',
            operator: {
              lexeme: '-',
              line: 1,
              literal: null,
              type: 'MINUS',
            },
            right: {
              __kind: 'binary',
              left: {
                __kind: 'unary',
                operator: {
                  lexeme: '!',
                  line: 1,
                  literal: null,
                  type: 'BANG',
                },
                right: {
                  __kind: 'literal',
                  value: 123,
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
                  __kind: 'literal',
                  value: 456,
                },
              },
            },
          },
          operator: {
            lexeme: '*',
            line: 1,
            literal: null,
            type: 'STAR',
          },
          right: {
            __kind: 'grouping',
            expression: {
              __kind: 'literal',
              value: 45.67,
            },
          },
        });
        expect(result).toEqual('(* (- (== (! 123) (group 456))) (group 45.67))');
      });
    });
  });

  describe('utils', () => {
    test('"parenthesize" works correctly', () => {
      expect(parenthesize('foo', { __kind: 'literal', value: 123 }, { __kind: 'literal', value: 'bar' })).toEqual(
        '(foo 123 bar)',
      );
    });
  });
});
