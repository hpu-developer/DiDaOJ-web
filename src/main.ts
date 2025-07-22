import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import router from "./router";
import App from "./App.vue";
import TDesign from "tdesign-vue-next";

import axios from "axios";

import "tdesign-vue-next/es/style/index.css";
import "./assets/main.css";

import { ReinitTextCache } from "@/text/library.ts";

import "monaco-editor/esm/vs/editor/editor.all.js";
// 加载语言支持
import "monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution";
import "monaco-editor/esm/vs/basic-languages/java/java.contribution";
import "monaco-editor/esm/vs/basic-languages/pascal/pascal.contribution";
import "monaco-editor/esm/vs/basic-languages/go/go.contribution";
import "monaco-editor/esm/vs/basic-languages/lua/lua.contribution";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";

import "md-editor-v3/lib/style.css";

import { MdEditor, MdPreview } from "md-editor-v3";

import { config } from "md-editor-v3";
import LinkAttr from "markdown-it-link-attributes";
import container from "markdown-it-container";

import { shortcodeInlinePlugin, shortcodeColorPlugin } from "@/util/shortcode.ts";

import screenfull from "screenfull";

import katex from "katex";
import "katex/dist/katex.min.css";

import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

import mermaid from "mermaid";

import highlight from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

import * as prettier from "prettier";
import parserMarkdown from "prettier/plugins/markdown";

config({
  editorExtensions: {
    prettier: {
      prettierInstance: prettier,
      parserMarkdownInstance: parserMarkdown,
    },
    highlight: {
      instance: highlight,
    },
    screenfull: {
      instance: screenfull,
    },
    katex: {
      instance: katex,
    },
    cropper: {
      instance: Cropper,
    },
    mermaid: {
      instance: mermaid,
    },
  },
  markdownItConfig(mdit) {
    mdit.use(container, "align-left", {
      render(tokens: any[], idx: number) {
        return tokens[idx].nesting === 1 ? '<div class="sh-align-left">\n' : "</div>\n";
      },
    });
    mdit.use(container, "align-center", {
      render(tokens: any[], idx: number) {
        return tokens[idx].nesting === 1 ? '<div class="sh-align-center">\n' : "</div>\n";
      },
    });
    mdit.use(container, "align-right", {
      render(tokens: any[], idx: number) {
        return tokens[idx].nesting === 1 ? '<div class="sh-align-right">\n' : "</div>\n";
      },
    });
    mdit.use(shortcodeInlinePlugin, {
      renderers: {
        problem: ([id]) => `<oj-problem id="${id}">${id}</oj-problem>`,
      },
    });
    mdit.use(shortcodeColorPlugin, {
      renderers: {
        red: (_, c) => `<span class="dida-font-red">${c}</span>`,
        green: (_, c) => `<span class="dida-font-green">${c}</span>`,
        blue: (_, c) => `<span class="dida-font-blue">${c}</span>`,
      },
    });
  },
  markdownItPlugins(plugins) {
    return [
      ...plugins,
      {
        type: "linkAttr",
        plugin: LinkAttr,
        options: {
          matcher(href: string) {
            // 如果使用了markdown-it-anchor
            // 应该忽略标题头部的锚点链接
            return !href.startsWith("#");
          },
          attrs: {
            target: "_blank",
          },
        },
      },
    ];
  },
});

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(TDesign);

app.use(MdEditor);
app.use(MdPreview);

app.mount("#app");

ReinitTextCache()
  .then(() => {
    console.log("Text cache reinitialized");
  })
  .catch((e) => {
    console.error("Text cache reinitialization failed", e);
  });

export { axios };
