import { reportError } from '../utils/report-error';

import { LetMutStmt, LetStmt, ReassignmentStmt, Scope, FuncDefStmt, BlockExpr, VariableExpr } from './parser/types';
import { Literal } from './scanner/types';

type FunctionType = {
  block: BlockExpr;
  parameterNames: string[];
};

type Variable = {
  isMutable: boolean;
  value: string | number | boolean | null;
};

type GlobalState = Record<string, FunctionType | Variable>;
type ScopedState = Record<Scope['uuid'], Record<string, FunctionType | Variable>>;

export class Environment {
  private globalState: GlobalState = {};
  private scopedState: ScopedState = {};

  createScope = (uuid: string): void => {
    this.scopedState[uuid] = {};
  };

  deleteScope = (uuid: string): void => {
    delete this.scopedState[uuid];
  };

  define = (stmt: LetMutStmt | LetStmt, value: Variable['value'], scope?: Scope): never | void => {
    const key = stmt.name.literal as string;
    const line = stmt.name.line;

    const state = this.getState(scope);

    if (Object.prototype.hasOwnProperty.call(state, key)) {
      reportError('Variable has already been defined', {
        number: line,
        string: `at "${key}"`,
      });
    }

    state[key as string] = {
      isMutable: stmt.__kind === 'letMutStmt',
      value,
    };
  };

  defineFunction = (stmt: FuncDefStmt, scope?: Scope): never | void => {
    const key = stmt.name.literal as string;
    const line = stmt.name.line;

    const state = this.getState(scope);

    if (Object.prototype.hasOwnProperty.call(state, key)) {
      reportError('Function has already been defined', {
        number: line,
        string: `at "${key}"`,
      });
    }

    if (stmt.parameters.some((param) => param.__kind !== 'variableExpr')) {
      reportError(`Invalid parameter for function "${stmt.name.literal}"`, {
        number: line,
        string: 'Parameter names must start with a letter or an underscore. Reserved keywords are disallowed.',
      });
    }

    const parameterNames = (stmt.parameters as VariableExpr[]).map((token) => token.name.literal);

    state[key] = {
      block: stmt.block,
      parameterNames,
    } as FunctionType;
  };

  read = (key: string, scope?: Scope): FunctionType | Variable => {
    const readFunc = scope ? this.readScoped(scope) : this.readGlobal;
    return readFunc(key);
  };

  mutate = (stmt: ReassignmentStmt, value: Variable['value'], scope?: Scope): void => {
    if (scope) {
      this.mutateScoped(stmt, value, scope);
    } else {
      this.mutateGlobal(stmt, value);
    }
  };

  private getState = (scope?: Scope): GlobalState | ScopedState | null => {
    if (!scope) {
      return this.globalState;
    }

    return this.scopedState[scope.uuid] ?? null;
  };

  private mutateGlobal = (stmt: ReassignmentStmt, value: Variable['value']): void => {
    const key = stmt.name.literal as string;
    const line = stmt.name.line;

    const val = this.globalState[key] ?? null;

    if (val === null) {
      this.reportMissingDeclaration(line, key);
    }

    // @ts-ignore
    if (!val.isMutable) {
      this.reportDisallowedMutation(line, key);
    }

    // @ts-ignore
    this.globalState[key].value = value;
  };

  private mutateScoped = (stmt: ReassignmentStmt, value: Variable['value'], scope: Scope): never | void => {
    const key = stmt.name.literal as string;
    const line = stmt.name.line;

    const val = this.scopedState[scope.uuid]?.[key] as Variable;

    if (val) {
      if (!val.isMutable) {
        this.reportDisallowedMutation(line, key);
      }

      val.value = value;
      return;
    }

    this.mutateGlobal(stmt, value);
  };

  private readGlobal = (key: string): FunctionType | Variable => {
    return this.globalState[key] ?? null;
  };

  private readScoped = (scope: Scope) => (key: string): FunctionType | Variable => {
    const state = this.scopedState[scope.uuid];
    const value = state[key] ?? null;
    if (value) {
      return value;
    }

    let parent = scope.parentScope;
    while (parent) {
      const value = this.scopedState[parent.uuid][key] ?? null;
      if (value === null) {
        parent = parent.parentScope;
      } else {
        return value;
      }
    }

    return this.globalState[key] ?? null;
  };

  private reportDisallowedMutation = (line: number, key: Literal): void => {
    reportError('Immutable variable cannot be mutated', {
      number: line,
      string: `Declare variable "${key}" with "let mut" to allow mutation.`,
    });
  };

  private reportMissingDeclaration = (line: number, key: Literal): void => {
    reportError('Variable needs to be declared before being assigned a value', {
      number: line,
      string: `Declare variable "${key}" with "let" or "let mut"`,
    });
  };
}
