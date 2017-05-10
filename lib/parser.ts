import {Token, TokenType, Lexer} from "./lexer";
import {OpNode, Node, OP_MAPPING, ValNode, IdNode} from "./evaluation";

type ExpectTuple = {
    token: Token,
    found: boolean
};

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
        const expectedTypes = [TokenType.PLUS, TokenType.MINUS, TokenType.L_PAR, TokenType.NUM, TokenType.ID, TokenType.NEGATE];
        const tuple = this.expect(expectedTypes, true);

        const tt = tuple.token.type;
        let head: Node;
        if (tt === TokenType.PLUS || tt === TokenType.MINUS || tt === TokenType.NEGATE) {
            head = this.parseCoherentExpr();

            if (tt !== TokenType.PLUS) {
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
            const node = this.parseLogExpr();
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