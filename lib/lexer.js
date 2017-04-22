(function (TokenType) {
    TokenType[TokenType["L_PAR"] = 0] = "L_PAR";
    TokenType[TokenType["R_PAR"] = 1] = "R_PAR";
    TokenType[TokenType["MINUS"] = 2] = "MINUS";
    TokenType[TokenType["PLUS"] = 3] = "PLUS";
    TokenType[TokenType["MUL"] = 4] = "MUL";
    TokenType[TokenType["DIV"] = 5] = "DIV";
    TokenType[TokenType["MOD"] = 6] = "MOD";
    TokenType[TokenType["POW"] = 7] = "POW";
    TokenType[TokenType["NUM"] = 8] = "NUM";
    TokenType[TokenType["ID"] = 9] = "ID";
    TokenType[TokenType["EOF"] = 10] = "EOF";
})(exports.TokenType || (exports.TokenType = {}));
var TokenType = exports.TokenType;
var Token = (function () {
    function Token(line, column, type, raw, value) {
        this.line = line;
        this.column = column;
        this.type = type;
        this.raw = raw;
        this.value = value;
    }
    return Token;
})();
var SIMPLE_TOKEN_MAPPING = {
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
var Lexer = (function () {
    function Lexer() {
        this.line = 0;
        this.col = -1;
        this.buffer = "";
    }
    Lexer.prototype.lex = function (src) {
        var _this = this;
        this.idx = 0;
        this.src = src;
        this.tokens = [];
        this.iterate(function (c, cc) {
            var lookup = SIMPLE_TOKEN_MAPPING[c];
            if (lookup !== undefined) {
                _this.createToken(lookup);
            }
            else if (cc >= 48 && cc <= 57) {
                _this.lexNumber();
            }
            else if ((cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122)) {
                _this.lexId();
            }
            return true;
        });
        return this.tokens;
    };
    Lexer.prototype.iterate = function (fn) {
        this.buffer = "";
        for (; this.idx < this.src.length + 1; this.idx++) {
            var c = this.idx == this.src.length ? "#" : this.src[this.idx];
            var cc = c.charCodeAt(0);
            if (c === "\n") {
                this.col = -1;
                this.line++;
                continue;
            }
            this.col++;
            this.buffer = this.buffer + c.trim();
            var shallContinue = fn(c, cc);
            if (!shallContinue) {
                this.idx--;
                this.buffer = this.buffer.substr(0, this.buffer.length - 1);
                break;
            }
        }
    };
    Lexer.prototype.lexNumber = function () {
        var _this = this;
        console.log("Lex Number");
        var dotsFound = 0;
        this.iterate(function (c, cc) {
            if (cc >= 48 && cc <= 57) {
                // pass
                return true;
            }
            else if (c === ".") {
                dotsFound++;
                if (dotsFound > 1) {
                    _this.throwError("Found more than one decimal separator in number token!");
                }
                return true;
            }
            else {
                return false;
            }
        });
        this.createToken(TokenType.NUM, parseFloat(this.buffer));
    };
    Lexer.prototype.lexId = function () {
        this.iterate(function (c, cc) {
            var isDigit = cc >= 48 && cc <= 57;
            var isLetter = (cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122);
            return isDigit || isLetter;
        });
        this.createToken(TokenType.NUM, parseFloat(this.buffer));
    };
    Lexer.prototype.createToken = function (type, value) {
        var t = new Token(this.line, this.col, type, this.buffer, value);
        this.tokens.push(t);
        this.buffer = "";
    };
    Lexer.prototype.throwError = function (msg) {
        throw new Error("(" + this.line + " | " + this.col + "): " + msg);
    };
    return Lexer;
})();
exports.Lexer = Lexer;
