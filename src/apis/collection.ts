// 导入axios实例
import httpRequest from "@/apis/axios-api";

import type { Collection, CollectionView, CollectionEditRequest } from "@/types/collection";

export function ParseCollection(item: Collection) {
  const result: CollectionView = {} as CollectionView;
  result.id = item.id;
  result.inserter = item.inserter;
  result.inserterUsername = item.inserter_username;
  result.inserterNickname = item.inserter_nickname;
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
  if (item.insert_time) {
    result.insertTime = new Date(item.insert_time).toLocaleString();
  } else {
    result.insertTime = "";
  }
  if (item.modify_time) {
    result.modifyTime = new Date(item.modify_time).toLocaleString();
  } else {
    result.modifyTime = "";
  }

  if (item.description) {
    result.description = item.description;
  } else {
    result.description = "";
  }
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
