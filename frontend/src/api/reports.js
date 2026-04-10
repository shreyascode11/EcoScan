import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// GET all reports for the map
export async function fetchReports() {
  const { data } = await API.get('/reports');
  return data;
}

// POST a new report
export async function createReport({ lat, lng, severity, desc, imageData }) {
  const { data } = await API.post('/reports', {
    lat,
    lng,
    severity,
    desc,
    image_data: imageData || null,
  });
  return data;
}

// PATCH claim a report for cleanup
export async function claimReport(reportId) {
  const { data } = await API.patch(`/reports/${reportId}/claim`);
  return data;
}

// GET dashboard stats
export async function fetchStats() {
  const { data } = await API.get('/stats');
  return data;
}
