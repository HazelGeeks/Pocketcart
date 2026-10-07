const test = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { sourceModule } = require("./helpers/sourceModule.cjs");
const content = sourceModule("src/utils/blogContent.ts", {}, { URL });
const Body = sourceModule("src/components/blog/BlogArticleBody.tsx", {
  react: React,
  "../../utils/blogContent": content,
  "./blogArticleBody.css": {},
}).default;
const render = (nodes, imageUrls = {}) =>
  renderToStaticMarkup(
    React.createElement(Body, {
      post: { sections: [], content: { type: "doc", content: nodes }, imageUrls },
    }),
  );

test("public rich articles preserve headings, typography, links, tables, and signed images", () => {
  const path = "00000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000002.png";
  const html = render(
    [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Shopping plan" }] },
      {
        type: "paragraph",
        attrs: { textAlign: "center" },
        content: [
          {
            type: "text",
            text: "Compare prices",
            marks: [
              { type: "bold" },
              { type: "link", attrs: { href: "https://pocketcart.app/support" } },
              {
                type: "textStyle",
                attrs: { fontFamily: "Georgia", fontSize: "24px", color: "#123456" },
              },
            ],
          },
        ],
      },
      {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              {
                type: "tableHeader",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Item" }] }],
              },
            ],
          },
        ],
      },
      {
        type: "image",
        attrs: { assetPath: path, src: "https://expired.invalid", alt: "Groceries" },
      },
    ],
    { [path]: "https://storage.example.invalid/signed.png" },
  );
  assert.match(html, /id="article-heading-0"/);
  assert.match(html, /<strong>Compare prices<\/strong>/);
  assert.match(html, /font-family:Georgia;font-size:24px/);
  assert.match(html, /text-align:center/);
  assert.match(html, /href="https:\/\/pocketcart.app\/support"/);
  assert.match(html, /<table><tbody><tr><th/);
  assert.match(html, /src="https:\/\/storage.example.invalid\/signed.png"/);
  assert.doesNotMatch(html, /expired.invalid/);
});

test("public rendering escapes pasted text and rejects executable links, images, and styles", () => {
  const html = render([
    {
      type: "paragraph",
      attrs: { fontFamily: "url(javascript:alert(1))", textAlign: "expression(1)" },
      content: [
        {
          type: "text",
          text: "<script>alert(1)</script>",
          marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
        },
      ],
    },
    {
      type: "image",
      attrs: { src: "data:image/svg+xml,<svg onload=alert(1)>", alt: "Blocked image" },
    },
  ]);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /Blocked image/);
  assert.doesNotMatch(html, /<script|<img|href=|style=/);
});
