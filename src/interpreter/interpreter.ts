import { reportError } from '../utils/report-error';

import { Environment } from './environment';
import { globalEnvironment } from './environment.global';
import {
  BinaryExpr,
  Expr,
  FuncDefStmt,
  GroupingExpr,
  Literal,
  LiteralExpr,
  Stmt,
  UnaryExpr,
  VariableExpr,
} from './parser/types';
import { Token } from './scanner/types';

type Nullable<T> = { [P in keyof T]: T[P] | null };

type Val = boolean | number | string | 'nil' | 'true' | 'false';

export const interpret = (statements: Stmt[]): void | never => {
  try {
    const environment = new Environment({ enclosingEnv: globalEnvironment });

    statements.forEach((statement: Stmt): void => {
      evaluate(statement, environment);
    });
    // eslint-disable-next-line
  } catch (_error) {}
};

export const createFunc = (
  stmt: FuncDefStmt,
  closure: Environment,
): { arity: number; call: (args: Literal[], callee: Expr) => Expr } => {
  const arity = stmt.parameters.length;

  return {
    arity,
    call: (args: Literal[], callee: Expr): Expr => {
      if (arity !== args.length) {
        let errorMsg: string;
        if (arity > args.length) {
          errorMsg = 'Missing argument';
        } else {
          errorMsg = 'Too many arguments';
        }
        reportError(errorMsg, {
          number: (callee as any).name.line,
          string: `Function "${(callee as any).name.lexeme}"`,
        });
      }

      const environment = new Environment({ enclosingEnv: closure });

      for (let i = 0; i < stmt.parameters.length; i++) {
        const param: VariableExpr = stmt.parameters[i];
        const value = args[i];
        environment.define(param.name.lexeme, value, 'immutable');
      }

      return evaluate(stmt.block, environment);
    },
  };
};

export const evaluate = (val: Expr | Stmt, environment: Environment): any => {
  switch (val.__kind) {
    case 'binaryExpr': {
      return evaluateBinaryExpr(val, environment);
    }
    case 'blockExpr': {
      const blockEnvironment = new Environment({ enclosingEnv: environment });

      let lastValue = null;
      val.statements.forEach((statement) => {
        lastValue = evaluate(statement, blockEnvironment);
      });

      return lastValue;
    }
    case 'expressionStmt': {
      return evaluate(val.expression, environment);
    }
    case 'callExpr': {
      const callee: Expr = val.callee;

      if (callee.__kind === 'variableExpr') {
        const args: Literal[] = [];

        val.arguments.forEach((arg: Expr) => {
          args.push(evaluate(arg, environment));
        });

        const func = environment.get(callee.name) as ReturnType<typeof createFunc>;
        return func.call(args, callee);
      }

      const argsArrays: Literal[][] = [];
      const callees: Expr[] = [];

      let currentCallee = val;
      let index = 0;
      let shouldLoop = true;
      while (shouldLoop) {
        argsArrays[index] = [];
        currentCallee.arguments.forEach((arg: Expr) => {
          argsArrays[index].push(evaluate(arg, environment));
        });

        // @ts-ignore
        currentCallee = currentCallee.callee;
        callees.push(currentCallee);
        index++;
        // @ts-ignore
        if (currentCallee.__kind === 'variableExpr') {
          shouldLoop = false;
        }
      }

      // @ts-ignore
      let func = environment.get((currentCallee as VariableExpr).name) as ReturnType<typeof createFunc>;
      argsArrays.forEach((args, index) => {
        // @ts-ignore
        func = func.call(args, callees[index]);
      });
      return func;
    }
    case 'funcDefStmt': {
      environment.define(val.name.lexeme, createFunc(val, environment), 'immutable');
      return null;
    }
    case 'ifExpr': {
      const { branches } = val;

      for (let i = 0; i < branches.length; i++) {
        const { block, condition } = branches[i];

        // Else branch
        if (condition === null) {
          return evaluate(block, environment);
        }

        const evaluatedCondition = evaluate(condition, environment);
        if (isTruthy(evaluatedCondition)) {
          return evaluate(block, environment);
        }
      }
      return null;
    }
    case 'letStmt':
    case 'letMutStmt': {
      environment.define(
        val.name.lexeme,
        evaluate(val.initializer, environment),
        val.__kind === 'letMutStmt' ? 'mutable' : 'immutable',
      );
      return null;
    }
    case 'groupingExpr': {
      return evaluateGroupingExpr(val, environment);
    }
    case 'literalExpr': {
      return evaluateLiteralExpr(val);
    }
    case 'printStmt': {
      const str = stringify(evaluate(val.expression, environment));
      console.log(str);
      return null;
    }
    case 'reassignmentStmt': {
      environment.mutate(val.name, evaluate(val.expression, environment));
      return null;
    }
    case 'unaryExpr': {
      return evaluateUnaryExpr(val, environment);
    }
    case 'variableExpr': {
      const value = environment.get(val.name);
      return value;
    }
  }
};

export const stringify = (object: Nullable<Val>): string => {
  if (object === null) {
    return 'nil';
  }

  return String(object);
};

const isTruthy = (object: Nullable<Val>): boolean => {
  if (object === null || object === false || object === 'nil') {
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

const evaluateGroupingExpr = (expr: GroupingExpr, environment: Environment): Expr =>
  evaluate(expr.expression, environment);

const evaluateUnaryExpr = (expr: UnaryExpr, environment: Environment): boolean | number | never => {
  const right = evaluate(expr.right, environment);

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

const evaluateBinaryExpr = (expr: BinaryExpr, environment: Environment): Nullable<Val> | never => {
  const left = evaluate(expr.left, environment);
  const right = evaluate(expr.right, environment);

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
