import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import { config } from "dotenv";
import { createRequire } from "node:module";

// Match Expo's environment precedence without exporting any private variables.
if (process.env.EXPO_NO_DOTENV !== "1") {
  for (const file of [".env.production.local", ".env.local", ".env.production", ".env"])
    config({ path: file, quiet: true });
}
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
const configuredAnalytics = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
const analytics =
  /^G-[A-Z0-9]+$/.test(configuredAnalytics) && !/X{4,}/.test(configuredAnalytics)
    ? configuredAnalytics
    : "";
if (!url || !key)
  throw new Error("Public Supabase URL and anonymous key are required for blog SSR.");
if (!key.startsWith("sb_publishable_")) {
  let role;
  try {
    role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role;
  } catch {
    /* Invalid keys fail below. */
  }
  if (role !== "anon") throw new Error("Only a public anonymous Supabase key may be bundled.");
}
if (
  new URL(url).protocol !== "https:" &&
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
)
  throw new Error("Public Supabase URL must use HTTPS.");
const files = [
  "src/components/marketing/marketing.css",
  "src/components/marketing/blog.css",
  "src/components/marketing/faq.css",
  "src/components/blog/blogArticleBody.css",
  "src/web/public.css",
];
const css = (await Promise.all(files.map((file) => fs.readFile(file, "utf8")))).join("\n");
const hash = createHash("sha256").update(css).digest("hex").slice(0, 16);
const cssPath = `/public-blog-${hash}.css`;
await fs.mkdir(".web-server", { recursive: true });
await fs.writeFile(`dist${cssPath}`, css);
await fs.copyFile("assets/web-logo.png", "dist/web-logo.png");
await fs.copyFile("assets/photos/fresh-grocery-basket.jpg", "dist/grocery-basket.jpg");
await fs.writeFile(
  "dist/_headers",
  `/_expo/static/*\n  Cache-Control: public, max-age=31536000, immutable\n/public-blog-*\n  Cache-Control: public, max-age=31536000, immutable\n`,
);
await build({
  stdin: {
    contents: `import {renderToStaticMarkup} from 'react-dom/server';
    import {createElement} from 'react'; import StaticDocument from './src/web/StaticDocument';
    export const renderPage = props => '<!doctype html>' + renderToStaticMarkup(createElement(StaticDocument, props));`,
    resolveDir: process.cwd(),
    loader: "tsx",
  },
  outfile: ".web-server/static-pages.cjs",
  bundle: true,
  format: "cjs",
  platform: "node",
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"production"',
    __PUBLIC_ANALYTICS_ID__: JSON.stringify(analytics),
  },
  alias: {
    "react-native": "react-native-web",
    "react-native-svg": "react-native-svg/lib/module/ReactNativeSVG.web.js",
  },
  resolveExtensions: [".web.tsx", ".web.ts", ".web.js", ".tsx", ".ts", ".js", ".json"],
  loader: { ".css": "empty" },
  plugins: [
    {
      name: "public-photo",
      setup(builder) {
        builder.onLoad({ filter: /fresh-grocery-basket\.jpg$/ }, () => ({
          contents: 'export default "/grocery-basket.jpg";',
          loader: "js",
        }));
      },
    },
  ],
});
const { renderPage } = createRequire(import.meta.url)("../.web-server/static-pages.cjs");
for (const locale of ["en", "fr"]) {
  await fs.mkdir(`dist/rendered/${locale}`, { recursive: true });
  for (const route of ["home", "privacy", "terms", "support"]) {
    await fs.writeFile(
      `dist/rendered/${locale}/${route}.html`,
      renderPage({ route, locale, cssPath }),
    );
  }
}
await build({
  entryPoints: ["src/web/worker.tsx"],
  outfile: ".web-server/worker.mjs",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  jsx: "automatic",
  minify: true,
  define: {
    "process.env.NODE_ENV": '"production"',
    __PUBLIC_BACKEND__: JSON.stringify({ url, key }),
    __PUBLIC_CSS_PATH__: JSON.stringify(cssPath),
    __PUBLIC_ANALYTICS_ID__: JSON.stringify(analytics),
  },
});
console.log(`Public blog server and ${cssPath} generated.`);
