# Boundary Words Example

This example demonstrates how the link popover system now includes boundary words in the excerpt.

## Example

[MDN JavaScript Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript) ![JavaScript...Reference](../1x2.png)

## What Changed

**Before:** The excerpt would show content between "JavaScript" and "Reference" words, excluding the boundary words themselves.

**After:** The excerpt now includes both "JavaScript" and "Reference" words, providing better context.

## Example Output

If the webpage contains:
```
JavaScript is a programming language that is one of the core technologies of the World Wide Web. It is used to make web pages interactive and provide online programs. Reference materials are available for learning.
```

**Before:** The excerpt would show:
```
is a programming language that is one of the core technologies of the World Wide Web. It is used to make web pages interactive and provide online programs. Reference materials are available for learning.
```

**After:** The excerpt now shows:
```
JavaScript is a programming language that is one of the core technologies of the World Wide Web. It is used to make web pages interactive and provide online programs. Reference materials are available for learning.
```

This provides much better context and makes the excerpt more meaningful!
