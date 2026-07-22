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
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.login = login;
      }
      return config;
    },
    (error) => {
      console.log('error', error);

      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error?.response?.status === 409 && error?.config?.url !== '/logout') {
        sessionStorage.clear();
        try {
          api.get('/logout');
        } catch (logoutError) {
          console.log(logoutError);
        }
      }
      return Promise.reject(error);
    }
  );
};

export const dropDown = async (type: string, query?: string) => {
  try {
    const params = query ? `?${query}` : '';
    const response = await api(`${type}/dropdown${params}`);
    if (response.status === 200) {
      return response.data?.data || response.data;
    }
  } catch (error) {
    console.error(`Falha ao carregar dropdown ${type}:`, error);
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

export const filterAmilGuides = async (
  filterData: Record<string, any> = {},
  page = 1,
  limit = 10
) => {
  const params = new URLSearchParams();

  Object.entries(filterData).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    params.append(key, value?.id || value);
  });

  params.set('page', String(page));
  params.set('limit', String(limit));

  try {
    const response = await api.get(`/guias${params.toString() ? `?${params.toString()}` : ''}`);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error('Falha ao consultar guias Amil:', error);
  }

  return { data: [] };
};

export const actionAmilGuide = async (guideId: number | string, action: string) => {
  if (action === 'reenviar') {
    try {
      const response = await api.post(`/guias/${guideId}/enviar`, {});
      if (response.status === 200 || response.status === 201) {
        return response.data;
      }
    } catch (error) {
      console.error('Falha ao reenviar guia Amil:', error);
    }
  }

  return { data: { message: 'Ação enviada para o backend.' } };
};

export const getAmilGuideDropdowns = async () => {
  try {
    const pacientesResponse = await dropDown('paciente');
    const pacientes = Array.isArray(pacientesResponse)
      ? pacientesResponse.map((item: any) => (typeof item === 'string' ? { id: item, nome: item } : item))
      : [];

    const guiaDropdownResponse = await api.get('/guias/dropdown').catch(() => null);
    const guiaDropdownPayload = guiaDropdownResponse?.status === 200
      ? (guiaDropdownResponse?.data?.data || guiaDropdownResponse?.data || {})
      : {};

    const status = Array.isArray(guiaDropdownPayload?.status || guiaDropdownPayload?.statuses || guiaDropdownPayload?.statusEventos)
      ? (guiaDropdownPayload?.status || guiaDropdownPayload?.statuses || guiaDropdownPayload?.statusEventos || []).map((item: any) => (typeof item === 'string' ? { id: item, nome: item } : item))
      : [];

    const origens = Array.isArray(guiaDropdownPayload?.origens || guiaDropdownPayload?.origem || guiaDropdownPayload?.origins)
      ? (guiaDropdownPayload?.origens || guiaDropdownPayload?.origem || guiaDropdownPayload?.origins || []).map((item: any) => (typeof item === 'string' ? { id: item, nome: item } : item))
      : [];

    return {
      pacientes,
      status,
      origens,
    };
  } catch (error) {
    console.error('Falha ao carregar dropdowns de guias Amil:', error);
  }

  try {
    const fallbackResponse = await api.get('/guias');
    if (fallbackResponse.status === 200) {
      const payload = fallbackResponse?.data?.data || fallbackResponse?.data || [];
      const items = Array.isArray(payload) ? payload : payload.items || [];

      return {
        pacientes: items
          .map((item: any) => item?.paciente?.nome || item?.pacienteNome)
          .filter(Boolean)
          .map((name: string) => ({ id: name, nome: name })),
        status: Array.from(new Set(items.map((item: any) => item?.status).filter(Boolean))).map((value) => ({ id: value, nome: value })),
        origens: Array.from(new Set(items.map((item: any) => item?.origem).filter(Boolean))).map((value) => ({ id: value, nome: value })),
      };
    }
  } catch (fallbackError) {
    console.error('Falha ao carregar dropdowns de fallback:', fallbackError);
  }

  return {};
};
