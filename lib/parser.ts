import {Token, TokenType, Lexer} from "./lexer";

type ExpectTuple = {
    token: Token,
    found: boolean
};

export class Parser {
    private rewindBuffer = [];
    public tokens: Token[];

    public parse(src: string) {
        const lex = new Lexer();
        this.tokens = lex.lex(src);

        console.log(this.tokens);

        this.parseE();
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

    private parseE() {
        this.parseAddExpr();
        this.expect(TokenType.EOF, true);
    }

    private parseAddExpr() {
        this.parseMulExpr();

        let t;
        while ((t = this.expect([TokenType.PLUS, TokenType.MINUS])).found) {
            this.parseMulExpr();
        }

        this.rewind();
    }

    private parseMulExpr() {
        this.parsePowerExpr();

        let t;
        while ((t = this.expect([TokenType.MUL, TokenType.DIV, TokenType.MOD])).found) {
            this.parsePowerExpr();
        }

        this.rewind();        
    }

    private parsePowerExpr() {
        this.parseSignedExpr();

        let t;
        while ((t = this.expect(TokenType.POW)).found) {
            this.parseSignedExpr();
        }

        this.rewind();        
    }

    private parseSignedExpr() {
        const expectedTypes = [TokenType.PLUS, TokenType.MINUS, TokenType.L_PAR, TokenType.NUM, TokenType.ID];
        const tuple = this.expect(expectedTypes, true);

        const tt = tuple.token.type;
        if (tt === TokenType.PLUS || tt === TokenType.MINUS) {
            this.parseCoherentExpr();
        }
        else {
            this.rewind();
            this.parseCoherentExpr();
        }
    }

    private parseCoherentExpr() {
        const expectedTypes = [TokenType.L_PAR, TokenType.NUM, TokenType.ID];
        const tuple = this.expect(expectedTypes, true);

        if (tuple.token.type === TokenType.L_PAR) {
            this.parseAddExpr();
            this.expect(TokenType.R_PAR, true);
        }
    }
}