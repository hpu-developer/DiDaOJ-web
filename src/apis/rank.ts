import httpRequest from "@/apis/axios-api";

export function GetRankAC(page: number, pageSize: number) {
  return httpRequest({
    url: "/rank/ac/all" + "?page=" + page + "&page_size=" + pageSize,
    method: "get",
  });
}
