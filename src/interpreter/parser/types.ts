import { Literal as LiteralType, Token } from '../scanner/types';

export type Expr = BinaryExpr | BlockExpr | FuncCallExpr | GroupingExpr | LiteralExpr | UnaryExpr | VariableExpr;

export type Stmt = ExpressionStmt | FuncDefStmt | LetStmt | LetMutStmt | PrintStmt | ReassignmentStmt;

export type Literal = string | number | 'true' | 'false' | 'nil';

export type Scope = {
  uuid: string;
};

// Expressions
export type BinaryExpr = {
  __kind: 'binaryExpr';
  left: Expr;
  operator: Token;
  right: Expr;
};

export type BlockExpr = {
  __kind: 'blockExpr';
  statements: Stmt[];
};

export type FuncCallExpr = {
  __kind: 'funcCallExpr';
  arguments: Expr[];
  name: Token;
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

export type FuncDefStmt = {
  __kind: 'funcDefStmt';
  block: BlockExpr;
  name: Token;
  parameters: VariableExpr[];
};

export type LetStmt = {
  __kind: 'letStmt';
  name: Token;
  initializer: Expr;
};

export type LetMutStmt = {
  __kind: 'letMutStmt';
  name: Token;
  initializer: Expr;
};

export type PrintStmt = {
  __kind: 'printStmt';
  expression: Expr;
};

export type ReassignmentStmt = {
  __kind: 'reassignmentStmt';
  name: Token;
  expression: Expr;
};
