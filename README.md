# marder

Semicolons are required after statements.

## Variables

Immutable variables are declared with `let`, mutable variables are declared with `let mut`.

    let foo = "immutable string";

    let mut bar = "mutable string";

Variables have to be declared and initialized at the same time.

    // invalid
    let x;

    // valid
    let x = 3;

## Blocks

Blocks are wrapped by braces. While they have their own scope, they can read and mutate global variables. Local scope has precedence over global scope when a variable name is ambigious.

    let foo = "global bar";

    {
      let foo = "scoped bar";

      print foo; // Prints "scoped bar"
    };

Blocks implicitly return the value of its last statement.

## Functions

Function blocks also implicitly return the value of its last statement.

### Declaration

    func double(n) {
      n * 2;
    };

    print double(5); // Prints `10`

### Calling

Functions can be called with parens or with the pipe operator `->`

    func double(n) {
      n * 2;
    };

    func subtract(x, y) {
      x - y;
    };

    print subtract(double(5), 8); // Prints `2`
    print 5 -> double -> subtract(8); // Prints `2`
