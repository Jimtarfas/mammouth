// Generated by CoffeeScript 1.9.3
(function() {
  var KEYWORDS, Lexer, Position, REGEX, Token, errorAt,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  errorAt = require('./utils').errorAt;

  Lexer = (function() {
    function Lexer() {}

    Lexer.prototype.setInput = function(input) {
      this.yytext = '';
      this.track = {
        position: new Position,
        into: {
          mammouth: false
        },
        opened: []
      };
      this.tokens = [];
      this.pos = 0;
      return this.input = input.replace(/\r\n/g, '\n');
    };

    Lexer.prototype.addToken = function(tokens) {
      var j, len, ref, token;
      if (tokens instanceof Array) {
        for (j = 0, len = tokens.length; j < len; j++) {
          token = tokens[j];
          if ((ref = token.type) === 'INDENT' || ref === 'MINDENT' || ref === 'LINETERMINATOR') {
            this.track.into["for"] = false;
          }
          this.tokens.push(token);
        }
      } else {
        this.tokens.push(tokens);
      }
      return tokens;
    };

    Lexer.prototype.addIndentLevel = function() {
      return this.track.opened.unshift({
        type: 'IndentLevel',
        indentStack: [],
        currentIndent: -1,
        openedIndent: 0
      });
    };

    Lexer.prototype.getPos = function() {
      return this.track.position.clone();
    };

    Lexer.prototype.posAdvance = function(string, incPos) {
      var i, j, len, line, lines, results;
      if (incPos == null) {
        incPos = true;
      }
      if (incPos) {
        this.pos += string.length;
      }
      lines = string.split(REGEX.LINETERMINATOR);
      results = [];
      for (i = j = 0, len = lines.length; j < len; i = ++j) {
        line = lines[i];
        if (i === 0) {
          results.push(this.track.position.col += string.length);
        } else {
          this.track.position.row++;
          results.push(this.track.position.col = line.length);
        }
      }
      return results;
    };

    Lexer.prototype.colAdvance = function(num) {
      if (num == null) {
        num = 1;
      }
      this.pos += num;
      return this.track.position.col += num;
    };

    Lexer.prototype.rowAdvance = function(num) {
      if (num == null) {
        num = 1;
      }
      this.pos += num;
      this.track.position.row += num;
      return this.track.position.col = 0;
    };

    Lexer.prototype.last = function(num) {
      if (num == null) {
        num = 1;
      }
      if (this.tokens[this.tokens.length - num]) {
        return this.tokens[this.tokens.length - num];
      }
      return void 0;
    };

    Lexer.prototype.next = function(num) {
      var lexer;
      if (num == null) {
        num = 1;
      }
      lexer = new Lexer;
      lexer.track = JSON.parse(JSON.stringify(this.track));
      lexer.track.position = this.track.position.clone();
      lexer.tokens = JSON.parse(JSON.stringify(this.tokens));
      lexer.pos = this.pos;
      lexer.input = this.input;
      while (num > 0) {
        lexer.nextToken();
        num--;
      }
      return lexer.tokens[lexer.tokens.length - 1];
    };

    Lexer.prototype.charCode = function(pos) {
      if (pos == null) {
        pos = this.pos;
      }
      return this.input.charCodeAt(pos);
    };

    Lexer.prototype.currentIndentTracker = function() {
      var ele, j, len, ref;
      ref = this.track.opened;
      for (j = 0, len = ref.length; j < len; j++) {
        ele = ref[j];
        if (ele.type === 'IndentLevel') {
          return ele;
        }
      }
    };

    Lexer.prototype.lex = function() {
      var token;
      if (!this.lexed) {
        this.tokenize();
      }
      token = this.tokens.shift();
      if (token) {
        this.yytext = token.value ? token.value : '';
        this.yylloc = {
          first_column: token.location.start.col,
          first_line: token.location.start.row,
          last_line: token.location.end.row,
          last_column: token.location.end.col
        };
        return token.type;
      }
    };

    Lexer.prototype.tokenize = function() {
      var m;
      m = 0;
      while (m !== void 0) {
        m = this.nextToken();
      }
      this.rewrite();
      this.lexed = true;
      return this.tokens;
    };

    Lexer.prototype.nextToken = function() {
      if (this.pos === this.input.length) {
        return void 0;
      }
      if (!this.track.into.mammouth) {
        return this.readTokenRAW();
      }
      if (this.isStartTag()) {
        return this.readTokenStartTag();
      }
      if (this.isEndTag()) {
        return this.readTokenEndTag();
      }
      if (this.last().type === 'LINETERMINATOR' && this.isEmptyLines()) {
        return this.skipEmptyLines();
      }
      if (this.last().type === 'LINETERMINATOR' && this.isIndent()) {
        this.tokens.pop();
        return this.readIndent();
      }
      if (this.isComment()) {
        return this.skipComment();
      }
      if (this.isQualifiedString()) {
        return this.readTokenQualifiedString();
      }
      if (this.isIdentifier()) {
        return this.readTokenIdentifier();
      }
      if (this.isNumber()) {
        return this.readTokenNumber();
      }
      if (this.isString()) {
        return this.readTokenString();
      }
      if (this.isHereDoc()) {
        return this.readTokenHereDoc();
      }
      return this.getTokenFromCode(this.charCode());
    };

    Lexer.prototype.readTokenRAW = function() {
      var startPos, token, value;
      token = (new Token('RAW')).setStart(this.getPos());
      startPos = this.pos;
      while (this.pos < this.input.length && !this.isStartTag()) {
        this.pos++;
      }
      if (this.isStartTag()) {
        this.track.into.mammouth = true;
      }
      value = this.input.slice(startPos, this.pos);
      this.posAdvance(value, false);
      return this.addToken(token.set('value', value).setEnd(this.getPos()));
    };

    Lexer.prototype.readTokenStartTag = function() {
      var token;
      token = (new Token('{{')).setStart(this.getPos());
      this.colAdvance(2);
      this.track.opened.unshift({
        type: '{{',
        closableBy: '}}'
      });
      this.addIndentLevel();
      return this.addToken(token.setEnd(this.getPos()));
    };

    Lexer.prototype.readTokenEndTag = function() {
      var token, tokens;
      token = (new Token('}}')).setStart(this.getPos());
      this.colAdvance(2);
      token.setEnd(this.getPos());
      this.track.into.mammouth = false;
      tokens = this.closeIndent(this.currentIndentTracker(), token.location);
      this.closeIndentLevel();
      if (this.track.opened[0].type === '{{') {
        this.track.opened.shift();
        tokens = tokens.concat(token);
      }
      return this.addToken(tokens);
    };

    Lexer.prototype.readIndent = function() {
      var indent, indentLevel, indentTracker, j, len, reversed, token, tokens;
      token = (new Token).setStart(this.getPos());
      indent = this.input.slice(this.pos).match(REGEX.INDENT)[0];
      this.colAdvance(indent.length);
      token.setEnd(this.getPos());
      indentTracker = this.currentIndentTracker();
      if (indent.length > indentTracker.currentIndent) {
        indentTracker.currentIndent = indent.length;
        indentTracker.openedIndent++;
        indentTracker.indentStack.push({
          length: indent.length
        });
        return this.addToken(token.set('type', 'INDENT').set('length', indent.length));
      } else if (indent.length === indentTracker.currentIndent) {
        if (this.last().type === 'MINDENT') {
          return this.nextToken();
        }
        return this.addToken(token.set('type', 'MINDENT').set('length', indent.length));
      } else {
        tokens = [];
        reversed = this.reversedIndentStack(indentTracker);
        for (j = 0, len = reversed.length; j < len; j++) {
          indentLevel = reversed[j];
          if (indent.length === indentLevel.length) {
            indentTracker.currentIndent = indent.length;
            tokens.push(new Token('MINDENT', token.location, {
              length: indent.length
            }));
          } else if (indent.length < indentLevel.length) {
            indentTracker.currentIndent = indentTracker.indentStack.pop().length;
            indentTracker.openedIndent--;
            tokens.push(new Token('OUTDENT', token.location, {
              length: indentLevel.length
            }));
          }
        }
        return this.addToken(tokens);
      }
    };

    Lexer.prototype.readTokenIdentifier = function() {
      var indentTracker, length, ref, ref1, ref2, res, startPos, token, value;
      startPos = this.getPos();
      token = (new Token).setStart(startPos);
      value = this.input.slice(this.pos).match(REGEX.IDENTIFIER)[0];
      this.colAdvance(value.length);
      token.setEnd(this.getPos());
      if (ref = value.toUpperCase(), indexOf.call(KEYWORDS.BOOL, ref) >= 0) {
        return this.addToken(token.set('type', 'BOOL').set('value', value));
      }
      if (indexOf.call(KEYWORDS.LOGIC, value) >= 0) {
        return this.addToken(token.set('type', 'LOGIC')).set('value', value === 'and' ? '&&' : value === 'or' ? '||' : value);
      }
      if (indexOf.call(KEYWORDS.COMPARE, value) >= 0) {
        return this.addToken(token.set('type', 'COMPARE')).set('value', value === 'is' ? '===' : value === 'isnt' ? '!=' : value);
      }
      if (this.last().type === '=>' && indexOf.call(KEYWORDS.CASTTYPE, value) >= 0) {
        return this.addToken(token.set('type', 'CASTTYPE').set('value', value));
      }
      if (indexOf.call(KEYWORDS.RESERVED, value) >= 0) {
        if (value === 'cte' || value === 'const') {
          return this.addToken(token.set('type', 'CONST'));
        }
        if ((value === 'if' || value === 'unless') && !((ref1 = this.last().type) === 'INDENT' || ref1 === 'MINDENT' || ref1 === 'OUTDENT' || ref1 === '(' || ref1 === 'CALL_START' || ref1 === ',' || ref1 === 'ELSE' || ref1 === '=' || ref1 === 'ASSIGN')) {
          return this.addToken(token.set('type', 'POST_IF')).set('value', value === 'if' ? false : true);
        }
        if (value === 'if' || value === 'unless') {
          return this.addToken(token.set('type', 'IF')).set('value', value === 'if' ? false : true);
        }
        if (value === 'then') {
          indentTracker = this.currentIndentTracker();
          length = indentTracker.currentIndent + 1;
          indentTracker.currentIndent = length;
          indentTracker.openedIndent++;
          indentTracker.indentStack.push({
            length: length,
            sensible: true
          });
          return this.addToken(token.set('type', 'INDENT').set('length', length));
        }
        if (value === 'else') {
          res = this.closeSensibleIndent(this.currentIndentTracker(), token.location);
          return this.addToken(res.concat(token.set('type', 'ELSE')).concat(this.lookLinearBlock(token.location, 'ELSE')));
        }
        if (value === 'try') {
          return this.addToken([].concat(token.set('type', 'TRY')).concat(this.lookLinearBlock(token.location)));
        }
        if (value === 'catch') {
          res = this.closeSensibleIndent(this.currentIndentTracker(), token.location);
          return this.addToken(res.concat(token.set('type', 'CATCH')));
        }
        if (value === 'finally') {
          res = this.closeSensibleIndent(this.currentIndentTracker(), token.location);
          return this.addToken(res.concat(token.set('type', 'FINALLY')).concat(this.lookLinearBlock(token.location)));
        }
        if (value === 'for') {
          this.track.into["for"] = true;
        }
        if ((value === 'of' || value === 'in') && this.track.into["for"]) {
          this.track.into["for"] = false;
          return this.addToken(token.set('type', 'FOR' + value.toUpperCase()));
        }
        if ((value === 'when' && ((ref2 = this.last().type) === 'INDENT' || ref2 === 'MINDENT' || ref2 === 'OUTDENT')) || value === 'case') {
          return this.addToken(token.set('type', 'LEADING_WHEN'));
        }
        return this.addToken(token.set('type', value.toUpperCase()));
      }
      if (indexOf.call(KEYWORDS.PHPRESERVED, value) >= 0) {
        throw ("Unexpected, PHP reserved words can't be identifier at line " + startPos.row + ", col " + startPos.col + ":\n") + errorAt(this.input, startPos);
      }
      return this.addToken(token.set('type', 'IDENTIFIER').set('value', value));
    };

    Lexer.prototype.readTokenNumber = function() {
      var token, value;
      token = (new Token('NUMBER')).setStart(this.getPos());
      value = this.input.slice(this.pos).match(REGEX.NUMBER)[0];
      this.colAdvance(value.length);
      return this.addToken(token.set('value', value).setEnd(this.getPos()));
    };

    Lexer.prototype.readTokenString = function() {
      var token, value;
      token = (new Token('STRING')).setStart(this.getPos());
      value = this.input.slice(this.pos).match(REGEX.STRING)[0];
      this.posAdvance(value);
      return this.addToken(token.set('value', value).setEnd(this.getPos()));
    };

    Lexer.prototype.readTokenHereDoc = function() {
      var token, value;
      token = (new Token('HEREDOC')).setStart(this.getPos());
      value = this.input.slice(this.pos).match(REGEX.HEREDOC)[0];
      this.posAdvance(value);
      return this.addToken(token.set('value', value.slice(1, value.length - 1)).setEnd(this.getPos()));
    };

    Lexer.prototype.readTokenQualifiedString = function() {
      var token, value;
      token = (new Token('QUALIFIEDQTRING')).setStart(this.getPos());
      value = this.input.slice(this.pos).match(REGEX.QUALIFIEDQTRING)[0];
      this.posAdvance(value);
      return this.addToken(token.set('value', eval(value.slice(1))).setEnd(this.getPos()));
    };

    Lexer.prototype.getTokenFromCode = function(code) {
      var ref, ref1, startPos, token, tokens;
      startPos = this.getPos();
      token = (new Token).setStart(startPos);
      this.colAdvance();
      switch (code) {
        case 10:
        case 13:
        case 8232:
          this.colAdvance(-1);
          return this.readLineTerminator();
        case 32:
        case 160:
        case 5760:
        case 6158:
        case 8192:
        case 8193:
        case 8194:
        case 8195:
        case 8196:
        case 8197:
        case 8198:
        case 8199:
        case 8200:
        case 8201:
        case 8202:
        case 8239:
        case 8287:
        case 12288:
          return this.nextToken();
        case 33:
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'COMPARE').set('value', '!=').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', 'NOT').setEnd(this.getPos()));
        case 37:
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'ASSIGN').set('value', '%=').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', '%').setEnd(this.getPos()));
        case 38:
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'ASSIGN').set('value', '&=').setEnd(this.getPos()));
          }
          if (this.charCode() === 38) {
            this.colAdvance();
            return this.addToken(token.set('type', 'LOGIC').set('value', '&&').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', '&').setEnd(this.getPos()));
        case 40:
          if ((ref = this.last().type, indexOf.call(KEYWORDS.CALLABLE, ref) >= 0) && this.last(2).type !== 'FUNC') {
            this.track.opened.unshift({
              type: 'CALL_START',
              closableBy: 'CALL_END'
            });
            this.addIndentLevel();
            return this.addToken(token.set('type', 'CALL_START').setEnd(this.getPos()));
          }
          this.track.opened.unshift({
            type: '(',
            closableBy: ')'
          });
          this.addIndentLevel();
          return this.addToken(token.set('type', '(').setEnd(this.getPos()));
        case 41:
          tokens = this.closeIndent(this.currentIndentTracker(), token.location);
          this.closeIndentLevel();
          switch (this.track.opened[0].type) {
            case 'CALL_START':
              tokens = tokens.concat(token.set('type', 'CALL_END').setEnd(this.getPos()));
              this.track.opened.shift();
              break;
            case '(':
              tokens = tokens.concat(token.set('type', ')').setEnd(this.getPos()));
              this.track.opened.shift();
          }
          return this.addToken(tokens);
        case 42:
          if (this.charCode() === 42) {
            this.colAdvance();
            return this.addToken(token.set('type', '**').setEnd(this.getPos()));
          }
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'ASSIGN').set('value', '*=').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', '*').setEnd(this.getPos()));
        case 43:
          if (this.charCode() === 43) {
            this.colAdvance();
            return this.addToken(token.set('type', '++').setEnd(this.getPos()));
          }
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'ASSIGN').set('value', '+=').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', '+').setEnd(this.getPos()));
        case 44:
          return this.addToken(token.set('type', ',').setEnd(this.getPos()));
        case 45:
          if (this.charCode() === 45) {
            this.colAdvance();
            return this.addToken(token.set('type', '--').setEnd(this.getPos()));
          }
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'ASSIGN').set('value', '-=').setEnd(this.getPos()));
          }
          if (this.charCode() === 62) {
            this.colAdvance();
            tokens = [token.set('type', '->').setEnd(this.getPos())].concat(this.lookLinearBlock(token.location));
            return this.addToken(tokens);
          }
          return this.addToken(token.set('type', '-').setEnd(this.getPos()));
        case 46:
          if (this.charCode() === 46) {
            this.colAdvance();
            if (this.charCode() === 46) {
              this.colAdvance();
              if (this.charCode() === 46) {
                this.colAdvance();
                return this.addToken(token.set('type', '....').setEnd(this.getPos()));
              }
              return this.addToken(token.set('type', '...').setEnd(this.getPos()));
            }
            return this.addToken(token.set('type', '..').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', '.').setEnd(this.getPos()));
        case 47:
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'ASSIGN').set('value', '/=').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', '/').setEnd(this.getPos()));
        case 58:
          if (this.charCode() === 58) {
            this.colAdvance();
            return this.addToken(token.set('type', '::').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', ':').setEnd(this.getPos()));
        case 59:
          return this.addToken(token.set('type', ';').setEnd(this.getPos()));
        case 60:
          if (this.charCode() === 60) {
            this.colAdvance();
            if (this.charCode() === 61) {
              this.colAdvance();
              return this.addToken(token.set('type', 'ASSIGN').set('value', '<<=').setEnd(this.getPos()));
            }
            return this.addToken(token.set('type', 'BITWISE').set('value', '<<').setEnd(this.getPos()));
          }
          if (this.charCode() === 45 && this.charCode(this.pos + 1) === 62) {
            this.colAdvance(2);
            return this.addToken(token.set('type', 'CONCAT').setEnd(this.getPos()));
          }
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'COMPARE').set('value', '<=').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', 'COMPARE').set('value', '<').setEnd(this.getPos()));
        case 61:
          if (this.charCode() === 62) {
            this.colAdvance();
            return this.addToken(token.set('type', '=>').setEnd(this.getPos()));
          }
          if (this.charCode() === 61 && this.charCode(this.pos + 1) === 61) {
            this.colAdvance(2);
            return this.addToken(token.set('type', 'COMPARE').set('value', '===').setEnd(this.getPos()));
          }
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'COMPARE').set('value', '==').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', '=').setEnd(this.getPos()));
        case 62:
          if (this.charCode() === 62) {
            this.colAdvance();
            if (this.charCode() === 61) {
              this.colAdvance();
              return this.addToken(token.set('type', 'ASSIGN').set('value', '>>=').setEnd(this.getPos()));
            }
            return this.addToken(token.set('type', 'BITWISE').set('value', '>>').setEnd(this.getPos()));
          }
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'COMPARE').set('value', '>=').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', 'COMPARE').set('value', '>').setEnd(this.getPos()));
        case 63:
          return this.addToken(token.set('type', '?').setEnd(this.getPos()));
        case 64:
          return this.addToken(token.set('type', '@').setEnd(this.getPos()));
        case 91:
          if (ref1 = this.last().type, indexOf.call(KEYWORDS.INDEXABLE, ref1) >= 0) {
            this.track.opened.unshift({
              type: 'INDEX_START',
              closableBy: 'INDEX_END'
            });
            this.addIndentLevel();
            return this.addToken(token.set('type', 'INDEX_START').setEnd(this.getPos()));
          } else {
            this.track.opened.unshift({
              type: '[',
              closableBy: ']'
            });
            this.addIndentLevel();
            return this.addToken(token.set('type', '[').setEnd(this.getPos()));
          }
          break;
        case 93:
          tokens = this.closeIndent(this.currentIndentTracker(), token.location);
          this.closeIndentLevel();
          if (this.track.opened[0].type === '[') {
            this.track.opened.shift();
            tokens = tokens.concat(token.set('type', ']').setEnd(this.getPos()));
          } else if (this.track.opened[0].type === 'INDEX_START') {
            this.track.opened.shift();
            tokens = tokens.concat(token.set('type', 'INDEX_END').setEnd(this.getPos()));
          }
          return this.addToken(tokens);
        case 94:
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'ASSIGN').set('value', '^=').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', 'BITWISE').set('value', '^').setEnd(this.getPos()));
        case 123:
          return this.addToken(token.set('type', '{').setEnd(this.getPos()));
        case 124:
          if (this.charCode() === 124) {
            this.colAdvance();
            return this.addToken(token.set('type', 'BITWISE').set('value', '||').setEnd(this.getPos()));
          }
          if (this.charCode() === 61) {
            this.colAdvance();
            return this.addToken(token.set('type', 'ASSIGN').set('value', '|=').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', 'BITWISE').set('value', '|').setEnd(this.getPos()));
        case 125:
          return this.addToken(token.set('type', '}').setEnd(this.getPos()));
        case 126:
          if (this.charCode() === 126) {
            this.colAdvance();
            if (this.charCode() === 61) {
              this.colAdvance();
              return this.addToken(token.set('type', 'ASSIGN').set('value', '.=').setEnd(this.getPos()));
            }
            return this.addToken(token.set('type', 'CONCAT').setEnd(this.getPos()));
          }
          return this.addToken(token.set('type', '~').setEnd(this.getPos()));
        default:
          throw ("Unexpected caharacter at line " + startPos.row + ", col " + startPos.col + ":\n") + errorAt(this.input, startPos);
      }
    };

    Lexer.prototype.readLineTerminator = function() {
      var ref, token;
      token = (new Token('LINETERMINATOR')).setStart(this.getPos());
      this.rowAdvance();
      if ((ref = this.charCode()) === 10 || ref === 13 || ref === 8232) {
        return this.readLineTerminator();
      }
      return this.addToken(token.setEnd(this.getPos()));
    };

    Lexer.prototype.skipEmptyLines = function() {
      var value;
      value = this.input.slice(this.pos).match(REGEX.EMPTYLINE)[0];
      this.posAdvance(value);
      return this.nextToken();
    };

    Lexer.prototype.skipComment = function() {
      var value;
      value = this.input.slice(this.pos).match(REGEX.COMMENT)[0];
      this.posAdvance(value);
      return this.nextToken();
    };

    Lexer.prototype.lookLinearBlock = function(loc, tok) {
      var indentTracker, length, next, ref, tokens;
      if (tok == null) {
        tok = '';
      }
      tokens = [];
      if (tok === 'ELSE' && ((ref = this.next().type) === 'IF' || ref === 'POST_IF')) {
        return tokens;
      }
      next = this.next(2).type;
      if (next !== 'INDENT') {
        indentTracker = this.currentIndentTracker();
        length = indentTracker.currentIndent + 1;
        if (next === 'MINDENT' || next === 'OUTDENT') {
          tokens.push((new Token('INDENT', loc)).set('length', indentTracker.currentIndent + 1));
          tokens.push((new Token('OUTDENT', loc)).set('length', indentTracker.currentIndent + 1));
        } else {
          indentTracker.currentIndent = length;
          indentTracker.openedIndent++;
          indentTracker.indentStack.push({
            length: length,
            sensible: true
          });
          tokens.push((new Token('INDENT', loc)).set('length', length));
        }
      }
      return tokens;
    };

    Lexer.prototype.isStartTag = function(pos) {
      if (pos == null) {
        pos = this.pos;
      }
      if (this.pos + 1 > this.input.length - 1) {
        return false;
      }
      return this.charCode(pos) === 123 && this.charCode(this.pos + 1) === 123;
    };

    Lexer.prototype.isEndTag = function(pos) {
      if (pos == null) {
        pos = this.pos;
      }
      if (this.pos + 1 > this.input.length - 1) {
        return false;
      }
      return this.charCode(pos) === 125 && this.charCode(this.pos + 1) === 125;
    };

    Lexer.prototype.isComment = function(pos) {
      if (pos == null) {
        pos = this.pos;
      }
      return this.input.slice(pos).match(REGEX.COMMENT) !== null;
    };

    Lexer.prototype.isEmptyLines = function(pos) {
      if (pos == null) {
        pos = this.pos;
      }
      return this.input.slice(pos).match(REGEX.EMPTYLINE) !== null;
    };

    Lexer.prototype.isIdentifier = function(pos) {
      if (pos == null) {
        pos = this.pos;
      }
      return this.input.slice(pos).match(REGEX.IDENTIFIER) !== null;
    };

    Lexer.prototype.isIndent = function(pos) {
      if (pos == null) {
        pos = this.pos;
      }
      return this.input.slice(pos).match(REGEX.INDENT) !== null && this.last().type !== 'INDENT';
    };

    Lexer.prototype.isNumber = function(pos) {
      if (pos == null) {
        pos = this.pos;
      }
      return this.input.slice(pos).match(REGEX.NUMBER) !== null;
    };

    Lexer.prototype.isString = function(pos) {
      if (pos == null) {
        pos = this.pos;
      }
      return this.input.slice(pos).match(REGEX.STRING) !== null;
    };

    Lexer.prototype.isHereDoc = function(pos) {
      if (pos == null) {
        pos = this.pos;
      }
      return this.input.slice(pos).match(REGEX.HEREDOC) !== null;
    };

    Lexer.prototype.isQualifiedString = function(pos) {
      if (pos == null) {
        pos = this.pos;
      }
      return this.input.slice(pos).match(REGEX.QUALIFIEDQTRING) !== null;
    };

    Lexer.prototype.rewrite = function() {
      var i, j, len, ref, ref1, results, token;
      ref = this.tokens;
      results = [];
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        token = ref[i];
        if (token) {
          if (token.type === 'MINDENT' && this.tokens[i + 1] && ((ref1 = this.tokens[i + 1].type) === 'CATCH' || ref1 === 'ELSE' || ref1 === 'FINALLY')) {
            this.tokens.splice(i, 1);
          }
          if (token.type === 'MINDENT' && this.tokens[i + 1] && this.tokens[i + 1].type === 'OUTDENT' && this.tokens[i + 1].length === token.length) {
            results.push(this.tokens.splice(i, 1));
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Lexer.prototype.reversedIndentStack = function(indentTracker) {
      var i, j, len, ref, reversed;
      reversed = [];
      ref = indentTracker.indentStack;
      for (j = 0, len = ref.length; j < len; j++) {
        i = ref[j];
        reversed.unshift(i);
      }
      return reversed;
    };

    Lexer.prototype.closeIndent = function(indentTracker, loc) {
      var ref, reversed, tokens;
      tokens = [];
      reversed = this.reversedIndentStack(indentTracker);
      while (indentTracker.openedIndent) {
        if ((ref = this.last().type) === 'LINETERMINAROR' || ref === 'MINDENT') {
          this.tokens.pop();
        }
        tokens.unshift((new Token('OUTDENT', loc)).set('length', reversed[indentTracker.openedIndent - 1].length));
        indentTracker.openedIndent--;
      }
      if (this.last().type === 'LINETERMINATOR') {
        this.tokens.pop();
      }
      return tokens;
    };

    Lexer.prototype.closeIndentLevel = function() {
      return this.track.opened.shift();
    };

    Lexer.prototype.closeSensibleIndent = function(indentTracker, loc) {
      var length, res;
      res = [];
      if (indentTracker.indentStack[indentTracker.indentStack.length - 1] && indentTracker.indentStack[indentTracker.indentStack.length - 1].sensible === true) {
        length = indentTracker.indentStack.pop().length - 1;
        indentTracker.currentIndent = length;
        indentTracker.openedIndent--;
        res.push((new Token('OUTDENT', loc)).set('length', length));
      }
      return res;
    };

    return Lexer;

  })();

  Token = (function() {
    function Token(type, location, obj) {
      var key, value;
      this.type = type != null ? type : null;
      this.location = location != null ? location : {};
      if (obj == null) {
        obj = {};
      }
      for (key in obj) {
        value = obj[key];
        this[key] = value;
      }
      if (this.location === null) {
        delete this.location;
      }
    }

    Token.prototype.set = function(key, value) {
      this[key] = value;
      return this;
    };

    Token.prototype.get = function(key) {
      return this[key];
    };

    Token.prototype.setStart = function(value) {
      this.location.start = value;
      return this;
    };

    Token.prototype.setEnd = function(value) {
      this.location.end = value;
      return this;
    };

    Token.prototype.clone = function() {
      var k, token, v;
      token = new Token;
      for (k in this) {
        v = this[k];
        token.set(k, v);
      }
      return token;
    };

    return Token;

  })();

  Position = (function() {
    function Position(row, col) {
      this.row = row != null ? row : 1;
      this.col = col != null ? col : 0;
    }

    Position.prototype.clone = function() {
      return new Position(this.row, this.col);
    };

    Position.from = function(pos) {
      return new Position(pos.row || 1, pos.col || 0);
    };

    return Position;

  })();

  REGEX = {
    COMMENT: /^###([^#][\s\S]*?)(?:###[^\n\S]*|###$)|^(?:\s*#(?!##[^#]).*)+/,
    EMPTYLINE: /(^[\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000]*[\n\r\u2028\u2029])/,
    IDENTIFIER: /((^[$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)( [^\n\S]* : (?!:) )?)/,
    INDENT: /(^[ \t]*)/,
    HEREDOC: /^`(((?!(\`|{{|}}))([\n\r\u2028\u2029]|.))*)`/,
    LINETERMINATOR: /[\n\r\u2028]/,
    NUMBER: /^(0b[01]+|0o[0-7]+|0(x|X)[\da-fA-F]+|\d*\.?\d+(?:(e|E)[+-]?\d+)?)/,
    STRING: /^('[^\\']*(?:\\[\s\S][^\\']*)*'|"[^\\"]*(?:\\[\s\S][^\\"]*)*")/,
    QUALIFIEDQTRING: /^q('[^\\']*(?:\\[\s\S][^\\']*)*'|"[^\\"]*(?:\\[\s\S][^\\"]*)*")/
  };

  KEYWORDS = {
    BOOL: ['TRUE', 'FALSE'],
    CALLABLE: ['CALL_END', 'IDENTIFIER', ')', ']', 'INDEX_END', '?', '@', 'QUALIFIEDQTRING'],
    CASTTYPE: ['array', 'binary', 'bool', 'boolean', 'double', 'int', 'integer', 'float', 'object', 'real', 'string', 'unset'],
    COMPARE: ['is', 'isnt'],
    INDEXABLE: ['CALL_END', 'IDENTIFIER', ')', ']', '?', '@', 'QUALIFIEDQTRING', 'NUMBER', 'STRING', 'BOOL', 'NULL'],
    LOGIC: ['and', 'or', 'xor'],
    RESERVED: ['abstract', 'as', 'break', 'by', 'catch', 'case', 'class', 'clone', 'const', 'continue', 'cte', 'declare', 'delete', 'echo', 'else', 'extends', 'final', 'finally', 'for', 'func', 'goto', 'if', 'implements', 'in', 'instanceof', 'interface', 'include', 'loop', 'namespace', 'new', 'not', 'null', 'of', 'once', 'private', 'protected', 'public', 'require', 'return', 'static', 'switch', 'then', 'throw', 'try', 'unless', 'until', 'use', 'when', 'while'],
    PHPRESERVED: ['abstract', 'and', 'as', 'break', 'callable', 'case', 'catch', 'class', 'clone', 'const', 'continue', 'declare', 'default', 'do', 'echo', 'else', 'elseif', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch', 'endwhile', 'extends', 'final', 'finally', 'for', 'foreach', 'function', 'global', 'goto', 'if', 'implements', 'include', 'include_once', 'instanceof', 'insteadof', 'interface', 'namespace', 'new', 'or', 'print', 'private', 'protected', 'public', 'require', 'require_once', 'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use', 'while']
  };

  module.exports = new Lexer;

}).call(this);