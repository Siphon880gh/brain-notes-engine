# Link Preview Syntax Migration

Boundary-word previews and marker images are no longer supported. Link previews now target other DevBrain documents, while custom text previews are embedded directly in the wiki syntax.

## Document Preview

```markdown
[[JavaScript Documentation]]
```

## Custom Text Preview

```markdown
[[JavaScript]]##A programming language commonly used to build interactive web applications##
```

In the second example, only `JavaScript` renders in the note. The text between `##` delimiters appears in its popover.

Custom content takes precedence if `JavaScript` is also an existing document name. The custom form does not open or preview that document.

Custom payloads can contain Markdown, formatting HTML, actual newlines, or literal `\n` line breaks:

```markdown
[[JavaScript]]##Test **Preview**
<b>Text</b>##
```
