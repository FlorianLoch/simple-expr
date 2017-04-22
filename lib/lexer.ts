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
    EOF
}

class Token {
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
    "#": TokenType.EOF
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
        this.src = src;
        this.tokens = [];

        this.iterate((c: string, cc: number): boolean  => {
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

    private iterate(fn: (c: string, cc: number) => boolean) {
        this.buffer = "";

        for (; this.idx < this.src.length + 1; this.idx++) {
            const c = this.idx == this.src.length ? "#" : this.src[this.idx];
            const cc = c.charCodeAt(0);

            if (c === "\n") {
                this.col = -1;
                this.line++;
                continue;
            }
        
            this.col++;


            this.buffer = this.buffer + c.trim();

            const shallContinue = fn(c, cc);

            if (!shallContinue) {
                this.idx--;
                this.buffer = this.buffer.substr(0, this.buffer.length - 1)
                break;
            }
        }      
    }

    private lexNumber() {
        console.log("Lex Number");

        let dotsFound = 0;

        this.iterate((c: string, cc: number): boolean => {
            if (cc >= 48 && cc <= 57) {
                // pass
                return true;
            }
            else if (c === ".") {
                dotsFound++;

                if (dotsFound > 1) {
                    this.throwError("Found more than one decimal separator in number token!");
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

        this.createToken(TokenType.NUM, parseFloat(this.buffer));        
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