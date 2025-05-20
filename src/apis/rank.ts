import httpRequest from "@/apis/axios-api";

export function GetRankACAll(page: number, pageSize: number) {
  return httpRequest({
    url: "/rank/ac/all" + "?page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}

export function GetRankACProblem(page: number, pageSize: number) {
  return httpRequest({
    url: "/rank/ac/problem" + "?page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}
