🛡️ DisasterMS — Fog–Edge Disaster Response Framework
A real-time disaster monitoring and response system with IoT simulation, edge-fog-cloud decision-making, and latency-aware intelligent routing.
---
🔐 Login Credentials
Name	Email	Password	Role
Dr. Rajesh Kumar	admin@disasterms.io	admin123	Admin
IPS Priya Sharma	authority@disasterms.io	auth123	Emergency Authority
Public User	viewer@disasterms.io	view123	Public Viewer
---
🚀 Modules
IoT Acquisition — Temperature, smoke, water level, seismic sensors (simulated every 2s)
Latency Monitor — Edge (<15ms) / Fog (15–50ms) / Cloud (>50ms) routing
Edge Processing — Anomaly detection, threshold-based alerts
Fog Coordination — Regional aggregation across 4 sensor nodes
Priority Offloading — High→Edge / Medium→Fog / Low→Cloud
Alert & Notification — Severity badges, alert history, toast notifications
Dashboard & Visualization — Recharts area/line/bar charts, SVG map
---
🎮 Simulation Buttons
Click 🔥 Fire, 🌊 Flood, or 🌍 Quake in the top bar to inject simulated disaster events.
---
💻 Run Locally
```bash
npm install
npm start
```
Open http://localhost:3000
---
🌐 Deploy to Vercel
See the deployment guide below or visit vercel.com
