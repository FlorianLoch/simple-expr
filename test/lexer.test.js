const expect = require("chai").expect;

const Lexer = require("../lib/lexer.js").Lexer;
const TokenType = require("../lib/lexer.js").TokenType;

describe("Lexer", () => {
    let l;

    beforeEach(() => {
        l = new Lexer();
    });

    describe("lex", () => {
        it("should be able to handle simple lexing", () => {
            const expected = [[
                    "135.35", [{
                        tokenType: TokenType.NUM,
                        value: 135.35
                    }, {
                        tokenType: TokenType.EOF
                    }]
                ], [
                    "abc + 135.35 / (54 + d1)", [{
                        tokenType: TokenType.ID,
                        value: "abc"
                    }, {
                        tokenType: TokenType.PLUS
                    }, {
                        tokenType: TokenType.NUM,
                        value: 135.35
                    }, {
                        tokenType: TokenType.DIV 
                    }, {
                        tokenType: TokenType.L_PAR 
                    }, {
                        tokenType: TokenType.NUM,
                        value: 54
                    }, {
                        tokenType: TokenType.PLUS,
                    }, {
                        tokenType: TokenType.ID,
                        value: "d1"
                    }, {
                        tokenType: TokenType.R_PAR 
                    }, {
                        tokenType: TokenType.EOF
                    }]
                ]
            ];

            expected.forEach((item) => {
                const tokens = l.lex(item[0]);

                expect(tokens.length).to.be.equal(item[1].length);

                item[1].forEach((expectedToken, idx) => {
                    expect(tokens[idx].type).to.be.equal(expectedToken.tokenType);
                    if (expectedToken.value !== undefined) {
                        expect(tokens[idx].value).to.be.equal(expectedToken.value);
                    }
                });
            });
        });

        it("should be able to detect numbers containing multiple decimals separators", () => {
            const sample = "6472.23.23";

            expect(l.lex.bind(l, sample)).to.throw("(0 | 8): Found more than one decimal separator in number token!");
        });

        xit("should be able to handle '.' and ',' as decimal separators", () => {
            // TODO
        });
    });
});