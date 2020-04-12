export type Keyword =
  | 'and'
  | 'class'
  | 'else'
  | 'false'
  | 'for'
  | 'func'
  | 'if'
  | 'let'
  | 'mut'
  | 'nil'
  | 'or'
  | 'print'
  | 'return'
  | 'super'
  | 'this'
  | 'true'
  | 'while';

export type Literal = string | number | null;

export type Token = {
  lexeme: string;
  line: number;
  literal: Literal;
  type: TokenType;
};

export type TokenType =
  // Single-character tokens
  | 'LEFT_PAREN'
  | 'RIGHT_PAREN'
  | 'LEFT_BRACE'
  | 'RIGHT_BRACE'
  | 'COMMA'
  | 'DOT'
  | 'MINUS'
  | 'PLUS'
  | 'SEMICOLON'
  | 'SLASH'
  | 'STAR'

  // One or two character tokens
  | 'BANG'
  | 'BANG_EQUAL'
  | 'EQUAL'
  | 'EQUAL_EQUAL'
  | 'GREATER'
  | 'GREATER_EQUAL'
  | 'LESS'
  | 'LESS_EQUAL'
  | 'PIPE'

  // Literals
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'

  // Keywords
  | 'AND'
  | 'CLASS'
  | 'ELSE'
  | 'FALSE'
  | 'FUNC'
  | 'FOR'
  | 'IF'
  | 'LET'
  | 'MUT'
  | 'NIL'
  | 'OR'
  | 'PRINT'
  | 'RETURN'
  | 'SUPER'
  | 'THIS'
  | 'TRUE'
  | 'WHILE'
  | 'EOF';
