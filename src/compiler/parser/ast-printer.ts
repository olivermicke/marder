import { BinaryExpr, Expr, GroupingExpr, LiteralExpr, UnaryExpr } from './types';

export const printAST = (expr: Expr): string => {
  switch (expr.__kind) {
    case 'binary':
      return printBinaryExpr(expr);
    case 'grouping':
      return printGroupingExpr(expr);
    case 'literal':
      return printLiteralExpr(expr);
    case 'unary':
      return printUnaryExpr(expr);
  }
};

export const parenthesize = (name: string, ...expressions: Expr[]): string => {
  let str = `(${name}`;

  expressions.forEach((expression) => {
    str += ` ${printAST(expression)}`;
  });

  str += ')';

  return str;
};

const printBinaryExpr = (expr: BinaryExpr): string => parenthesize(expr.operator.lexeme, expr.left, expr.right);

const printGroupingExpr = (expr: GroupingExpr): string => parenthesize('group', expr.expression);

const printLiteralExpr = (expr: LiteralExpr): string => (expr.value ? String(expr.value) : 'nil');

const printUnaryExpr = (expr: UnaryExpr): string => parenthesize(expr.operator.lexeme, expr.right);
