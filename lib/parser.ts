import {Token, TokenType, Lexer} from "./lexer";

type ExpectTuple = {
    token: Token,
    found: boolean
};

enum Operator {
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

const OP_MAPPING = {};
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

const OP_CALC_MAPPING = {};
OP_CALC_MAPPING[Operator.PLUS] = (a: number, b: number) => {
    return a + b;
};
OP_CALC_MAPPING[Operator.MINUS] = (a: number, b: number) => {
    return a - b;
};
OP_CALC_MAPPING[Operator.DIV] = (a: number, b: number) => {
    return a / b;
};
OP_CALC_MAPPING[Operator.MOD] = (a: number, b: number) => {
    return a % b;
};
OP_CALC_MAPPING[Operator.MUL] = (a: number, b: number) => {
    return a * b;
};
OP_CALC_MAPPING[Operator.POW] = (a: number, b: number) => {
    return Math.pow(a, b);
};
OP_CALC_MAPPING[Operator.OR] = (a: number, b: number) => {
    return a || b;
};
OP_CALC_MAPPING[Operator.AND] = (a: number, b: number) => {
    return a && b;
};
OP_CALC_MAPPING[Operator.EQ] = (a: number, b: number) => {
    return a === b;
};
OP_CALC_MAPPING[Operator.NE] = (a: number, b: number) => {
    return a !== b;
};
OP_CALC_MAPPING[Operator.GREATER] = (a: number, b: number) => {
    return a > b;
};
OP_CALC_MAPPING[Operator.LOWER] = (a: number, b: number) => {
    return a < b;
};
OP_CALC_MAPPING[Operator.GE] = (a: number, b: number) => {
    return a >= b;
};
OP_CALC_MAPPING[Operator.LE] = (a: number, b: number) => {
    return a <= b;
};

type OpTupel = {
    op: Operator,
    operand: Node
};

export interface EvaluateCallback { (resolved: number | boolean): void }
// TODO make abstract class that automatically resolves true and false to its boolean representation
export interface IDResolver { (id: string, cb: EvaluateCallback): void }

export abstract class Node {
    private negativeSign = false;

    public setNegativeSign() {
        this.negativeSign = true;
    }

    public hasNegativeSign(): boolean {
        return this.negativeSign;
    }

    public eval(next: EvaluateCallback, resolver?: IDResolver): void {
        if (resolver === undefined) {
            resolver = (id: string): number => {
                throw new Error("No IDResolver defined! IDs cannot be resolved therefore!");
            };
        }

        if (this.negativeSign) {
            this.evaluate((res: number | boolean) => {
                next(typeof res == "number" ? -res : !res);
            }, resolver);
        }

        this.evaluate(next, resolver);
    }

    // Never call this method, always call eval() instead. This is just internally called by eval()!
    protected abstract evaluate(next: EvaluateCallback, resolver: IDResolver): void;

    public abstract stringify(depth?: number): string;
}

function whitespace(length: number) {
    let ws = "";
    for (let i = 0; i < length; i++) {
        ws += " ";
    }
    return ws;
}

class OpNode extends Node {
    private operations: OpTupel[] = [];

    constructor(public head: Node) {
        super();
    }

    public addOperation(operation: OpTupel) {
        this.operations.push(operation);
    }

