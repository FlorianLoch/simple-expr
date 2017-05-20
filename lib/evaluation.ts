import { TokenType } from "./lexer";

export enum Operator {
  PLUS,
  MINUS,
  DIV,
  MOD,
  MUL,
  POW,
  OR,
  AND,
  EQ,
  NE,
  GREATER,
  LOWER,
  GE,
  LE
};

export const OP_MAPPING = {};
OP_MAPPING[TokenType.PLUS] = Operator.PLUS;
OP_MAPPING[TokenType.MINUS] = Operator.MINUS;
OP_MAPPING[TokenType.DIV] = Operator.DIV;
OP_MAPPING[TokenType.MOD] = Operator.MOD;
OP_MAPPING[TokenType.MUL] = Operator.MUL;
OP_MAPPING[TokenType.POW] = Operator.POW;
OP_MAPPING[TokenType.OR] = Operator.OR;
OP_MAPPING[TokenType.AND] = Operator.AND;
OP_MAPPING[TokenType.EQ] = Operator.EQ;
OP_MAPPING[TokenType.NE] = Operator.NE;
OP_MAPPING[TokenType.GREATER] = Operator.GREATER;
OP_MAPPING[TokenType.LOWER] = Operator.LOWER;
OP_MAPPING[TokenType.GE] = Operator.GE;
OP_MAPPING[TokenType.LE] = Operator.LE;

const OP_PRINTABLE_CHAR_MAPPING = {};
OP_PRINTABLE_CHAR_MAPPING[Operator.PLUS] = "+";
OP_PRINTABLE_CHAR_MAPPING[Operator.MINUS] = "-";
OP_PRINTABLE_CHAR_MAPPING[Operator.DIV] = "/";
OP_PRINTABLE_CHAR_MAPPING[Operator.MOD] = "%";
OP_PRINTABLE_CHAR_MAPPING[Operator.MUL] = "*";
OP_PRINTABLE_CHAR_MAPPING[Operator.POW] = "^";
OP_PRINTABLE_CHAR_MAPPING[Operator.OR] = "||";
OP_PRINTABLE_CHAR_MAPPING[Operator.AND] = "&&";
OP_PRINTABLE_CHAR_MAPPING[Operator.EQ] = "==";
OP_PRINTABLE_CHAR_MAPPING[Operator.NE] = "!=";
OP_PRINTABLE_CHAR_MAPPING[Operator.GREATER] = ">";
OP_PRINTABLE_CHAR_MAPPING[Operator.LOWER] = "<";
OP_PRINTABLE_CHAR_MAPPING[Operator.GE] = ">=";
OP_PRINTABLE_CHAR_MAPPING[Operator.LE] = "<=";

const OP_CALC_MAPPING_NUM = {};
OP_CALC_MAPPING_NUM[Operator.PLUS] = (a: number, b: number) => {
  return a + b;
};
OP_CALC_MAPPING_NUM[Operator.MINUS] = (a: number, b: number) => {
  return a - b;
};
OP_CALC_MAPPING_NUM[Operator.DIV] = (a: number, b: number) => {
  return a / b;
};
OP_CALC_MAPPING_NUM[Operator.MOD] = (a: number, b: number) => {
  return a % b;
};
OP_CALC_MAPPING_NUM[Operator.MUL] = (a: number, b: number) => {
  return a * b;
};
OP_CALC_MAPPING_NUM[Operator.POW] = (a: number, b: number) => {
  return Math.pow(a, b);
};
OP_CALC_MAPPING_NUM[Operator.EQ] = (a: number, b: number) => {
  return a === b;
};
OP_CALC_MAPPING_NUM[Operator.NE] = (a: number, b: number) => {
  return a !== b;
};
OP_CALC_MAPPING_NUM[Operator.GREATER] = (a: number, b: number) => {
  return a > b;
};
OP_CALC_MAPPING_NUM[Operator.LOWER] = (a: number, b: number) => {
  return a < b;
};
OP_CALC_MAPPING_NUM[Operator.GE] = (a: number, b: number) => {
  return a >= b;
};
OP_CALC_MAPPING_NUM[Operator.LE] = (a: number, b: number) => {
  return a <= b;
};

const OP_CALC_MAPPING_BOOL = {};
OP_CALC_MAPPING_BOOL[Operator.OR] = (a: boolean, b: boolean) => {
  return (a === true) || (b === true);
};
OP_CALC_MAPPING_BOOL[Operator.AND] = (a: boolean, b: boolean) => {
  return (a === true) && (b === true);
};
OP_CALC_MAPPING_BOOL[Operator.EQ] = (a: boolean, b: boolean) => {
  return a === b;
};
OP_CALC_MAPPING_BOOL[Operator.NE] = (a: boolean, b: boolean) => {
  return a !== b;
};

export type OpTupel = {
  op: Operator,
  operand: Node
};

export interface EvaluateCallback { (resolved: number | boolean): void }

