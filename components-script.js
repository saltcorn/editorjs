const headers = [
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.31.0/dist/editorjs.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/header@2.8.8/dist/header.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/list@2.0.9/dist/editorjs-list.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/image@2.10.3/dist/image.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/quote@2.7.6/dist/quote.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/checklist@1.6.0/dist/checklist.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/paragraph@2.11.7/dist/paragraph.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/table@2.4.5/dist/table.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/embed@2.8.0/dist/embed.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/inline-code@1.5.2/dist/inline-code.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/code@2.9.4/dist/code.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/delimiter@1.4.2/dist/delimiter.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/marker@1.4.0/dist/marker.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/link@2.6.2/dist/link.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/nested-list@1.4.3/dist/nested-list.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/raw@2.5.1/dist/raw.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/simple-image@1.6.0/dist/simple-image.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/warning@1.4.1/dist/warning.umd.min.js",
  },
  {
    script:
      "https://cdn.jsdelivr.net/npm/@editorjs/attaches@1.3.2/dist/attaches.umd.min.js",
  },
];

const fs = require("fs");
const path = require("path");
const https = require("https");

const publicDir = path.join(__dirname, "public");

const download = (url, dest) =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          file.close();
          fs.unlink(dest, () => reject(new Error(`HTTP ${res.statusCode} for ${url}`)));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(dest, () => reject(err));
      });
  });

const main = async () => {
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  for (const { script } of headers) {
    if (!script) continue;
    const baseName = path.basename(script);
    const target = path.join(publicDir, `editorjs-${baseName}`);
    console.log(`Downloading ${script} -> ${target}`);
    try {
      await download(script, target);
      console.log(`Saved ${target}`);
    } catch (err) {
      console.error(`Failed ${script}:`, err.message);
    }
  }
};

main();