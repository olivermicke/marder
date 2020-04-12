import { Literal as LiteralType, Token } from '../scanner/types';

export type Expr = BinaryExpr | GroupingExpr | LiteralExpr | UnaryExpr | VariableExpr;

export type Stmt = ExpressionStmt | PrintStmt | VarStmt;

export type Literal = string | number | 'true' | 'false' | 'nil';

// Expressions
export type BinaryExpr = {
  __kind: 'binaryExpr';
  left: Expr;
  operator: Token;
  right: Expr;
};

export type GroupingExpr = {
  __kind: 'groupingExpr';
  expression: Expr;
};

export type LiteralExpr = {
  __kind: 'literalExpr';
  value: LiteralType;
};

export type UnaryExpr = {
  __kind: 'unaryExpr';
  operator: Token;
  right: Expr;
};

export type VariableExpr = {
  __kind: 'variableExpr';
  name: Token;
};

// Statements
export type ExpressionStmt = {
  __kind: 'expressionStmt';
  expression: Expr;
};

export type PrintStmt = {
  __kind: 'printStmt';
  expression: Expr;
};

export type VarStmt = {
  __kind: 'varStmt';
  name: Token;
  initializer: Expr;
};
