import axios from "axios";

import { useDeveloperStore } from "@/stores/developer.ts";

const baseURL = import.meta.env.VITE_API_BASE || "/api/";

// 创建一个 axios 实例
const service = axios.create({
  baseURL: baseURL, // 所有的请求地址前缀部分
  timeout: 60000, // 请求超时时间毫秒
  withCredentials: true, // 异步请求携带cookie
  headers: {
    // 设置后端需要的传参类型
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// 请求拦截器，设置 X-Token
service.interceptors.request.use(
  (config) => {
    const developerStore = useDeveloperStore();
    const token = developerStore.getToken;
    if (token) {
      config.headers["X-Token"] = token; // 设置 X-Token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
service.interceptors.response.use(
  function (response) {
    return response.data;
  },
  function (error) {
    return Promise.reject(error);
  }
);

declare module "axios" {
  interface AxiosInstance {
    (config: AxiosRequestConfig): Promise<any>;
  }
}

export default service;