const PREDEFINED_IDS = {
  "false": false,
  "true": true,
  "pi": Math.PI,
  "e": Math.E,
  "sqrt2": Math.SQRT2
};

export abstract class IDResolver {
  protected abstract _resolve(id: string, cb: EvaluateCallback): void;

  public resolve(id: string, cb: EvaluateCallback): void {
    const lookup = PREDEFINED_IDS[id.toLowerCase()];

    if (lookup !== undefined) {
      cb(lookup);
      return;
    }

    this._resolve(id, cb);
  }
}

export abstract class Node {
  private negativeSign = false;

  public setNegativeSign() {
    this.negativeSign = true;
  }

  public hasNegativeSign(): boolean {
    return this.negativeSign;
  }

  public eval(next: EvaluateCallback, resolver?: IDResolver, shortcircuit?: boolean): void {
    if (resolver === undefined) {
      resolver = new class extends IDResolver {
        protected _resolve(id: string, cb: EvaluateCallback): void {
          throw new Error("No IDResolver defined! IDs cannot be resolved therefore!");
        }
      };
    }

    if (shortcircuit === undefined) {
      shortcircuit = true;
    }

    if (this.negativeSign) {
      this.evaluate((res: number | boolean) => {
        next(typeof res == "number" ? -res : !res);
      }, resolver, shortcircuit);
    }

    this.evaluate(next, resolver, shortcircuit);
  }

  // Never call this method, always call eval() instead. This is just internally called by eval()!
  protected abstract evaluate(next: EvaluateCallback, resolver: IDResolver, shortcircuit: boolean): void;

  public abstract stringify(depth?: number): string;
}

function whitespace(length: number) {
  let ws = "";
  for (let i = 0; i < length; i++) {
    ws += " ";
  }
  return ws;
}

export class OpNode extends Node {
  private operations: OpTupel[] = [];

  constructor(public head: Node) {
    super();
  }

  public addOperation(operation: OpTupel) {
    this.operations.push(operation);
  }

  protected evaluate(next: EvaluateCallback, resolver: IDResolver, shortcircuit: boolean): void {
    const self = this;
    let typeOfHead;

    this.head.eval(step.bind(null, 0), resolver);

    function step(idx: number, prevValue: number | boolean) {
      if (idx === self.operations.length) {
        return next(prevValue);
      }

      const { op, operand } = self.operations[idx];

      // shortcircuit AND
      if (shortcircuit && op == Operator.AND && !prevValue) {
        console.log("Shortcircuited");
        return step(++idx, false);          
      }

      // shortcircuit OR
      if (shortcircuit && op == Operator.OR && prevValue) {
        return step(++idx, true);
      }

      return operand.eval((value: number | boolean) => {
        let handler = OP_CALC_MAPPING_NUM[op]
        if (handler !== undefined) {
          if (typeof value !== "number" || typeof value !== typeof prevValue) {
            throw new Error("Cannot use '" + value + "' and '" + prevValue + "' as operands for '" + OP_PRINTABLE_CHAR_MAPPING[op] + "'. Type 'number' expected.");
          }
        }
        else {
          if (typeof value !== "boolean" || typeof value !== typeof prevValue) {
            throw new Error("Cannot use '" + value + "' and '" + prevValue + "' as operands for '" + OP_PRINTABLE_CHAR_MAPPING[op] + "'. Type 'boolean' expected.");
          }
          handler = OP_CALC_MAPPING_BOOL[op];
        }

        const newValue = handler(prevValue, value);

        return step(++idx, newValue);
      }, resolver);
    }
  };

  public stringify(depth = 0): string {
    let str = "";

    // Give a hint if this is the root node
    if (depth === 0) {
      str = "--- ROOT NODE ---\n";
    }

    depth += 2;

    str += "OpNode (" + (this.operations.length + 1) + " operand(s))\n";
    str += whitespace(depth) + this.head.stringify(depth) + "\n";

    this.operations.forEach((item: OpTupel) => {
      str += whitespace(depth) + OP_PRINTABLE_CHAR_MAPPING[item.op] + " " + item.operand.stringify(depth + 2) + "\n";
    });

    return str;
  }
}

export class ValNode extends Node {
  constructor(public value: number | boolean) {
    super();
  };

  protected evaluate(next: EvaluateCallback, resolver: IDResolver): void {
    next(this.value);
  };

  public stringify(depth = 0): string {
    return `ValNode (value: ${this.hasNegativeSign() ? (typeof this.value == "number" ? "-" : "!") : ""}${this.value})`;
  }
}

export class IdNode extends Node {
  constructor(public name: string) {
    super();
  };

  protected evaluate(next: EvaluateCallback, resolver: IDResolver): void {
    resolver.resolve(this.name, (resolved: number | boolean) => {
      next(resolved);
    });
  };

  public stringify(depth = 0): string {
    return `IdNode (name: ${this.name})`;
  }
}