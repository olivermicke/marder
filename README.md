# marder

## General

Marder is a language built for educational purposes only. Therefore, it's always in development and may change a lot over time. Currently, Marder is dynamically typed and its interpreter is written in TypeScript.

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

    print fibonacci(7); // Prints `13`

## Overview

Marder requires a semicolon after every statement.

### Keywords

TODO:

### Truthiness

`false` and `nil` are not truthy. Every other expression is truthy.

### Operators

Instead of `||` and `&&`, `or` and `and` are used. Currently, both expressions inside both respective operators are evaluated no matter if the first expression is truthy/falsy. This will be changed with future versions.

    func foo() {
      print "called foo";
    };

    false and foo(); // Current behaviour: `called foo` is printed

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

Blocks are wrapped by braces. While they have their own scope, they can read and mutate their parents' scope (including global scope). Local scope has precedence over parent/global scope when a variable name is ambigious.

    {
      let foo = "outer scope";
      {
        let foo = "inner scope";

        print foo; // Prints "inner scope"
      };
    };

Blocks implicitly return the value of their last statement.

### Functions

Function blocks implicitly return the value of their last statement. While functions are first-class citizens, closures are not supported yet.

#### Declaring functions

    func double(n) {
      n * 2;
    };

    print double(5); // Prints `10`

#### Calling functions

Functions can be called with parens or with the pipe operator `->`

    func double(n) {
      n * 2;
    };

    func subtract(x, y) {
      x - y;
    };

    print subtract(double(5), 8); // Prints `2`
    print 5 -> double -> subtract(8); // Prints `2`

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
