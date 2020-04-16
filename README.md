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

        // Prints "scoped bar"
        print foo;
    };
