import { CloseTips, ShowErrorTips, ShowTextTipsInfo } from "@/util/index.ts";
import Vditor from "vditor";
import type { ComponentCustomProperties } from "vue";

export function PostR2Image(uploadUrl: string, image: File) {
  return fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": image.type,
    },
    body: image,
  });
}

export async function uploadR2Image(
  descriptionEditor: Vditor,
  files: File[],
  globalProperties: ComponentCustomProperties & Record<string, any>,
  getTokenHandler: () => Promise<{ code: number; data: { upload_url: string; preview_url: string } }>,
) {
  if (!descriptionEditor) {
    ShowErrorTips(globalProperties, "编辑器已失效，请刷新后重试");
    return null;
  }

  const loadingMessage = ShowTextTipsInfo(globalProperties, "图片正在上传，请稍候...", 0);

  console.log("正在上传图片", files);

  descriptionEditor.disabled();

  try {
    for (const file of files) {
      console.log(file);

      // 使用唯一字符串作为占位符，避免替换出错
      let randomRequestId = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
      const originalPlace = `[正在上传 ⏳ ${randomRequestId}]`;
      let randomContent = originalPlace.replace("⏳", `<span class="sh-anim-loop" style="display: inline-block; font-size: 16px;">⏳</span>`);

      descriptionEditor.insertValue(`\n${randomContent}\n`, false);

      const res = await getTokenHandler();
      if (res.code !== 0) {
        ShowErrorTips(globalProperties, res.code);
        let finalContent = descriptionEditor.getValue();
        finalContent = finalContent.replace(originalPlace, "图片上传失败");
        descriptionEditor.setValue(finalContent);
        continue;
      }
      // 获取上传的 token
      const uploadUrl = res.data.upload_url;

      await PostR2Image(uploadUrl, file);

      // 构建 Markdown 图片语法
      const content = "![图片](" + res.data.preview_url + ")";

      // 替换掉占位符
      let finalContent = descriptionEditor.getValue();
      finalContent = finalContent.replace(originalPlace, content);
      descriptionEditor.setValue(finalContent);
    }
  } finally {
    descriptionEditor.enable();
    CloseTips(globalProperties, loadingMessage);
  }

  return null;
}

export function getCustomRenders() {
  return [
    {
      language: "right",
      render: (element: HTMLElement, _vditor: Vditor) => {
        const elements = element.querySelectorAll(".language-right") as NodeListOf<HTMLDivElement>;
        let text = "";
        elements.forEach((el: HTMLDivElement) => {
          const parentElement = el.parentElement as HTMLDivElement | null;
          if (!parentElement) {
            return;
          }
          text += el.innerText;
          parentElement.innerHTML = `<div style="text-align: right">${text}</div>`;
        });

        console.log(element);
      },
    },
  ] as any;
}

export function md2html(markdown: string) {
  const options = {
    math: {
      inlineDigit: true,
      engine: "KaTeX",
    },
    renderers: {
      renderText: (node: ILuteNode, entering: boolean) => {
        if (entering) {
          const text = node.TokensStr();
          console.log("text", text);
          if (text.startsWith("{{%") && text.endsWith("%}}")) {
            // 处理自定义指令
            const command = text.slice(3, -3).trim();
            if (command === "showtime") {
              const date = new Date();
              return [`当前时间: ${date.toLocaleString()}`, Lute.WalkContinue];
            } else if (command === "showdate") {
              const date = new Date();
              return [`当前日期: ${date.toLocaleDateString()}`, Lute.WalkContinue];
            }
          }
          return [text, Lute.WalkContinue];
        } else {
          return ["", Lute.WalkContinue];
        }
      },
    },
  } as IPreviewOptions;
  return Vditor.md2html(markdown, options);
}
