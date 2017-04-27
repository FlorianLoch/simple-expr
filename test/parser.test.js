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
                 expect(p.parse.bind(p, item)).not.to.throw();
            });
        });
    });

    describe("eval", () => {
        it("should compute the correct value of an expression", (done) => {
            const expected = [
                ["45*2-10/2^2", 87.5],
                ["2*abc", 8]
            ];

            const varLookup = {
                "abc": 4
            };

            step(0);

            function step(idx) {
                if (idx === expected.length) {
                    return done();
                }

                const item = expected[idx];
                const rootNode = p.parse(item[0]);

                return rootNode.eval(function next(result) {
                    expect(result).to.be.equal(item[1]);
                    return step(++idx);
                }, function varResolver(varName, next){
                    return next(varLookup[varName]);
                });
            }
        });
    });
});