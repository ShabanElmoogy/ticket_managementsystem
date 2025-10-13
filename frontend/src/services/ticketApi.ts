import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const ticketApi = {
  // Ticket operations
  createTicket: async (ticketData: any) => {
    const response = await api.post("/tickets", ticketData);
    return response.data;
  },

  updateTicket: async (ticketId: string, ticketData: any) => {
    const response = await api.put(`/tickets/${ticketId}`, ticketData);
    return response.data;
  },

  getTicket: async (ticketId: string) => {
    const response = await api.get(`/tickets/${ticketId}`);
    return response.data;
  },

  // Support data
  getUsers: async () => {
    const response = await api.get("/users");
    return response.data;
  },

  getCustomers: async () => {
    const response = await api.get("/customers");
    return response.data;
  },

  getApplications: async () => {
    const response = await api.get("/applications");
    return response.data;
  },
};

export default ticketApi;
