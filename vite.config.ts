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
        // 手动代码分割，单独提取 Monaco 编辑器和其他语言特性
        manualChunks: {
          "monaco-editor-core": ["monaco-editor/esm/vs/editor/editor.api.js"],
          "monaco-editor-languages": [
            "monaco-editor/esm/vs/basic-languages/cpp/cpp.js",
            "monaco-editor/esm/vs/basic-languages/java/java.js",
            "monaco-editor/esm/vs/basic-languages/python/python.js",
          ],
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
