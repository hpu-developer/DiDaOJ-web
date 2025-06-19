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

import shortcodeInlinePlugin from '@/util/shortcode.ts';

config({
  markdownItConfig(mdit) {
    mdit.use(container, "align-right", {
      render(tokens, idx) {
        return tokens[idx].nesting === 1 ? '<div class="sh-align-right">\n' : "</div>\n";
      },
    });
    mdit.use(shortcodeInlinePlugin, {
      renderers: {
        problem: ([id]) => `<a href="/problem/${id}" target="_blank" class="sh-problem-tag t-tag t-tag--default t-tag--dark" data-id="${id}">${id}</a>`,
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
