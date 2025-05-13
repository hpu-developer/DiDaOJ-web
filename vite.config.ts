import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { TDesignResolver } from "unplugin-vue-components/resolvers";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    visualizer({ open: true }),
    vue(),
    vueJsx(),
    AutoImport({
      resolvers: [
        TDesignResolver({
          library: "vue-next", // 确保加载的是 Vue 3 版本的 TDesign
        }),
      ],
    }),
    Components({
      resolvers: [
        TDesignResolver({
          library: "vue-next", // 同样需要确保按需加载
        }),
      ],
    }),
    monacoEditorPlugin({
      languageWorkers: ["editorWorkerService"],
      customWorkers: [
        {
          label: "c",
          entry: "monaco-editor/esm/vs/basic-languages/cpp/cpp.js",
        },
        {
          label: "cpp",
          entry: "monaco-editor/esm/vs/basic-languages/cpp/cpp.js",
        },
        {
          label: "java",
          entry: "monaco-editor/esm/vs/basic-languages/java/java.js",
        },
        {
          label: "python",
          entry: "monaco-editor/esm/vs/basic-languages/python/python.js",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将 TDesign 相关的组件拆分到单独的文件中
          if (id.includes("node_modules/tdesign-vue-next")) {
            return "tdesign-vue-next";
          }
          // 将 Monaco 编辑器相关的文件拆分成单独的文件
          if (id.includes("node_modules/monaco-editor")) {
            return "monaco-editor";
          }
          if (id.includes("node_modules/highlight.js")) {
            return "highlight.js";
          }
          if (id.includes("node_modules/vditor")) {
            return "vditor";
          }
          // 第三方库单独分为一个文件
          if (id.includes("node_modules")) {
            return "node_modules";
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8180", // 接口的域名
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
