const { features } = require("@saltcorn/data/db/state");
const { div, script, domReady, input } = require("@saltcorn/markup/tags");
const editorjsHTML = require("editorjs-html");

const verstring = features?.version_plugin_serve_path
  ? "@" + require("./package.json").version
  : "";

const headers = [
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-editorjs.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-header.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-list.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-image.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-quote.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-checklist.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-paragraph.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-table.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-embed.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-inline-code.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-code.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-delimiter.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-marker.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-link.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-nested-list.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-raw.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-simple-image.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-warning.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-attaches.umd.min.js`,
  },
  {
    script: `/plugins/public/editorjs${verstring}/editorjs-html.min.js`,
  },
];

const parser = editorjsHTML();

const editorjs_to_html = (content, req) => {
  if (content == null) return "";
  let data = content;
  console.log(typeof data, "###");
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse EditorJS content", e);
      return "";
    }
  }
  try {
    const htmlChunks = parser.parse(data);
    return Array.isArray(htmlChunks) ? htmlChunks.join("") : "";
  } catch (e) {
    console.error("Failed to convert EditorJS content to HTML", e);
    return "";
  }
};

const EditorJSDisplay = {
  type: "JSON",
  isEdit: false,
  blockDisplay: true,
  run: (value, req) => editorjs_to_html(value, req),
};

const EditorJSEdit = {
  type: "JSON",
  isEdit: true,
  blockDisplay: true,
  run: (value, req, attrs = {}, cls = "", required = false, field = {}) => {
    const fieldName = field.name || attrs.name || attrs.field_name || "";
    const holderId = `edjs_${Math.random().toString(36).slice(2)}`;
    const inputId = `${holderId}_input`;
    let initData = null;
    if (value) {
      if (typeof value === "string") {
        try {
          initData = JSON.parse(req);
        } catch (e) {
          initData = req;
        }
      } else {
        initData = value;
      }
    }

    return div({ class: cls }, [
      div({ id: holderId, style: "min-height: 300px;" }),
      input({
        type: "hidden",
        name: fieldName,
        id: inputId,
        value: initData ? JSON.stringify(initData) : "",
        ...(required ? { required: true } : {}),
      }),
      script(
        domReady(/*js*/ `
		(function () {
      console.log(window)
			const holderId = "${holderId}";
			const inputEl = document.getElementById("${inputId}");
			if (!inputEl) return;
			if (!window.EditorJS) {
				console.error("EditorJS not loaded");
				return;
			}

			let editor = null;
			const initialData = ${JSON.stringify(initData || null)};

			const toolMap = {
				header: window.Header,
				list: window.List,
				image: window.ImageTool,
				quote: window.Quote,
				checklist: window.Checklist,
				paragraph: window.Paragraph,
				table: window.Table,
				embed: window.Embed,
				inlineCode: window.InlineCode,
				code: window.CodeTool,
				delimiter: window.Delimiter,
				marker: window.Marker,
				linkTool: window.LinkTool,
				nestedList: window.NestedList,
				raw: window.RawTool,
				simpleImage: window.SimpleImage,
				warning: window.Warning,
				attaches: window.AttachesTool,
			};

			const tools = Object.fromEntries(
				Object.entries(toolMap)
				.filter(([, v]) => !!v)
				.map(([k, v]) => {
					if (k === "list" || k === "nestedList")
					return [k, { class: v, inlineToolbar: true }];
					if (k === "linkTool") return [k, { class: v, inlineToolbar: true }];
					return [k, v];
				})
			);

			const assignValue = async () => {
				if (!editor) return;
				try {
				const data = await editor.save();
				inputEl.value = JSON.stringify(data);
				} catch (e) {
				console.error("Failed to read EditorJS data", e);
				}
			};

			editor = new window.EditorJS({
				holder: holderId,
				autofocus: true,
				readOnly: false,
				data: initialData || undefined,
				placeholder: "Start writing...",
				tools,
				onChange: assignValue,
			});

			const form = inputEl.closest("form");
			if (form) {
				form.addEventListener("submit", function (ev) {
					ev.preventDefault();
					assignValue().then(() => {
						form.submit();
					});
				});
			}
		})();
		`)
      ),
    ]);
  },
};

module.exports = {
  headers,
  fieldviews: {
    EditorJS: EditorJSDisplay,
    EditorJSEdit,
  },
  functions: {
    editorjs_to_html: {
      description: "Convert an EditorJS JSON value to HTML markup",
      run: editorjs_to_html,
      arguments: [{ name: "content", type: "String" }],
    },
  },
};
