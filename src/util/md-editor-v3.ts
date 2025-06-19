import { CloseTips, ShowTextTipsInfo } from "@/util/index.ts";
import type { ComponentCustomProperties } from "vue";

export type UploadImageCallbackUrl = {
  url: string;
  alt: string;
  title: string;
};

export type UploadImageTokenResponse = {
  code: number;
  data: {
    upload_url: string;
    preview_url: string;
  };
};

export function PostR2Image(uploadUrl: string, image: File) {
  return fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": image.type,
    },
    body: image,
  });
}

export async function HandleR2ImageUpload(
  files: File[],
  callback: (urls: UploadImageCallbackUrl[]) => void,
  globalProperties: ComponentCustomProperties & Record<string, any>,
  getTokenHandler: () => Promise<UploadImageTokenResponse>
) {
  let urls = [] as { url: string; alt: string; title: string }[];

  const loadingMessage = ShowTextTipsInfo(globalProperties, "图片正在上传，请稍候...", 0);

  try {
    for (const file of files) {
      const res = await getTokenHandler();
      if (res.code !== 0) {
        urls = urls.concat({
          url: "上传失败",
          alt: file.name,
          title: file.name,
        });
        continue;
      }
      const uploadUrl = res.data.upload_url;
      await PostR2Image(uploadUrl, file);
      urls = urls.concat({
        url: res.data.preview_url,
        alt: file.name,
        title: file.name,
      });
    }
  } finally {
    callback(urls);
    CloseTips(globalProperties, loadingMessage);
  }
}
