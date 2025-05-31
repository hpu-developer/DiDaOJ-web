// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { Collection, CollectionView, CollectionCreateRequest, CollectionDescription, CollectionProblem } from "@/types/collection";
import Vditor from "vditor";

export function GetCollectionProblemIndexStr(index: number): string {
  let result = "";
  while (index > 0) {
    index--;
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26);
  }
  return result;
}

export async function ParseCollection(item: Collection): Promise<CollectionView> {
  const result: CollectionView = {} as CollectionView;
  result.id = item.id;
  result.ownerId = item.owner_id;
  result.ownerUsername = item.owner_username;
  result.ownerNickname = item.owner_nickname;
  result.title = item.title;

  if (item.start_time) {
    result.startTime = new Date(item.start_time).toLocaleString();
  } else {
    result.startTime = "无限制";
  }
  if (item.end_time) {
    result.endTime = new Date(item.end_time).toLocaleString();
  } else {
    result.endTime = "无限制";
  }

  if (item.descriptions) {
    result.descriptions = [];
    const options = {
      math: {
        inlineDigit: true,
        engine: "KaTeX",
      },
    } as IPreviewOptions;
    for (let i = 0; i < item.descriptions.length; i++) {
      const description = item.descriptions[i];
      const contentDescription = {} as CollectionDescription;
      contentDescription.title = description.title;
      contentDescription.content = await Vditor.md2html(description.content, options);
      contentDescription.sort = description.sort;
      result.descriptions.push(contentDescription);
    }
  }
  result.notification = item.notification;
  if (item.problems) {
    // item.problems根据sort字段排序
    result.problems = [];
    item.problems.sort((a: CollectionProblem, b: CollectionProblem) => {
      return a.index - b.index;
    });
    for (let i = 0; i < item.problems.length; i++) {
      const problem = item.problems[i];
      if (!problem.accept) {
        problem.accept = 0;
      }
      if (!problem.attempt) {
        problem.attempt = 0;
      }
      problem.id = GetCollectionProblemIndexStr(problem.index);
      result.problems.push(problem);
    }
  }
  return result;
}

export function GetCollection(collectionId: string) {
  return httpRequest({
    url: "/collection" + "?id=" + collectionId,
    method: "get",
  });
}

export function GetCollectionList(page: number, pageSize: number) {
  return httpRequest({
    url: "/collection/list" + "?page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}

export function GetCollectionRank(id: number) {
  return httpRequest({
    url: "/collection/rank" + "?id=" + id,
    method: "get",
  });
}

export function PostCreateCollection(request: CollectionCreateRequest) {
  return httpRequest({
    url: "/collection/create",
    method: "post",
    data: request,
  });
}
