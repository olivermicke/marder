import { v4 as uuidv4 } from 'uuid';

import { reportError } from '../utils/report-error';

import { Environment } from './environment';
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  Literal,
  LiteralExpr,
  UnaryExpr,
  Scope,
  Stmt,
  BlockExpr,
  LetStmt,
} from './parser/types';
import { Token } from './scanner/types';

type Nullable<T> = { [P in keyof T]: T[P] | null };

type Val = boolean | number | string | 'nil' | 'true' | 'false';

export const interpret = (statements: Stmt[]): void | never => {
  try {
    const environment = new Environment();

    statements.forEach((statement: Stmt): void => {
      evaluate(statement, environment);
    });
    // eslint-disable-next-line
  } catch (error) {
    console.log(error);
  }
};

export const evaluate = (val: Expr | Stmt, environment: Environment, scope?: Scope): any => {
  switch (val.__kind) {
    case 'binaryExpr': {
      return evaluateBinaryExpr(val, environment, scope);
    }
    case 'blockExpr': {
      const scopeUUID = uuidv4();
      environment.createScope(scopeUUID);

      let lastValue = null;
      val.statements.forEach((statement) => {
        lastValue = evaluate(statement, environment, { uuid: scopeUUID });
      });

      environment.deleteScope(scopeUUID);

      return lastValue;
    }
    case 'expressionStmt': {
      return evaluate(val.expression, environment, scope);
    }
    case 'funcCallExpr': {
      const functionVal: { block: BlockExpr; parameterNames: string[] } | null = environment.read(
        val.name.literal as string,
        scope,
      ) as any;
      if (functionVal === null) {
        reportError('Function does not exist', {
          number: val.name.line,
          string: `Function "${val.name.literal}"`,
        });
      }

      const parameterNames: string[] = functionVal.parameterNames;
      const parameterValues = val.arguments.map((expr) => evaluate(expr, environment, scope));

      if (parameterNames.length !== parameterValues.length) {
        reportError('Arguments are not matching parameters', {
          number: val.name.line,
          string: `Function "${val.name.literal}"`,
        });
      }

      const args: LetStmt[] = parameterNames.map((name, index) => ({
        __kind: 'letStmt',
        initializer: {
          __kind: 'literalExpr',
          value: parameterValues[index],
        },
        name: {
          lexeme: name,
          line: val.name.line,
          literal: name,
          type: 'IDENTIFIER',
        },
      }));

      return evaluate(
        {
          __kind: 'blockExpr',
          statements: [...args, ...functionVal.block.statements],
        },
        environment,
        scope,
      );
    }
    case 'funcDefStmt': {
      environment.defineFunction(val, scope);
      return null;
    }
    case 'letStmt':
    case 'letMutStmt': {
      environment.define(val, evaluate(val.initializer, environment, scope), scope);
      return null;
    }
    case 'groupingExpr': {
      return evaluateGroupingExpr(val, environment, scope);
    }
    case 'literalExpr': {
      return evaluateLiteralExpr(val);
    }
    case 'printStmt': {
      const str = stringify(evaluate(val.expression, environment, scope));
      console.log(str);
      return null;
    }
    case 'reassignmentStmt': {
      environment.mutate(val, evaluate(val.expression, environment, scope), scope);
      return null;
    }
    case 'unaryExpr': {
      return evaluateUnaryExpr(val, environment, scope);
    }
    case 'variableExpr': {
      const value = (environment.read(val.name.literal as string, scope) as any)?.value ?? null;
      if (value === null) {
        reportError('Undefined variable', {
          number: val.name.line,
          string: `"${val.name.literal}"`,
        });
      }
      return value;
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

const evaluateGroupingExpr = (expr: GroupingExpr, environment: Environment, scope?: Scope): Expr =>
  evaluate(expr.expression, environment, scope);

const evaluateUnaryExpr = (expr: UnaryExpr, environment: Environment, scope?: Scope): boolean | number | never => {
  const right = evaluate(expr.right, environment, scope);

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

const evaluateBinaryExpr = (expr: BinaryExpr, environment: Environment, scope?: Scope): Nullable<Val> | never => {
  const left = evaluate(expr.left, environment, scope);
  const right = evaluate(expr.right, environment, scope);

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
