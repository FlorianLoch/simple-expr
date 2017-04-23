const expect = require("chai").expect;

const Parser = require("../lib/parser.js").Parser;
const TokenType = require("../lib/lexer.js").TokenType;

describe("Parser", () => {
    let p;

    beforeEach(() => {
        p = new Parser();
    });

    describe("parse", () => {
        it("should be able to parse correct expressions", () => {
            const expected = [
                "35",
                "564.53+35/236--30*10^(8+3)"
            ];

            expected.forEach((item) => {
                const tokens = p.parse(item);

                expect(p.parse.bind(p, item)).not.to.throw();
            });
        });
    });
});