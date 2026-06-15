const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || '请求失败');
  }
  return res.json();
}

export const eventsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/events${qs ? '?' + qs : ''}`);
  },
  get: (id) => request(`/events/${id}`),
  create: (data) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/events/${id}`, { method: 'DELETE' }),
};

export const propsApi = {
  monthly: (year, month) => request(`/props?year=${year}&month=${month}`),
};

export const incomeApi = {
  get: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/income${qs ? '?' + qs : ''}`);
  },
};
