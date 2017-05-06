const expect = require("chai").expect;

const Parser = require("../lib/parser.js").Parser;
const TokenType = require("../lib/lexer.js").TokenType;
const IDResolver = require("../lib/parser.js").IDResolver;

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
        const expected = [
            ["45*2-10/2^2", 87.5],
            ["2*abc", 8],
            ["abc", 4],
            ["HUMID - TEMP", 244.95],
            ["false || (false || 1 == 1)", true],
            ["1 < 2 || false", true],
            ["!false", true]
        ];

        const varLookup = {
            "abc": 4,
            "HUMID": 100,
            "TEMP": -144.95
        };

        const resolver = new IDResolver();
        resolver.__proto__._resolve = (varName, next) => {
            return next(varLookup[varName]);
        };

        expected.forEach((item) => {
            it("should compute the correct value of an expression: " + item[0], (done) => {
                const rootNode = p.parse(item[0]);

                return rootNode.eval(function next(result) {
                    expect(result).to.be.equal(item[1]);
                    return done();
                }, resolver);
            });
        });
    });
});