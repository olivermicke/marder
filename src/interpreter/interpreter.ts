import { reportError } from '../utils/report-error';

import { BinaryExpr, Expr, GroupingExpr, Literal, LiteralExpr, UnaryExpr, Stmt } from './parser/types';
import { Token } from './scanner/types';

type Nullable<T> = { [P in keyof T]: T[P] | null };

type Val = boolean | number | string | 'nil' | 'true' | 'false';

export const interpret = (statements: Stmt[]): void | never => {
  try {
    statements.forEach((statement: Stmt): void => {
      evaluate(statement);
    });
    // eslint-disable-next-line
  } catch (_error) {}
};

const globalState: Record<string, any> = {};

export const evaluate = (val: Expr | Stmt): any => {
  switch (val.__kind) {
    case 'binaryExpr': {
      return evaluateBinaryExpr(val);
    }
    case 'expressionStmt': {
      evaluate(val);
      return null;
    }
    case 'groupingExpr': {
      return evaluateGroupingExpr(val);
    }
    case 'literalExpr': {
      return evaluateLiteralExpr(val);
    }
    case 'printStmt': {
      const str = stringify(evaluate(val.expression));
      console.log(str);
      return null;
    }
    case 'unaryExpr': {
      return evaluateUnaryExpr(val);
    }
    case 'variableExpr': {
      const value = globalState[val.name.literal];
      if (value === undefined) {
        reportError('Undefined variable', {
          number: val.name.line,
          string: `${val.name.literal}`,
        });
      }
      return value;
    }
    case 'varStmt': {
      globalState[val.name.literal] = evaluate(val.initializer);
      return null;
    }
  }
};

const stringify = (object: Nullable<Val>): string => {
  if (object === null) {
    return 'nil';
  }

  return String(object);
};

const isTruthy = (object: Nullable<Val>): boolean => {
  if (object === null || object === 'false' || object === 'nil') {
    return false;
  }

  return true;
};

const isEqual = (a: Nullable<Val>, b: Nullable<Val>): boolean => {
  const aIsNull = a === null || a === 'nil';
  const bIsNull = b === null || b === 'nil';

  if (aIsNull && bIsNull) {
    return true;
  } else if (aIsNull) {
    return false;
  }

  return a === b;
};

const NON_CONCATTABLE_STRINGS = ['true', 'false', 'nil'];
const canConcatStrings = (a: any, b: any): boolean => {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  if (NON_CONCATTABLE_STRINGS.includes(a) || NON_CONCATTABLE_STRINGS.includes(b)) {
    return false;
  }

  return true;
};

const checkNumberOperand = (operator: Token, operand: number | string): void | never => {
  if (typeof operand === 'number') {
    return;
  }

  reportError('Operand must be a number', { number: operator.line, string: `Operand: ${operand}` });
};

const checkNumberOperands = (operator: Token, left: number | string, right: number | string): void | never => {
  if (typeof left === 'number' && typeof right === 'number') {
    return;
  }

  reportError('Operands must be numbers', { number: operator.line, string: `Operands: "${left}" and "${right}"` });
};

const evaluateLiteralExpr = (expr: LiteralExpr): Literal => expr.value;

const evaluateGroupingExpr = (expr: GroupingExpr): Expr => evaluate(expr.expression);

const evaluateUnaryExpr = (expr: UnaryExpr): boolean | number | never => {
  const right = evaluate(expr.right);

  /* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
  switch (expr.operator.type) {
    case 'BANG':
      return !isTruthy(right);
    case 'MINUS':
      checkNumberOperand(expr.operator, right);
      return right * -1;
  }
  /* eslint-enable @typescript-eslint/switch-exhaustiveness-check */

  return null;
};

const evaluateBinaryExpr = (expr: BinaryExpr): Nullable<Val> | never => {
  const left = evaluate(expr.left);
  const right = evaluate(expr.right);

  /* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
  switch (expr.operator.type) {
    case 'AND':
      return isTruthy(left) && isTruthy(right);
    case 'BANG_EQUAL':
      return !isEqual(left, right);
    case 'EQUAL_EQUAL':
      return isEqual(left, right);
    case 'LESS':
      checkNumberOperands(expr.operator, left, right);
      return left < right;
    case 'LESS_EQUAL':
      checkNumberOperands(expr.operator, left, right);
      return left <= right;
    case 'GREATER':
      checkNumberOperands(expr.operator, left, right);
      return left > right;
    case 'GREATER_EQUAL':
      checkNumberOperands(expr.operator, left, right);
      return left >= right;
    case 'MINUS':
      checkNumberOperands(expr.operator, left, right);
      return parseFloat(String(left - right));
    case 'OR':
      return isTruthy(left) || isTruthy(right);
    case 'PLUS':
      if (canConcatStrings(left, right)) {
        return left + right;
      }

      if (typeof left === 'number' && typeof right === 'number') {
        return left + right;
      }

      reportError('Operands must be either two numbers or two srings', {
        number: expr.operator.line,
        string: `Operands: "${left}" and "${right}"`,
      });
      break;
    case 'SLASH':
      checkNumberOperands(expr.operator, left, right);
      if (right === 0) {
        reportError('Cannot divide by zero', {
          number: expr.operator.line,
          string: `${left} / ${right}`,
        });
      }

      return left / right;
    case 'STAR':
      checkNumberOperands(expr.operator, left, right);
      return left * right;
  }
  /* eslint-enable @typescript-eslint/switch-exhaustiveness-check */

  return null;
};
