import axios from 'axios';
import { DEVICE } from '../util/util';

export interface ResponseSuccessProps {
  data: {
    message: string;
  };
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    device: DEVICE.web,
  },
});

export const intercepttRoute = (token: string, login: string) => {
  api.interceptors.request.use(
    async (config: any) => {
      if (!config.url.endsWith('login')) {
        // const userTokenExpiration = new Date(token);
        // const today = new Date();
        // if (today > userTokenExpiration) {
        //   config.headers.Authorization = null;
        // } else {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.login = login;

        // }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

export const dropDown = async (type: string, query?: string) => {
  const params = query ? `?${query}` : '';
  const response = await api(`${type}/dropdown${params}`);
  if (response.status === 200) {
    return response.data?.data || response.data;
  }
  return [];
};

export const create = async (url: string, data: any) => {
  return await api.post(url, data);
};

export const update = async (url: string, data: any) => {
  return await api.put(url, data);
};

export const deleteItem = async (url: string) => {
  return await api.delete(`${url}`);
};

export const getList = async (type: string) => {
  const response = await api(type);
  if (response.status === 200) {
    return response.data;
  }
  return [];
};

export const search = async (type: string, work: string) => {
  return await api(`${type}/${work}`);
};

export const filter = async (type: string, _filter: object, query?: any) => {
  const params = query ? `?${query}` : '';

  return await api.post(`${type}/filtro${params}`, _filter);
};

export const getPost = async (type: string, _filter: object, query?: any) => {
  const params = query ? `?${query}` : '';

  return await api.post(`${type}${params}`, _filter);
};
