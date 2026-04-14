export const ts = () => new Date().toLocaleTimeString();

export const rand = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const generateReading = () => ({
  temperature: rand(20, 60),
  humidity: rand(30, 100),
  time: ts()
});

export const detectAlerts = (reading) => {
  const alerts = [];
  if (reading.temperature > 50) alerts.push("High Temperature");
  if (reading.humidity > 90) alerts.push("Flood Risk");
  return alerts;
};

export const saveProfile = (profile) => {
  localStorage.setItem("profile", JSON.stringify(profile));
};

export const loadProfile = () => {
  const data = localStorage.getItem("profile");
  return data ? JSON.parse(data) : null;
};
