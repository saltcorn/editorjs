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

const renderNestedItems = (items = [], style = "unordered") => {
  if (!Array.isArray(items) || items.length === 0) return "";
  const tag = style === "ordered" ? "ol" : "ul";
  const renderItem = (item) => {
    const child = renderNestedItems(item.items || [], item.style || style);
    const content = item.content || "";
    return `<li>${content}${child}</li>`;
  };
  return `<${tag} style="padding-left: 1em;">${items
    .map(renderItem)
    .join("")}</${tag}>`;
};

const parser = editorjsHTML({
  raw: ({ data }) => {
    const { html } = data;
    return html || "";
  },
  nestedList: ({ data }) => {
    const { items, style } = data;
    return renderNestedItems(items, style);
  },
  checklist: ({ data }) => {
    const { items } = data;
    if (!Array.isArray(items) || items.length === 0) return "";
    const listItems = items
      .map(
        (item) =>
          `<li style="list-style: none;"><input type="checkbox" disabled${
            item.checked ? " checked" : ""
          }/> ${item.text}</li>`,
      )
      .join("");
    return `<ul class="checklist" style="padding-left: 0;">${listItems}</ul>`;
  },
  linkTool: ({ data }) => {
    const { link, meta } = data;
    const title = (meta && meta.title) || link;
    return `<a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a>`;
  },
  table: ({ data }) => {
    const rowsData = Array.isArray(data.content) ? data.content : [];
    if (rowsData.length === 0) return "";
    const rows = rowsData
      .map((row, rowIndex) => {
        const cellTag = data.withHeadings && rowIndex === 0 ? "th" : "td";
        const cells = row
          .map((cell) => `<${cellTag}>${cell ?? ""}</${cellTag}>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    const attrs = data.stretched ? ' class="table-stretched"' : "";
    return `<table${attrs}>${rows}</table>`;
  },
  attaches: ({ data }) => {
    const { file, title } = data;
    const displayTitle = title || file.name || "Attachment";
    return `<a href="${file.url}" target="_blank" rel="noopener noreferrer">${displayTitle}</a>`;
  },
});

const editorjs_to_html = (content) => {
  if (content == null) return "";
  let data = content;
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

const EditorJSViewer = {
  type: "JSON",
  isEdit: false,
  blockDisplay: true,
  run: (value) => editorjs_to_html(value),
};

const EditorJSEdit = {
  type: "JSON",
  isEdit: true,
  blockDisplay: true,
  configFields: [
    { name: "autofocus", label: "Autofocus", type: "Bool", default: true },
  ],
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
      const removeFileExtension = (filename) => {
        return filename.includes(".") ? filename.substring(0, filename.lastIndexOf(".")) : filename;
      };
      // Provide a basic in-browser uploader so ImageTool works without explicit endpoints.
      const defaultImageUploader = {
        uploadByFile(file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({ success: 1, file: { url: reader.result } });
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          });
        },
        uploadByUrl(url) {
          return Promise.resolve({ success: 1, file: { url } });
        },
      };
      // Provide a simple data-URL uploader for Attaches tool.
      const defaultAttachesUploader = {
        uploadByFile(file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const name = file.name || "attachment";
              const size = file.size || 0;
              const extension = name.includes(".")
                ? name.split(".").pop()
                : "";
              resolve({
                success: 1,
                file: { url: reader.result, name, size, extension, title: removeFileExtension(name) },
              });
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
          });
        },
        uploadByUrl(url) {
          return Promise.resolve({ success: 1, file: { url, name: url } });
        },
      };
      // Patch LinkTool to work without a metadata endpoint by using a minimal client-side preview.
      if (window.LinkTool && !window.LinkTool.__edjsPatchedFallback) {
        const proto = window.LinkTool.prototype;
        const originalFetch = proto.fetchLinkData;
        proto.fetchLinkData = async function (url) {
          if (this.config && this.config.endpoint) {
            return originalFetch.call(this, url);
          }
          this.showProgress();
          this.data = { link: url };
          const meta = { title: url, description: "", image: null };
          this.onFetch({ success: true, link: url, meta });
        };
        window.LinkTool.__edjsPatchedFallback = true;
      }
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
          if (k === "header")
            return [
              k,
              {
                class: v,
                inlineToolbar: true,
                config: {
                  levels: [1, 2, 3, 4],
                  defaultLevel: 2,
                  placeholder: "Heading",
                },
              },
            ];
          if (k === "paragraph" || k === "quote" || k === "checklist")
            return [k, { class: v, inlineToolbar: true }];
          if (k === "linkTool") return [k, { class: v, inlineToolbar: true }];
          if (k === "image")
            return [k, { class: v, config: { uploader: defaultImageUploader } }];
          if (k === "attaches")
            return [
            k,
            {
              class: v,
              config: {
                uploader: defaultAttachesUploader,
                errorMessage: "File upload failed",
              },
            },
            ];
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
				autofocus: ${attrs.autofocus === false ? "false" : "true"},
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
		`),
      ),
    ]);
  },
};

module.exports = {
  headers,
  fieldviews: {
    editorjs_viewer: EditorJSViewer,
    editorjs: EditorJSEdit,
  },
  functions: {
    editorjs_to_html: {
      description: "Convert an EditorJS JSON value to HTML markup",
      run: editorjs_to_html,
      arguments: [{ name: "content", type: "String" }],
    },
  },
};
