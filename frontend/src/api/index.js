import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000", // Node.js 백엔드 주소
  withCredentials: true,
});

export default API;
