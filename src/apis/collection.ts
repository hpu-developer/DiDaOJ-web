// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { Collection, CollectionView, CollectionEditRequest } from "@/types/collection";
import Vditor from "vditor";

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
  if (item.update_time) {
    result.updateTime = new Date(item.update_time).toLocaleString();
  } else {
    result.updateTime = "";
  }
  if (item.create_time) {
    result.createTime = new Date(item.create_time).toLocaleString();
  } else {
    result.createTime = "";
  }

  if (item.description) {
    const options = {
      math: {
        inlineDigit: true,
        engine: "KaTeX",
      },
    } as IPreviewOptions;
    result.description = await Vditor.md2html(item.description, options);
  } else {
    result.description = "";
  }
  result.problems = item.problems;
  return result;
}

export function GetCollection(collectionId: number) {
  return httpRequest({
    url: "/collection" + "?id=" + collectionId,
    method: "get",
  });
}

export function GetCollectionEdit(collectionId: string) {
  return httpRequest({
    url: "/collection/edit" + "?id=" + collectionId,
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

export function PostCollectionCreate(request: CollectionEditRequest) {
  return httpRequest({
    url: "/collection/create",
    method: "post",
    data: request,
  });
}

export function PostCollectionEdit(request: CollectionEditRequest) {
  return httpRequest({
    url: "/collection/edit",
    method: "post",
    data: request,
  });
}

export function PostCollectionJoin(collectionId: number) {
  return httpRequest({
    url: "/collection/join",
    method: "post",
    data: {
      id: collectionId,
    },
  });
}

export function PostCollectionQuit(collectionId: number) {
  return httpRequest({
    url: "/collection/quit",
    method: "post",
    data: {
      id: collectionId,
    },
  });
}
