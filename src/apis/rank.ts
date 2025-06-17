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

export function GetRankACProblemToday(page: number, pageSize: number) {
  return httpRequest({
    url: "/rank/ac/problem/today" + "?page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}

export function GetRankACProblemDay7(page: number, pageSize: number) {
  return httpRequest({
    url: "/rank/ac/problem/day7" + "?page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}

export function GetRankACProblemDay30(page: number, pageSize: number) {
  return httpRequest({
    url: "/rank/ac/problem/day30" + "?page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}

export function GetRankACProblemYear(page: number, pageSize: number) {
  return httpRequest({
    url: "/rank/ac/problem/year" + "?page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}
