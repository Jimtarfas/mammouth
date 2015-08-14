class exports.Document
    constructor: (sections) ->
        @type = 'Document'
        @sections = sections

class exports.RawText
    constructor: (text = '') ->
        @type = 'RawText'
        @text = text

class exports.Script
    constructor: (block) ->
        @type = 'Script'
        @body = block

class exports.Block
    constructor: (instructions = []) ->
        @type = 'Block'
        @body = instructions

class exports.Value
    constructor: (value, properties = []) ->
        @type = 'Value'
        @value = value
        @properties = properties

    add: (prop) ->
        @properties.push(prop) 

class exports.Identifier
    constructor: (name) ->
        @type = 'Identifier'
        @name = name

class exports.Literal
    constructor: (raw) ->
        @type = 'Literal'
        @value = eval raw
        @raw = raw

class exports.Access
    constructor: (value, method = ".") ->
        @type = 'Access'
        @value = value
        @method = method

class exports.Array
    constructor: (elements = []) ->
        @type = 'Array'
        @elements = elements

class exports.ArrayKey
    constructor: (key, value) ->
        @type = 'ArrayKey'
        @key = key
        @value = value

class exports.Parens
    constructor: (expression) ->
        @type = 'Parens'
        @expression = expression

class exports.typeCasting
    constructor: (expression, ctype) ->
        @type = 'typeCasting'
        @expression = expression
        @ctype = ctype

class exports.Clone
    constructor: (expression) ->
        @type = 'Clone'
        @expression = expression

class exports.Call
    constructor: (callee, args = []) ->
        @type = 'Call'
        @callee = callee
        @arguments = args

class exports.NewExpression
    constructor: (callee, args = []) ->
        @type = 'NewExpression'
        @callee = callee
        @arguments = args

class exports.Existence
    constructor: (value) ->
        @type = 'Existence'
        @value = value

# Operations
class exports.Assign
    constructor: (operator, left, right) ->
        @type = 'Assign'
        @operator = operator
        @left = left
        @right = right

class exports.Unary
    constructor: (operator, expression) ->
        @type = 'Unary'
        @operator = operator
        @expression = expression

class exports.Update
    constructor: (operator, expression, prefix = true) ->
        @type = 'Update'
        @operator = operator
        @expression = expression
        @prefix = prefix

class exports.Operation
    constructor: (operator, left, right) ->
        @type = 'Operation'
        @operator = operator
        @left = left
        @right = right

class exports.Code
    constructor: (parameters, body, asStatement = false, name = null) ->
        @type = 'Code'
        @parameters = parameters
        @body = body
        @asStatement = asStatement
        @name = name

class exports.Param
    constructor: (name, passing = false, hasDefault = false, def = null) ->
        @type = 'Param'
        @name = name
        @passing = passing
        @hasDefault = hasDefault
        @default = def

# If
class exports.If
    constructor: (condition, body) ->
        @type = 'If'
        @condition = condition
        @body = body
        @elses = []

    addElse: (element) ->
        @elses.push(element)

class exports.ElseIf
    constructor: (condition, body) ->
        @type = 'ElseIf'
        @condition = condition
        @body = body

class exports.Else
    constructor: (body) ->
        @type = 'Else'
        @body = body