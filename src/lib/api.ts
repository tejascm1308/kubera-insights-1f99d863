const API_BASE = 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('access_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || data.detail || 'An error occurred' };
    }

    return { data };
  } catch (error) {
    return { error: 'Network error. Please try again.' };
  }
}

// Auth API
export const authApi = {
  register: (data: {
    email: string;
    username: string;
    password: string;
    full_name: string;
    phone?: string;
    date_of_birth?: string;
  }) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  verifyEmail: (email: string, otp: string) =>
    apiRequest('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, otp }) }),

  resendVerification: (email: string) =>
    apiRequest('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),

  login: (email: string, password: string) =>
    apiRequest<{
      access_token: string;
      refresh_token: string;
      user: { user_id: string; email: string; username: string; full_name: string };
    }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  refresh: (refresh_token: string) =>
    apiRequest<{ access_token: string; refresh_token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    }),

  checkUsername: (username: string) =>
    apiRequest<{ available: boolean; username: string }>(`/auth/check-username/${username}`),

  requestPasswordReset: (email: string) =>
    apiRequest('/auth/password-reset/send-otp', { method: 'POST', body: JSON.stringify({ email }) }),

  confirmPasswordReset: (email: string, otp: string, new_password: string) =>
    apiRequest('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password }),
    }),

  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

// User API
export const userApi = {
  getProfile: () =>
    apiRequest<{
      user_id: string;
      email: string;
      username: string;
      full_name: string;
      phone?: string;
      investment_style?: string;
      risk_tolerance?: string;
      interested_sectors?: string[];
      account_status: string;
    }>('/user/profile'),

  updateProfile: (data: Partial<{
    full_name: string;
    phone: string;
    investment_style: string;
    risk_tolerance: string;
    interested_sectors: string[];
  }>) => apiRequest('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),

  changePassword: (current_password: string, new_password: string) =>
    apiRequest('/user/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password, new_password }),
    }),

  getStats: () =>
    apiRequest<{
      total_chats: number;
      total_messages: number;
      total_portfolio_entries: number;
      total_invested: number;
    }>('/user/stats'),
};

// Portfolio API
export const portfolioApi = {
  getAll: () =>
    apiRequest<{
      portfolio: Array<{
        portfolio_id: string;
        symbol: string;
        quantity: number;
        average_price: number;
        current_price?: number;
        pnl?: number;
        pnl_percentage?: number;
        purchase_date?: string;
      }>;
      total_invested: number;
      current_value: number;
    }>('/portfolio/'),

  add: (data: {
    symbol: string;
    quantity: number;
    average_price: number;
    purchase_date?: string;
  }) => apiRequest('/portfolio/', { method: 'POST', body: JSON.stringify(data) }),

  update: (portfolio_id: string, data: Partial<{ quantity: number; average_price: number }>) =>
    apiRequest(`/portfolio/${portfolio_id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (portfolio_id: string) =>
    apiRequest(`/portfolio/${portfolio_id}`, { method: 'DELETE' }),

  updatePrices: () => apiRequest('/portfolio/update-prices', { method: 'POST' }),
};

// Chat API
export const chatApi = {
  getAll: () =>
    apiRequest<{
      chats: Array<{
        chat_id: string;
        title: string;
        created_at: string;
        last_activity_at: string;
        message_count: number;
      }>;
    }>('/chats/'),

  create: (title?: string) =>
    apiRequest<{ chat: { chat_id: string; title: string } }>('/chats/', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  get: (chat_id: string) =>
    apiRequest<{
      chat_id: string;
      title: string;
      messages: Array<{
        message_id: string;
        role: 'user' | 'assistant';
        content: string;
        created_at: string;
      }>;
    }>(`/chats/${chat_id}`),

  rename: (chat_id: string, title: string) =>
    apiRequest(`/chats/${chat_id}/rename`, { method: 'PUT', body: JSON.stringify({ title }) }),

  delete: (chat_id: string) => apiRequest(`/chats/${chat_id}`, { method: 'DELETE' }),
};

export { API_BASE };
