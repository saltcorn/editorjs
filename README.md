# editorjs

Saltcorn plugin that adds the Editor.js block-style rich text editor with JSON storage and HTML rendering helpers.

## Use

1. Add a JSON field to your table to hold Editor.js data.
2. In a form view, choose the `EditorJSEdit` field view for that field to get the block editor UI.
3. In a show/list view, choose the `EditorJS` field view to render the stored content.

## Rendering elsewhere

The plugin exposes a function `editorjs_to_html(content)` that converts stored Editor.js JSON into HTML. Use it in workflows or formulas when you need HTML output.

### Using `editorjs_to_html`

- Automatic field adder: install the HTML plugin for the HTML datatype, add a new field to the table with HTML type, check "Calculated" and "Stored", click Next, and in the Formula input add `editorjs_to_html(content)` (replace `content` with your JSON field name).
- Custom function: create an action in the view configuration that runs `run_js_code` and use `editorjs_to_html(content)` in the Code input, similar to the above approach.