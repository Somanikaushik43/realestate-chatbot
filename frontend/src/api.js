import axios from "axios";

// Base URL for backend
const API = "https://realestate-chatbot-bual.onrender.com/api";


// ------------------------------
// QUERY AREA
// ------------------------------
export async function queryArea(area) {
  const res = await axios.get(`${API}/query/`, {
    params: { area }
  });
  return res.data; // return proper JSON object
}

// ------------------------------
// UPLOAD FILE
// ------------------------------
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${API}/upload/`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return res.data;
}

// ------------------------------
// DOWNLOAD CSV
// ------------------------------
export async function downloadCSV(area) {
  const res = await axios.get(`${API}/download/`, {
    params: { area },
    responseType: "blob"
  });

  return res.data;
}
