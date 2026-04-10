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
export async function createReport({ lat, lng, severity, desc, imageData, reporter_name }) {
  const { data } = await API.post('/reports', {
    lat,
    lng,
    severity,
    desc,
    image_data: imageData || null,
    reporter_name: reporter_name || 'Anonymous'
  });
  return data;
}

// PATCH claim a report for cleanup
export async function claimReport(reportId, volunteerName) {
  const { data } = await API.patch(`/reports/${reportId}/claim`, {
    volunteer_name: volunteerName
  });
  return data;
}

// PATCH submit cleanup proof (marks as cleaned)
export async function submitCleanup(reportId, afterImageData) {
  const { data } = await API.patch(`/reports/${reportId}/clean`, {
    after_image_data: afterImageData
  });
  return data;
}

// GET dashboard stats
export async function fetchStats() {
  const { data } = await API.get('/stats');
  return data;
}

// GET leaderboard
export async function fetchLeaderboard() {
  const { data } = await API.get('/leaderboard');
  return data;
}
