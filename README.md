# marder

## General

Marder (ˈmaʁdɐ, engl. "marten") is a language built for educational purposes only. Marder is dynamically typed and its interpreter is written in TypeScript. In its current form, it is quite primitive. Literally. There are no arrays or objects. Just primitive data types. However, it supports recursion and even closures, so it's possible to write some simple programs such as calculating a Fibonacci sequence. Marder source code files require the `.mad` file extension.

## Examples

### Hello World

    print "Hello, world!";

### Fibonacci

    func fibonacci(n) {
      if n < 1 {
        0;
      } else if n <= 2 {
        1;
      } else {
        fibonacci(n - 1) + fibonacci(n - 2);
      };
    };

    print fibonacci(7); // Prints "13"

## How to use

- Create a file called `hello-world.mad` with `print "Hello, world!";` as content
- Run `yarn` and `yarn build`
- Run `yarn mad ./hello-world.mad` where the given file path points to your `.mad` file

## Syntax

Marder requires a semicolon after every statement.

### Truthiness

`false` and `nil` are falsy. Every other expression is truthy.

### Operators

Instead of `||` and `&&`, `or` and `and` are used.

⚠️ Currently, short-circuit evaluation is not supported.

    func foo() {
      print "called foo";
    };

    false and foo(); // ⚠️ Current behaviour: `called foo` is printed

### Variables

Immutable variables are declared with `let`, mutable variables are declared with `let mut`.

    let foo = "immutable string";

    let mut bar = "mutable string";

Variables have to be declared and initialized at the same time.

    // invalid
    let x;

    // valid
    let x = 3;

### Blocks

Blocks are wrapped by braces. While they have their own scope, they can read and mutate their parents' scope (including global scope). Local scope has precedence over parent/global scope when referring to an ambiguous variable name.

    {
      let foo = "outer scope";
      {
        let foo = "inner scope";

        print foo; // Prints "inner scope"
      };
    };

Blocks implicitly return the value of their last statement. Consequently, implicit returns for functions as well as if-else expressions are possible.

### Functions

Functions are first-class citizens. Just like regular blocks, function blocks implicitly return the value of their last statement.

#### Declaring functions

    func double(n) {
      n * 2;
    };

    print double(5); // Prints `10`

#### Calling functions

Functions can be called with parens or with the pipe operator `->`

There are two ways values can be logged to the console: calling `print` or `log`. While `print` is a keyword, `log` is a built-in function. Examples for both can be seen below.

    func double(n) {
      n * 2;
    };

    func subtract(x, y) {
      x - y;
    };

    print double(5); // Prints `10`
    5 -> double -> log; // Prints `10`

    print subtract(double(5), 8); // Prints `2`
    5 -> double -> subtract(8) -> log; // Prints `2`

#### First-class citizens

Functions can be passed as arguments

    func call(fn) {
      fn();
    };

    func greet() {
      print "Hi";
    };

    call(greet); // Prints "Hi"

Functions can be bound to variables

    func double(n) {
      n * 2;
    };

    let d = double;
    print d(3); // Prints `6`

Closures are also supported.

    func returnFunction() {
      let outside = "outside";

      func inner() {
        print outside;
      };

      inner;
    };

    returnFunction()(); // prints "outside"

### Control Flow

#### If expressions

If expression blocks implicitly return the value of their last statement.

    let val =
      if false {
        "foo";
      } else if true {
        "bar";
      } else {
        "foobar";
      };

    print val; // Prints "bar"

When assigning an if expression which never returns a value to a variable, an error is thrown at run-time as variables need to be declared and initialized at the same time.

    // Error: `Undefined variable "var"`
    let val = if false {
      "foo";
    };

    // No error. `val` is "bar"
    let val = if false {
      "foo";
    } else {
      "bar";
    };

#### Reserved Keywords

- `and`
- `class` (not implemented yet)
- `else`
- `false`
- `for` (not implemented yet)
- `func`
- `if`
- `let`
- `mut`
- `nil`
- `or`
- `print`
- `return`
- `super` (not implemented yet)
- `this` (not implemented yet)
- `true`
- `while`