    protected evaluate(next: EvaluateCallback, resolver: IDResolver): void {
        const self = this;

        this.head.eval(step.bind(null, 0), resolver);

        function step(idx: number, prevValue: number) {
            if (idx === self.operations.length) {
                return next(prevValue);
            }

            const {op, operand} = self.operations[idx];

            return operand.eval((value: number | boolean) => {
                // TODO Check coercion, throw error if not convertible (probably we should not do any implicit conversions!)

                const newValue = OP_CALC_MAPPING[op](prevValue, value);

                // evaluate with shortcircuit if enabled and possible
                // TODO

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

class ValNode extends Node {
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

class IdNode extends Node {
    constructor(public name: string) {
        super();
    };

    protected evaluate(next: EvaluateCallback, resolver: IDResolver): void {
        resolver(this.name, (resolved: number) => {
            next(resolved);
        });
    };

    public stringify(depth = 0): string {
        return `IdNode (name: ${this.name})`;
    }
}

export class Parser {
    private rewindBuffer = [];
    public tokens: Token[];

    public parse(src: string): Node {
        const lex = new Lexer();
        this.tokens = lex.lex(src);

        const rootNode = this.parseE();

        return rootNode;
    }

    private nextToken(): Token {
        if (this.tokens.length === 0) {
            throw new Error("Cannot get next token! End of token stream reached already!");
        }

        const t = this.tokens.shift();
        this.rewindBuffer.push(t);
        return t;
    }

    private rewind() {
        if (this.rewindBuffer.length === 0) {
            throw new Error("Cannot rewind! RewindBuffer is already empty!");
        }

        this.tokens.unshift(this.rewindBuffer.pop());
    }

    private expect(typesParam: TokenType[] | TokenType, throwWhenNotFound = false): ExpectTuple {
        let types: TokenType[];
        if (!(Array.isArray(typesParam))) {
            types = [<TokenType> typesParam];
        }
        else {
            types = <TokenType[]> typesParam;
        }

        const t = this.nextToken();

        const expectedTokenFound = types.some((type): boolean => {
            return type === t.type;
        });

        if (!expectedTokenFound && throwWhenNotFound) {
            const expectedTypesStr = types.reduce(<any>((prev: string, cur: TokenType, idx: number): string => {
                return prev + TokenType[cur] + (idx + 1 < types.length ? ", " : "");
            }), "");

            throw new Error(`Expected "${expectedTypesStr}" but found ${TokenType[t.type]} at (${t.line}|${t.column}).`);
        }

        return {
            token: t,
            found: expectedTokenFound
        };
    }

    private parseE(): Node {
        const rootNode = this.parseLogExpr();
        this.expect(TokenType.EOF, true);

        return rootNode;
    }

    private parseLogExpr(): OpNode {
        const node = this.parseRelExpr();

        let t;
        while ((t = this.expect([TokenType.OR, TokenType.AND])).found) {
            const nextNode = this.parseRelExpr();
            node.addOperation({
                op: OP_MAPPING[t.token.type],
                operand: nextNode
            });
        }

        this.rewind();

        return node;
    }

    private parseRelExpr(): OpNode {
        const node = this.parseAddExpr();

        let t;
        while ((t = this.expect([TokenType.EQ, TokenType.NE, TokenType.GREATER, TokenType.LOWER, TokenType.GE, TokenType.LE])).found) {
            const nextNode = this.parseAddExpr();
            node.addOperation({
                op: OP_MAPPING[t.token.type],
                operand: nextNode
            });
        }

        this.rewind();

        return node;
    }

    private parseAddExpr(): OpNode {
        const node = this.parseMulExpr();

        let t;
        while ((t = this.expect([TokenType.PLUS, TokenType.MINUS])).found) {
            const nextNode = this.parseMulExpr();
            node.addOperation({
                op: OP_MAPPING[t.token.type],
                operand: nextNode
            });
        }

        this.rewind();

        return node;
    }

    private parseMulExpr(): OpNode {
        const node = this.parsePowerExpr();

        let t;
        while ((t = this.expect([TokenType.MUL, TokenType.DIV, TokenType.MOD])).found) {
            const nextNode = this.parsePowerExpr();
            node.addOperation({
                op: OP_MAPPING[t.token.type],
                operand: nextNode
            });
        }

        this.rewind();

        return node;
    }

    private parsePowerExpr(): OpNode {
        const node = this.parseSignedExpr();

        let t;
        while ((t = this.expect(TokenType.POW)).found) {
            const nextNode = this.parseSignedExpr();
            node.addOperation({
                op: OP_MAPPING[t.token.type],
                operand: nextNode
            });
        }

        this.rewind();

        return node;
    }

    private parseSignedExpr(): OpNode {
        const expectedTypes = [TokenType.PLUS, TokenType.MINUS, TokenType.L_PAR, TokenType.NUM, TokenType.ID];
        const tuple = this.expect(expectedTypes, true);

        const tt = tuple.token.type;
        let head: Node;
        if (tt === TokenType.PLUS || tt === TokenType.MINUS) {
            head = this.parseCoherentExpr();

            if (tt === TokenType.MINUS) {
                head.setNegativeSign();
            }
        }
        else {
            this.rewind();
            head = this.parseCoherentExpr();
        }

        const node = new OpNode(head);
        return node;
    }

    private parseCoherentExpr(): Node {
        const expectedTypes = [TokenType.L_PAR, TokenType.NUM, TokenType.ID];
        const tuple = this.expect(expectedTypes, true);

        const tt = tuple.token.type;
        if (tt === TokenType.L_PAR) {
            const node = this.parseAddExpr();
            this.expect(TokenType.R_PAR, true);
            return node;
        }
        else if (tt === TokenType.NUM) {
            return new ValNode(<number> tuple.token.value);
        }
        else if (tt === TokenType.ID) {
            return new IdNode(<string> tuple.token.value);
        }
    }
}