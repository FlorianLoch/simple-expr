export enum TokenType {
    L_PAR,
    R_PAR,
    MINUS,
    PLUS,
    MUL,
    DIV,
    MOD,
    POW,
    NUM,
    ID,
    EOF,
    NEGATE,
    OR,
    AND,
    GREATER,
    GE,
    EQ,
    NE,
    LOWER,
    LE
}

export class Token {
    constructor(public line: number, public column: number, public type: TokenType, public raw: string, public value: number | string) {}
}

const SIMPLE_TOKEN_MAPPING = {
    "(": TokenType.L_PAR,
    ")": TokenType.R_PAR,
    "+": TokenType.PLUS,
    "-": TokenType.MINUS,
    "/": TokenType.DIV,
    "%": TokenType.MOD,
    "*": TokenType.MUL,
    "^": TokenType.POW,
    "#": TokenType.EOF,
    "!": TokenType.NEGATE,
    "||": TokenType.OR,
    "&&": TokenType.AND,
    ">": TokenType.GREATER,
    ">=": TokenType.GE,
    "==": TokenType.EQ,
    "!=": TokenType.NE,
    "<": TokenType.LOWER,
    "<=": TokenType.LE
};

export class Lexer {
    private line = 0;
    private col = -1;
    private buffer = "";
    private tokens: Token[];
    private idx: number;
    private src: string;

    public lex(src: string): Token[] {
        this.idx = 0;
        this.src = src + "#";
        this.tokens = [];

        let skipNext = false;

        this.iterate((c: string, cc: number, tail: string): boolean  => {
            // Skip this char in case we found a two char long operator in the last round
            if (skipNext) {
                skipNext = false;
                return true;
            }

            const lookup2Chars = SIMPLE_TOKEN_MAPPING[tail.substr(0, 2)];

            if (lookup2Chars !== undefined) {
                this.createToken(lookup2Chars);
                skipNext = true;
                return true;
            }

            const lookup = SIMPLE_TOKEN_MAPPING[c];

            if (lookup !== undefined) {
                this.createToken(lookup);
            }
            else if (cc >= 48 && cc <= 57) {
                this.lexNumber();
            }
            else if ((cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122)) {
                this.lexId();
            }

            return true;
        });

        return this.tokens;
    }

    private iterate(fn: (c: string, cc: number, tail: string) => number | boolean) {
        this.buffer = "";

        for (; this.idx < this.src.length; this.idx++) {
            const c = this.src[this.idx];
            const cc = c.charCodeAt(0);
            const tail = this.src.substr(this.idx);

            if (c === "\n") {
                this.col = -1;
                this.line++;
                continue;
            }

            this.col++;

            const trimmedC = c.trim();
            this.buffer = this.buffer + trimmedC;

            const shallContinue = fn(c, cc, tail);

            if (!shallContinue) {
                this.idx--;
                // Just remove the last character if we actually added the current char (i.e. it wasn't just whitespace)
                if (trimmedC.length === 1) {
                    this.buffer = this.buffer.substr(0, this.buffer.length - 1)
                }
                break;
            }
        }
    }

    private lexNumber() {
        let dotsFound = 0;
        let esFound = 0;

        this.iterate((c: string, cc: number): boolean => {
            if (cc >= 48 && cc <= 57) {
                // pass
                return true;
            }
            else if (c === ".") {
                dotsFound++;

                if (esFound > 0) {
                    this.throwError("Decimal separator not allowed after start of exponential notation (e.g. 2E3.1 is not allowed!)");
                }

                if (dotsFound > 1) {
                    this.throwError("Found more than one decimal separator in number token!");
                }

                return true;
            }
            else if (c === "e" || c === "E") {
                esFound++;

                if (esFound > 1) {
                    this.throwError("Found more than exponent notation beginning (e.g. 2E3)!");
                }

                return true;
            }
            else {
                return false;
            }
        });

        this.createToken(TokenType.NUM, parseFloat(this.buffer));
    }

    private lexId() {
        this.iterate((c: string, cc: number): boolean => {
            const isDigit = cc >= 48 && cc <= 57;
            const isLetter = (cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122);

            return isDigit || isLetter;
        });

        this.createToken(TokenType.ID, this.buffer);
    }

    private createToken(type: TokenType, value?: string | number): void {
        const t = new Token(this.line, this.col, type, this.buffer, value);

        this.tokens.push(t);
        this.buffer = "";
    }

    private throwError(msg: string) {
        throw new Error(`(${this.line} | ${this.col}): ${msg}`);
    }
}