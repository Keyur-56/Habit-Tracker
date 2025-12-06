import axios from 'axios';

const API_URL = 'http://localhost:5000/api/habits';

export const getHabits = () => axios.get(API_URL);
export const createHabit = (habit) => axios.post(API_URL, habit);
export const updateHabit = (id, habit) => axios.put(`${API_URL}/${id}`, habit);
export const deleteHabit = (id) => axios.delete(`${API_URL}/${id}`);