import type MarkdownIt from "markdown-it";

// 定义一个通用的渲染器：接受字符串数组（参数列表），返回字符串（HTML）
type ShortcodeRenderer = (args: string[]) => string;

// 插件选项类型
interface ShortcodePluginOptions {
  renderers?: Record<string, ShortcodeRenderer>;
}

// 插件本体
function shortcodeInlinePlugin(md: MarkdownIt, options: ShortcodePluginOptions = {}) {
  const pattern = /\{\{%\s*(\w+)\s+([^%]+?)\s*%\}\}/g;
  const renderers = options.renderers || {};

  // 原本的 text 渲染器
  const defaultRender =
    md.renderer.rules.text ??
    function (tokens: any[], idx: number) {
      return tokens[idx].content;
    };

  md.renderer.rules.text = function (tokens: any[], idx: number, opts, env, self) {
    const token = tokens[idx];
    const content = token.content;

    // 如果不包含 shortcode 模式，直接返回原始渲染
    if (!pattern.test(content)) {
      return defaultRender(tokens, idx, opts, env, self);
    }

    // 替换所有匹配的 shortcode
    const replaced = content.replace(pattern, (_: any, name: string, argStr: string) => {
      const renderer = renderers[name];

      if (typeof renderer === "function") {
        const args = argStr.trim().split(/\s+/);
        return renderer(args);
      } else {
        // 默认渲染为 span
        return `<span class="shortcode-${name}">${name}: ${argStr.trim()}</span>`;
      }
    });

    return replaced;
  };
}
function shortcodeColorPlugin(md: MarkdownIt, options: {
  renderers: Record<string, (args: string[], content: string) => string>
}) {
  const pattern = /\{\{%\s*(\w+)\s*%\}\}([\s\S]*?)\{\{%\s*\/\1\s*%\}\}/g;

  md.core.ruler.push("shortcode_color", (state) => {
    for (const token of state.tokens) {
      if (token.type !== "inline") continue;

      let content = token.content;
      let replaced = false;

      content = content.replace(pattern, (match, tagName, innerContent) => {
        const renderer = options.renderers?.[tagName];
        if (renderer) {
          replaced = true;
          return renderer([], innerContent.trim());
        } else {
          return match; // 未知标签保留原样
        }
      });

      if (replaced) {
        // 替换成功，直接用 HTML 片段替换
        token.type = "html_inline";
        token.tag = "";
        token.attrs = null;
        token.content = content;
        token.children = [];
      }
    }
  });
}

export { shortcodeInlinePlugin, shortcodeColorPlugin };
export type { ShortcodePluginOptions, ShortcodeRenderer };
