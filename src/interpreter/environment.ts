import { createFunc } from './interpreter';

import { reportError } from '../utils/report-error';

import { Token } from './scanner/types';

type EnvField = {
  isMutable: boolean;
  value: boolean | null | number | string | ReturnType<typeof createFunc>;
};

export class Environment {
  private enclosingEnv: Environment;
  private values: Record<string, EnvField> = {};

  constructor({ enclosingEnv }: { enclosingEnv: Environment | null }) {
    this.enclosingEnv = enclosingEnv;
  }

  define = (name: string, value: EnvField['value'], mutability: 'immutable' | 'mutable'): void | never => {
    if (this.values[name] !== undefined) {
      reportError(`Cannot reassign variable "${name}"`);
    }

    this.values[name] = {
      isMutable: mutability === 'mutable',
      value,
    };
  };

  get = (name: Token): EnvField['value'] | never => {
    const field = this.values[name.lexeme];

    if (field !== undefined) {
      return field.value;
    }

    if (this.enclosingEnv) {
      return this.enclosingEnv.get(name);
    }

    reportError('Undefined variable', { number: name.line, string: name.lexeme });
  };

  mutate = (name: Token, value: EnvField['value']): void | never => {
    const field = this.values[name.lexeme];
    if (field !== undefined) {
      if (field.isMutable) {
        this.values[name.lexeme].value = value;
        return;
      }

      reportError('Variable is immutable. It can be made mutable by declaring it with "let mut"', {
        number: name.line,
        string: name.lexeme,
      });
    }

    if (this.enclosingEnv) {
      this.enclosingEnv.mutate(name, value);
      return;
    }

    reportError('Undefined variable', { number: name.line, string: name.lexeme });
  };
}
