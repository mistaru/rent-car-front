import axios from 'axios';
import { useAppStore } from '@/stores/app';
import router from '../router/index';
const origin = window.location.origin;
const dnsMapper:Record<string, string> = {
  'localhost': 'http://localhost:8081/api',
  '178.105.184.173': 'http://178.105.184.173:8080/api',
  '178.105.184.173': 'http://178.105.184.173:8080/api',
};

const getBaseUrl = () => {
  const matchedKey = Object.keys(dnsMapper).find(key => origin.includes(key));
  return matchedKey ? dnsMapper[matchedKey] : 'http://178.105.184.173:8080/api';
};
const axiosIns = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 180000,
});

axiosIns.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

axiosIns.interceptors.response.use(
  response => {
    return response;
  },
  err => {
    const status = err?.response?.status;
    if ([401, 403].includes(status)) {
      const store = useAppStore();
      store.logout();
      router.push('/login');
    }

    return Promise.reject(err);
  }
);

export default axiosIns;
