import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

import router from "./router";
import App from "./App.vue";
import TDesign from "tdesign-vue-next";

import axios from "axios";

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
import 'monaco-editor/esm/vs/basic-languages/lua/lua.contribution'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'

// highlightjs
import hljs from 'highlight.js';

import githubTheme from '@kangc/v-md-editor/lib/theme/github.js';
import '@kangc/v-md-editor/lib/theme/style/github.css';
import '@kangc/v-md-editor/lib/style/codemirror-editor.css';
import '@kangc/v-md-editor/lib/style/preview.css';

import VMdEditor from '@kangc/v-md-editor/lib/codemirror-editor';
// codemirror 编辑器的相关资源
import Codemirror from 'codemirror';
// mode
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/css/css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/vue/vue';
// edit
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/matchbrackets';
// placeholder
import 'codemirror/addon/display/placeholder';
// active-line
import 'codemirror/addon/selection/active-line';
// scrollbar
import 'codemirror/addon/scroll/simplescrollbars';
import 'codemirror/addon/scroll/simplescrollbars.css';
// style
import 'codemirror/lib/codemirror.css';

import VMdPreview from '@kangc/v-md-editor/lib/preview';

import createLineNumbertPlugin from '@kangc/v-md-editor/lib/plugins/line-number/index';
import createKatexPlugin from '@kangc/v-md-editor/lib/plugins/katex/cdn';
import createCopyCodePlugin from '@kangc/v-md-editor/lib/plugins/copy-code/index';
import '@kangc/v-md-editor/lib/plugins/copy-code/copy-code.css';
import createTodoListPlugin from '@kangc/v-md-editor/lib/plugins/todo-list/index';
import '@kangc/v-md-editor/lib/plugins/todo-list/todo-list.css';
import createMermaidPlugin from '@kangc/v-md-editor/lib/plugins/mermaid/cdn';
import '@kangc/v-md-editor/lib/plugins/mermaid/mermaid.css';
import createAlignPlugin from '@kangc/v-md-editor/lib/plugins/align';


VMdEditor.Codemirror = Codemirror;
VMdEditor.use(githubTheme, {
  Hljs: hljs,
});
VMdEditor.use(createKatexPlugin());
VMdEditor.use(createCopyCodePlugin());
VMdEditor.use(createLineNumbertPlugin());
VMdEditor.use(createTodoListPlugin());
VMdEditor.use(createMermaidPlugin());
VMdEditor.use(createAlignPlugin());

VMdPreview.use(githubTheme, {
  Hljs: hljs,
});
VMdPreview.use(createKatexPlugin());
VMdPreview.use(createCopyCodePlugin());
VMdPreview.use(createLineNumbertPlugin());
VMdPreview.use(createTodoListPlugin());
VMdPreview.use(createMermaidPlugin());
VMdPreview.use(createAlignPlugin());

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(TDesign);

app.use(VMdPreview);
app.use(VMdEditor);

app.mount("#app");

ReinitTextCache()
  .then(() => {
    console.log("Text cache reinitialized");
  })
  .catch((e) => {
    console.error("Text cache reinitialization failed", e);
  });

export { axios };
