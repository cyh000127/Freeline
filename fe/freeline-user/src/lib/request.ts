import type { AxiosRequestConfig } from 'axios';
import { ensureOk, unwrap } from './api';
import { http } from './http';

export function withAccessToken(accessToken?: string | null): AxiosRequestConfig {
  if (!accessToken) {
    return {};
  }

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

export async function getData<T>(url: string, config?: AxiosRequestConfig) {
  const response = await http.get(url, config);
  return unwrap<T>(response);
}

export async function postData<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  const response = await http.post(url, data, config);
  return unwrap<T>(response);
}

export async function patchData<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  const response = await http.patch(url, data, config);
  return unwrap<T>(response);
}

export async function postOk(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  const response = await http.post(url, data, config);
  ensureOk(response);
}

export async function deleteOk(url: string, config?: AxiosRequestConfig) {
  const response = await http.delete(url, config);
  ensureOk(response);
}
