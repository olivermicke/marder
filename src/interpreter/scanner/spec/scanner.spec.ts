import { Scanner } from '../scanner';

describe('scanner', () => {
  describe('line counter', () => {
    test('is increased after a new line', () => {
      const tokens = new Scanner('*\n*').scanTokens();
      expect(tokens[1].line).toEqual(2);
    });

    test('is increased after a comment containing a new line', () => {
      const [token] = new Scanner('// test\n*').scanTokens();
      expect(token.line).toEqual(2);
    });
  });

  describe('skips', () => {
    test('whitespace characters', () => {
      [' ', '\r', '\t'].forEach((whitespaceChar) => {
        const tokens = new Scanner(whitespaceChar).scanTokens();
        expect(tokens.length).toEqual(1);
        expect(tokens[0].type).toEqual('EOF');
      });
    });

    test('everything from start of comment til EOL', () => {
      const tokens = new Scanner('// * // &&\n').scanTokens();
      expect(tokens.length).toEqual(1);
      expect(tokens[0].type).toEqual('EOF');
    });
  });

  describe('single char lexemes', () => {
    test.each`
      lexeme | type
      ${'('} | ${'LEFT_PAREN'}
      ${')'} | ${'RIGHT_PAREN'}
      ${'{'} | ${'LEFT_BRACE'}
      ${'}'} | ${'RIGHT_BRACE'}
      ${','} | ${'COMMA'}
      ${'.'} | ${'DOT'}
      ${'+'} | ${'PLUS'}
      ${';'} | ${'SEMICOLON'}
      ${'*'} | ${'STAR'}
      ${'/'} | ${'SLASH'}
    `('adds correct token for lexeme $lexeme', ({ lexeme, type }) => {
      const [token] = new Scanner(lexeme).scanTokens();
      expect(token.lexeme).toEqual(lexeme);
      expect(token.line).toEqual(1);
      expect(token.literal).toEqual(null);
      expect(token.type).toEqual(type);
    });
  });

  describe('multiple char lexemes', () => {
    test.each`
      lexeme  | type
      ${'-'}  | ${'MINUS'}
      ${'->'} | ${'PIPE'}
      ${'!'}  | ${'BANG'}
      ${'!='} | ${'BANG_EQUAL'}
      ${'='}  | ${'EQUAL'}
      ${'=='} | ${'EQUAL_EQUAL'}
      ${'<'}  | ${'LESS'}
      ${'<='} | ${'LESS_EQUAL'}
      ${'>'}  | ${'GREATER'}
      ${'>='} | ${'GREATER_EQUAL'}
    `('adds correct token for source $source', ({ lexeme, type }) => {
      const [token] = new Scanner(lexeme).scanTokens();
      expect(token.lexeme).toEqual(lexeme);
      expect(token.line).toEqual(1);
      expect(token.literal).toEqual(null);
      expect(token.type).toEqual(type);
    });
  });

  describe('literals', () => {
    test('single-line string literals', () => {
      const [token] = new Scanner('"test"').scanTokens();
      expect(token.lexeme).toEqual('"test"');
      expect(token.literal).toEqual('test');
      expect(token.type).toEqual('STRING');
    });

    it('multi-line string literals', () => {
      const [token] = new Scanner('"te\nst"').scanTokens();
      expect(token.lexeme).toEqual('"te\nst"');
      expect(token.literal).toEqual('te\nst');
      expect(token.type).toEqual('STRING');
    });

    it('number literals', () => {
      const [token] = new Scanner('123').scanTokens();
      expect(token.lexeme).toEqual('123');
      expect(token.literal).toEqual(123);
      expect(token.type).toEqual('NUMBER');
    });

    it('floating number literals', () => {
      const [token] = new Scanner('3.14').scanTokens();
      expect(token.lexeme).toEqual('3.14');
      expect(token.literal).toEqual(3.14);
      expect(token.type).toEqual('NUMBER');
    });

    it('numbers inside string literals', () => {
      const [token] = new Scanner('"123"').scanTokens();
      expect(token.lexeme).toEqual('"123"');
      expect(token.literal).toEqual('123');
      expect(token.type).toEqual('STRING');
    });
  });

  describe('identifiers', () => {
    it('valid identifiers', () => {
      ['foo', 'BaR', '_foo', 'ba_R'].forEach((identifier) => {
        const [token] = new Scanner(identifier).scanTokens();
        expect(token.lexeme).toEqual(identifier);
        expect(token.line).toEqual(1);
        expect(token.literal).toEqual(identifier);
        expect(token.type).toEqual('IDENTIFIER');
      });
    });
  });

  describe('keywords', () => {
    test.each`
      keyword     | type
      ${'and'}    | ${'AND'}
      ${'class'}  | ${'CLASS'}
      ${'else'}   | ${'ELSE'}
      ${'false'}  | ${'FALSE'}
      ${'for'}    | ${'FOR'}
      ${'func'}   | ${'FUNC'}
      ${'if'}     | ${'IF'}
      ${'let'}    | ${'LET'}
      ${'mut'}    | ${'MUT'}
      ${'nil'}    | ${'NIL'}
      ${'or'}     | ${'OR'}
      ${'print'}  | ${'PRINT'}
      ${'return'} | ${'RETURN'}
      ${'super'}  | ${'SUPER'}
      ${'this'}   | ${'THIS'}
      ${'true'}   | ${'TRUE'}
      ${'while'}  | ${'WHILE'}
    `('adds correct token for keyword $keyword', ({ keyword, type }) => {
      const [token] = new Scanner(keyword).scanTokens();
      expect(token.lexeme).toEqual(keyword);
      expect(token.line).toEqual(1);
      expect(token.literal).toEqual(null);
      expect(token.type).toEqual(type);
    });
  });
});
