General Style:
  - Use 2 spaces for indentation.
  - No trailing whitespace. No lines containing only whitespace. Empty lines
    must be empty.
  - Use UNIX-style LF line endings (Should be a setting in the text editor).
  - Use UTF-8 or ASCII encoding.
  - New line at end of file (Should be a setting in the text editor).
  - Do not exceed 80 columns per line. If a line exceeds 80 columns, break to
    the next line and either (1) align to the beginning of the expression in
    which the line break occurs (or a super-expression if necessary) or (2)
    indent one level further than the indentation level of the initial line.
    - Do not mix alignment styles 1 and 2 during a single expression, but
      subexpressions may change alignment styles.
    - Prefer higher level breaks to lower level breaks.
    - Comments need not be aligned according to this rule, but must not exceed
      80 columns per line.
  - Parentheses for a parameter list should not include a space before the
    opening parenthesis.
  - Parentheses for control structures should include a space before the opening
    parenthesis.
  - No space inside parentheses at beginning or end.
  - Use a space after commas.
  - Use a space before and after binary operators.
  - Classes should use pascal case (ThisIsAnExample).
  - Functions and methods should use camel case (thisIsAnExample).
  - Variables should use all lower-case and separate words with underscores
    (this_is_an_example).
  - Constants should use all capitals and separate words with underscores
    (THIS_IS_AN_EXAMPLE).
  - A case statement should be indented one level further than the switch
    statement. If parentheses are used, they are indented at the same level as
    the case. The body of the case should be indented one level further than the
    case statement.\*\*\*
  - When breaking the line at binary operators or in chained expressions, break
    the line after the operator.\*\*
  - Do not align after the first non-whitespace character.
  - When declaring multiple variables simultaneously, align the first character
    of the variable name if using alignment style 1.
  - When defining a variable over multiple lines, align the first character of
    the value on each line.

\*\* This particular guideline is only a preference. Use common sense, but
     follow the guideline when there is no good reason to break it.

\*\*\* Any C-specific keywords used also apply to the equivalent in other
       languages.

Ruby Style: (extends General Style)
  - Use TomDoc for documentation.
  - Only use `then` for single-line `if/unless`.
  - Prefer `?:` to `if/then/else/end` for ternary operations.
  - If using `else`, prefer `if` over `unless`.
  - Use `{...}` for single-line blocks and `do...end` for multi-line blocks.
  - Use hashrocket syntax for Hash literals.
    - Prefer symbol keys over string literal keys when possible.

XML Style: (extends General Style)
  - If a node contains non-text child nodes, its opening and closing tags must
    appear on their own lines.
  - Do not follow column-per-line limit. Do not break lines.
    - Column-per-line limit should still be followed with other languages
      embedded in XML and text nodes.

CoffeeScript Style: (extends C-like Style)
  - For the purposes of this guide, a function is defined as any variable which
    contains a function and is not changed after initial assignment and a
    constant is any value which is not changed after initial assignment.

Project-specific Style:
  - Use SASS (.sass), CoffeeScript (.coffee), and HAML (.haml) instead of CSS,
    JavaScript, and ERB/HTML when possible.
