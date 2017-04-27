const Parser = require("./lib/parser").Parser;

function parse(string) {
    const p = new Parser();
    return p.parse(string);
}

module.exports = {
    Lexer: require("./lib/lexer").Lexer,
    TokenType: require("./lib/lexer").TokenType,
    Parser,
    parse,
    eval: (string, cb, idResolver) => {
        const rootNode = parse(string);

        return rootNode.eval(cb, idResolver);
    }
};