import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import router from "./router";
import App from "./App.vue";
import TDesign from "tdesign-vue-next";

import axios from "axios";
import hljs from "highlight.js/lib/core";
import verilog from "highlight.js/lib/languages/verilog";
import hljsVuePlugin from "@highlightjs/vue-plugin";

import "tdesign-vue-next/es/style/index.css";
import "./assets/main.css";

import "highlight.js/styles/stackoverflow-light.css";
import { ReinitTextCache } from "@/text/library.ts";
import 'vditor/dist/index.css'

import 'monaco-editor/esm/vs/editor/editor.all.js';
// 加载语言支持
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution'
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution'
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution'
import 'monaco-editor/esm/vs/basic-languages/pascal/pascal.contribution'
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution'

hljs.registerLanguage("verilog", verilog);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(TDesign);

app.use(hljsVuePlugin);

app.mount("#app");

ReinitTextCache()
  .then(() => {
    console.log("Text cache reinitialized");
  })
  .catch((e) => {
    console.error("Text cache reinitialization failed", e);
  });

export { axios };
