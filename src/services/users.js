// src/services/users.js
import api from "./api";

export const listUsers   = () => api.get("/utilisateurs");
export const createUser  = (payload) => api.post("/utilisateurs", payload);
export const updateUser  = (id, payload) => api.put(`/utilisateurs/${id}`, payload);
export const deleteUser  = (id) => api.delete(`/utilisateurs/${id}`);
