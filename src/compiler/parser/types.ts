import { Literal as LiteralType, Token } from '../scanner/types';

export type Expr = BinaryExpr | GroupingExpr | LiteralExpr | UnaryExpr;

export type BinaryExpr = {
  __kind: 'binary';
  left: Expr;
  operator: Token;
  right: Expr;
};

export type GroupingExpr = {
  __kind: 'grouping';
  expression: Expr;
};

export type LiteralExpr = {
  __kind: 'literal';
  value: LiteralType;
};

export type UnaryExpr = {
  __kind: 'unary';
  operator: Token;
  right: Expr;
};
