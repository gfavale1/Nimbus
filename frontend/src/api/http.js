import axios from "axios";

const baseURL = "https://nimbus-app-ashhgbbrdvhjdgh6.italynorth-01.azurewebsites.net/api";

const http = axios.create({
  baseURL,
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  // Recuperiamo i dati salvati nell'AuthContext
  const userId = localStorage.getItem("nimbus_user_id");
  const userEmail = localStorage.getItem("nimbus_user_email");
  const userName = localStorage.getItem("nimbus_user_name");

  if (userId) {
    config.headers["x-nimbus-userid"] = userId;
    config.headers["x-nimbus-email"] = userEmail;
    config.headers["x-nimbus-username"] = userName;
  }
  return config;
});

export default http;