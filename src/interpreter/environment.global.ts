import { Environment } from './environment';
import { stringify } from './interpreter';
import { Expr } from './parser/types';
import { Literal } from './scanner/types';

export const globalEnvironment: Environment = new Environment({ enclosingEnv: null });

globalEnvironment.define(
  'log',
  {
    arity: 0,
    call: (args: Literal[], callee: Expr) => {
      args.forEach((arg) => {
        console.log(stringify(arg));
      });

      return {
        __kind: 'literalExpr',
        value: null,
      };
    },
  },
  'immutable',
);
