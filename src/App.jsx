/* eslint-disable */
import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, onAuthStateChanged } from "firebase/auth";
import emailjs from "@emailjs/browser";

// Firebase + EmailJS config
const firebaseApp = initializeApp({
  apiKey: "AIzaSyBaxraXzc_tdgQSu-uCEiRV3U8tKGBTTFM",
  authDomain: "disaster-response-system-6ae82.firebaseapp.com",
  projectId: "disaster-response-system-6ae82",
  storageBucket: "disaster-response-system-6ae82.firebasestorage.app",
  messagingSenderId: "655327195433",
  appId: "1:655327195433:web:6d79cbeee4ee215b660738",
});
const auth = getAuth(firebaseApp);
const EJ_SVC = "service_m61oedi";
const EJ_TPL = "zgzxxpy";
const EJ_KEY = "HYo2Qm6SBeS60_i2_";
emailjs.init(EJ_KEY);

// India states and cities
const INDIA = {
  "Andhra Pradesh": ["Visakhapatnam","Vijayawada","Guntur","Tirupati","Kurnool","Nellore"],
  "Assam": ["Guwahati","Dibrugarh","Silchar","Jorhat","Tezpur"],
  "Bihar": ["Patna","Gaya","Bhagalpur","Muzaffarpur","Darbhanga"],
  "Chhattisgarh": ["Raipur","Bilaspur","Durg","Bhilai","Korba"],
  "Delhi": ["New Delhi","Dwarka","Rohini","Saket","Noida","Gurugram"],
  "Goa": ["Panaji","Margao","Vasco da Gama","Mapusa"],
  "Gujarat": ["Ahmedabad","Surat","Vadodara","Rajkot","Gandhinagar","Bhavnagar"],
  "Haryana": ["Gurugram","Faridabad","Hisar","Ambala","Karnal","Panipat"],
  "Himachal Pradesh": ["Shimla","Manali","Dharamshala","Kullu","Solan"],
  "Jammu & Kashmir": ["Srinagar","Jammu","Leh","Anantnag","Baramulla"],
  "Jharkhand": ["Ranchi","Jamshedpur","Dhanbad","Bokaro","Hazaribagh"],
  "Karnataka": ["Bengaluru","Mysuru","Hubli","Mangaluru","Belagavi","Tumkur"],
  "Kerala": ["Thiruvananthapuram","Kochi","Kozhikode","Thrissur","Kannur","Kollam"],
  "Madhya Pradesh": ["Bhopal","Indore","Jabalpur","Gwalior","Ujjain","Sagar"],
  "Maharashtra": ["Mumbai","Pune","Nagpur","Nashik","Aurangabad","Thane","Solapur"],
  "Manipur": ["Imphal","Thoubal","Bishnupur","Churachandpur"],
  "Meghalaya": ["Shillong","Tura","Jowai"],
  "Mizoram": ["Aizawl","Lunglei","Champhai"],
  "Nagaland": ["Kohima","Dimapur","Mokokchung"],
  "Odisha": ["Bhubaneswar","Cuttack","Rourkela","Puri","Sambalpur","Berhampur"],
  "Punjab": ["Amritsar","Ludhiana","Jalandhar","Patiala","Chandigarh","Mohali"],
  "Rajasthan": ["Jaipur","Jodhpur","Udaipur","Kota","Ajmer","Jaisalmer","Bikaner"],
  "Sikkim": ["Gangtok","Namchi","Mangan"],
  "Tamil Nadu": ["Chennai","Coimbatore","Madurai","Salem","Trichy","Tirunelveli","Vellore","Erode"],
  "Telangana": ["Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam"],
  "Tripura": ["Agartala","Udaipur","Dharmanagar"],
  "Uttar Pradesh": ["Lucknow","Kanpur","Agra","Varanasi","Allahabad","Meerut","Noida","Ghaziabad"],
  "Uttarakhand": ["Dehradun","Haridwar","Rishikesh","Nainital","Mussoorie","Roorkee"],
  "West Bengal": ["Kolkata","Howrah","Siliguri","Asansol","Darjeeling","Durgapur"],
};

// Profile helpers (localStorage)
const saveProfile = (uid, data) => localStorage.setItem(`dms_${uid}`, JSON.stringify(data));
const loadProfile = (uid) => { try { return JSON.parse(localStorage.getItem(`dms_${uid}`)) || {}; } catch { return {}; } };

// ─── CONSTANTS & CONFIG ────────────────────────────────────────────────────
const THRESHOLDS = {
  temperature: { warning: 45, critical: 60 },
  smoke: { warning: 300, critical: 500 },
  waterLevel: { warning: 65, critical: 85 },
  seismic: { warning: 3.5, critical: 5.5 },
};
const LATENCY_THRESHOLDS = { edge: 15, fog: 50 };
const SENSOR_NODES = [
  { id: "N001", name: "Node Alpha", region: "North" },
  { id: "N002", name: "Node Beta", region: "South" },
  { id: "N003", name: "Node Gamma", region: "East" },
  { id: "N004", name: "Node Delta", region: "West" },
];
const USERS = [
  { id: 1, email: "admin@disasterms.io", password: "admin123", role: "Admin", name: "Dr. Rajesh Kumar" },
  { id: 2, email: "authority@disasterms.io", password: "auth123", role: "Emergency Authority", name: "IPS Priya Sharma" },
  { id: 3, email: "viewer@disasterms.io", password: "view123", role: "Public Viewer", name: "Public User" },
];

// ─── UTILS ─────────────────────────────────────────────────────────────────
const rand = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const ts = () => new Date().toLocaleTimeString();
const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();

function generateReading(nodeId, forceEvent = null) {
  let d = {
    nodeId, t: ts(),
    temperature: rand(22, 38), smoke: rand(50, 150),
    waterLevel: rand(20, 45), seismic: rand(0.1, 1.8),
    networkDelay: rand(2, 60), processingDelay: rand(1, 20),
  };
  if (forceEvent === "fire") { d.temperature = rand(62, 95); d.smoke = rand(520, 800); }
  else if (forceEvent === "flood") { d.waterLevel = rand(88, 100); }
  else if (forceEvent === "earthquake") { d.seismic = rand(5.8, 8.5); }
  return d;
}

function latencyTier(nd, pd) {
  const t = nd + pd;
  if (t < LATENCY_THRESHOLDS.edge) return { tier: "Edge", color: "#22c55e", latency: t };
  if (t < LATENCY_THRESHOLDS.fog) return { tier: "Fog", color: "#f59e0b", latency: t };
  return { tier: "Cloud", color: "#ef4444", latency: t };
}

function detectAlerts(r) {
  const out = [];
  const check = (type, sensor, val, warnT, critT) => {
    if (val >= critT) out.push({ id: uid(), type, severity: "Critical", sensor, value: val, nodeId: r.nodeId, time: ts() });
    else if (val >= warnT) out.push({ id: uid(), type, severity: "Medium", sensor, value: val, nodeId: r.nodeId, time: ts() });
  };
  check("Fire", "temperature", r.temperature, THRESHOLDS.temperature.warning, THRESHOLDS.temperature.critical);
  check("Fire", "smoke", r.smoke, THRESHOLDS.smoke.warning, THRESHOLDS.smoke.critical);
  check("Flood", "waterLevel", r.waterLevel, THRESHOLDS.waterLevel.warning, THRESHOLDS.waterLevel.critical);
  check("Earthquake", "seismic", r.seismic, THRESHOLDS.seismic.warning, THRESHOLDS.seismic.critical);
  return out;
}

// ─── STYLES ────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Exo+2:wght@300;400;600;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#050a12;--bg2:#0a1422;--bg3:#0f1e2f;--bg4:#162436;
  --bdr:#1e3a5f;--bdr2:#243f60;
  --ac:#00c8ff;--ac2:#0077cc;
  --am:#f59e0b;--rd:#ef4444;--gn:#22c55e;
  --tx:#c8e6ff;--tx2:#7bafd4;--tx3:#4a7899;
}
body{background:var(--bg);color:var(--tx);font-family:'Exo 2',sans-serif;overflow-x:hidden}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:var(--bg2)}
::-webkit-scrollbar-thumb{background:var(--bdr2);border-radius:3px}

/* ── APP SHELL ── */
.app{display:flex;min-height:100vh}
.sidebar{
  width:236px;min-height:100vh;background:var(--bg2);border-right:1px solid var(--bdr);
  display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:100
}
.sb-logo{padding:18px 14px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;gap:10px}
.sb-icon{width:34px;height:34px;background:linear-gradient(135deg,#ef4444,#f59e0b);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
.sb-txt{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;line-height:1.2}
.sb-txt span{color:var(--ac);font-size:10px;font-weight:400;display:block}
.nav{flex:1;padding:10px 7px;overflow-y:auto}
.nav-sec{margin-bottom:18px}
.nav-lbl{font-size:9px;font-weight:600;letter-spacing:2px;color:var(--tx3);padding:0 7px;margin-bottom:5px;text-transform:uppercase}
.nav-item{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:6px;cursor:pointer;transition:all .2s;font-size:12.5px;font-weight:500;color:var(--tx2);margin-bottom:1px;border:1px solid transparent}
.nav-item:hover{background:var(--bg3);color:var(--tx)}
.nav-item.active{background:rgba(0,200,255,.1);color:var(--ac);border-color:rgba(0,200,255,.2)}
.nav-item .ic{font-size:14px;width:17px;text-align:center;flex-shrink:0}
.nav-bdg{margin-left:auto;background:var(--rd);color:#fff;font-size:10px;font-weight:700;padding:1px 5px;border-radius:10px;font-family:'Space Mono',monospace}
.sb-foot{padding:10px 7px;border-top:1px solid var(--bdr)}
.uc{display:flex;align-items:center;gap:7px;padding:7px 9px;border-radius:6px;background:var(--bg3)}
.ua{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--ac2),var(--ac));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.ui{flex:1;min-width:0}
.un{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ur{font-size:10px;color:var(--tx3)}
.lob{background:none;border:none;color:var(--tx3);cursor:pointer;font-size:14px;padding:3px;transition:color .2s}
.lob:hover{color:var(--rd)}

/* ── MAIN ── */
.main{flex:1;margin-left:236px;display:flex;flex-direction:column;min-height:100vh}
.topbar{height:54px;background:var(--bg2);border-bottom:1px solid var(--bdr);display:flex;align-items:center;padding:0 20px;gap:12px;position:sticky;top:0;z-index:50}
.tb-title{font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;flex:1}
.tb-title span{color:var(--tx3);font-size:12px;font-weight:400;margin-left:7px;font-family:'Exo 2',sans-serif}
.sdot{width:8px;height:8px;border-radius:50%;background:var(--gn);box-shadow:0 0 6px var(--gn);animation:pd 2s infinite}
.sdot.red{background:var(--rd);box-shadow:0 0 6px var(--rd)}
.sdot.am{background:var(--am);box-shadow:0 0 6px var(--am)}
@keyframes pd{0%,100%{opacity:1}50%{opacity:.4}}
.ttime{font-family:'Space Mono',monospace;font-size:11px;color:var(--tx2)}
.sbtns{display:flex;gap:5px}
.sbtn{padding:4px 9px;border-radius:5px;border:1px solid;font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Rajdhani',sans-serif}
.sbtn.fi{border-color:#ef4444;color:#ef4444;background:rgba(239,68,68,.1)}.sbtn.fi:hover{background:rgba(239,68,68,.25)}
.sbtn.fl{border-color:#3b82f6;color:#3b82f6;background:rgba(59,130,246,.1)}.sbtn.fl:hover{background:rgba(59,130,246,.25)}
.sbtn.eq{border-color:#f59e0b;color:#f59e0b;background:rgba(245,158,11,.1)}.sbtn.eq:hover{background:rgba(245,158,11,.25)}
.content{flex:1;padding:18px 22px;overflow-y:auto}

/* ── CARD ── */
.card{background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:15px;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--ac),transparent);opacity:.25}
.ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}
.ct{font-family:'Rajdhani',sans-serif;font-size:12.5px;font-weight:700;letter-spacing:1px;color:var(--tx2);text-transform:uppercase}
.mb{margin-bottom:13px}

/* ── METRICS ── */
.mg{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:18px}
.mc{background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:15px;position:relative;overflow:hidden;transition:border-color .3s}
.mc:hover{border-color:var(--bdr2)}
.mc .bic{position:absolute;right:10px;bottom:6px;font-size:44px;opacity:.05}
.ml{font-size:9.5px;font-weight:600;letter-spacing:1.5px;color:var(--tx3);text-transform:uppercase;margin-bottom:5px}
.mv{font-family:'Space Mono',monospace;font-size:26px;font-weight:700;line-height:1}
.mv.gn{color:var(--gn)}.mv.am{color:var(--am)}.mv.rd{color:var(--rd)}.mv.bl{color:var(--ac)}
.ms{font-size:10px;color:var(--tx3);margin-top:4px}

/* ── GRIDS ── */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:13px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px}
.g75{display:grid;grid-template-columns:7fr 5fr;gap:13px}

/* ── ALERTS ── */
.ali{display:flex;align-items:flex-start;gap:9px;padding:9px 11px;border-radius:7px;margin-bottom:7px;border:1px solid;animation:si .3s ease}
@keyframes si{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
.ali.critical{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.28)}
.ali.medium{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.28)}
.ali.low{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.18)}
.ad{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:4px}
.ad.critical{background:var(--rd);box-shadow:0 0 5px var(--rd)}.ad.medium{background:var(--am)}.ad.low{background:var(--gn)}
.at{font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700}
.adl{font-size:11px;color:var(--tx2);margin-top:1px}
.atm{font-family:'Space Mono',monospace;font-size:10px;color:var(--tx3);margin-left:auto;flex-shrink:0}
.sv{display:inline-block;font-size:9px;font-weight:700;padding:2px 5px;border-radius:3px;letter-spacing:1px;margin-left:5px}
.sv.critical{background:rgba(239,68,68,.25);color:#ff6b6b}.sv.medium{background:rgba(245,158,11,.25);color:#fbbf24}.sv.low{background:rgba(34,197,94,.2);color:#4ade80}

/* ── LATENCY ── */
.tdisp{display:flex;align-items:center;gap:7px;padding:7px 11px;border-radius:6px;background:var(--bg4);border:1px solid var(--bdr);margin-bottom:7px}
.tdot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.tn{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px}
.tv{font-family:'Space Mono',monospace;font-size:11px;color:var(--tx2);margin-left:auto}
.pipe{display:flex;align-items:center;gap:3px;flex-wrap:wrap}
.pn{padding:4px 9px;border-radius:5px;font-size:11px;font-weight:600;font-family:'Rajdhani',sans-serif;letter-spacing:.5px;border:1px solid;transition:all .3s}
.pn.active{opacity:1}.pn.inactive{opacity:.25}
.pn.edge{background:rgba(34,197,94,.15);border-color:rgba(34,197,94,.4);color:#4ade80}
.pn.fog{background:rgba(245,158,11,.15);border-color:rgba(245,158,11,.4);color:#fbbf24}
.pn.cloud{background:rgba(99,102,241,.15);border-color:rgba(99,102,241,.4);color:#a5b4fc}
.par{color:var(--tx3);font-size:11px}

/* ── MAP ── */
.mapbox{width:100%;height:272px;background:var(--bg4);border-radius:8px;position:relative;overflow:hidden;border:1px solid var(--bdr)}
.mgrid{position:absolute;inset:0;background-image:linear-gradient(var(--bdr) 1px,transparent 1px),linear-gradient(90deg,var(--bdr) 1px,transparent 1px);background-size:38px 38px;opacity:.25}
.mpin{position:absolute;cursor:pointer;transform:translate(-50%,-50%)}
.pinc{width:13px;height:13px;border-radius:50%;border:2px solid rgba(255,255,255,.7);position:relative}
.pinp{position:absolute;inset:-5px;border-radius:50%;border:2px solid;animation:pr 2s infinite}
@keyframes pr{0%{transform:scale(.8);opacity:1}100%{transform:scale(1.9);opacity:0}}
.pinl{position:absolute;top:17px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:8.5px;font-family:'Space Mono',monospace;background:rgba(5,10,18,.9);padding:1px 4px;border-radius:3px}
.dmk{position:absolute;transform:translate(-50%,-50%);font-size:18px;animation:mb 1s infinite;z-index:10}
@keyframes mb{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-60%) scale(1.2)}}
.mleg{position:absolute;bottom:8px;right:8px;background:rgba(5,10,18,.9);border:1px solid var(--bdr);border-radius:6px;padding:7px 9px}
.lgi{display:flex;align-items:center;gap:5px;font-size:9.5px;color:var(--tx2);margin-bottom:2px}
.lgd{width:7px;height:7px;border-radius:50%;flex-shrink:0}

/* ── SENSOR BARS ── */
.srow{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--bdr)}
.srow:last-child{border-bottom:none}
.snm{font-size:11px;color:var(--tx2);width:95px;flex-shrink:0}
.sbw{flex:1;height:5px;background:var(--bg4);border-radius:3px;overflow:hidden}
.sbar{height:100%;border-radius:3px;transition:width .5s}
.srd{font-family:'Space Mono',monospace;font-size:11px;width:68px;text-align:right;flex-shrink:0}
.sst{width:58px;text-align:right;font-size:10px;font-weight:600;flex-shrink:0}

/* ── TABLE ── */
.dt{width:100%;border-collapse:collapse}
.dt th{font-size:9.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--tx3);padding:7px 11px;border-bottom:1px solid var(--bdr);text-align:left}
.dt td{padding:8px 11px;border-bottom:1px solid rgba(30,58,95,.45);font-size:11.5px}
.dt tr:last-child td{border-bottom:none}
.dt tr:hover td{background:var(--bg4)}
.mono{font-family:'Space Mono',monospace;font-size:11px}

/* ── LOGS ── */
.logi{display:flex;gap:9px;padding:4px 0;border-bottom:1px solid rgba(30,58,95,.25);font-size:10.5px}
.logt{font-family:'Space Mono',monospace;color:var(--tx3);flex-shrink:0;width:72px}
.logl{flex-shrink:0;width:42px;font-weight:700;font-size:10px}
.logl.INFO{color:var(--ac)}.logl.WARN{color:var(--am)}.logl.CRIT{color:var(--rd)}.logl.OK{color:var(--gn)}
.logm{color:var(--tx2)}

/* ── NODE CARDS ── */
.nc{background:var(--bg4);border:1px solid var(--bdr);border-radius:8px;padding:12px}
.nh{display:flex;align-items:center;gap:7px;margin-bottom:9px}
.nid{font-family:'Space Mono',monospace;font-size:10.5px;color:var(--tx3)}
.nnm{font-family:'Rajdhani',sans-serif;font-size:13.5px;font-weight:700}
.nrg{font-size:9.5px;color:var(--tx3);margin-left:auto}
.rg{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.ri{background:var(--bg2);border-radius:5px;padding:6px 9px}
.rl{font-size:9px;color:var(--tx3);text-transform:uppercase;letter-spacing:1px}
.rv{font-family:'Space Mono',monospace;font-size:13px;font-weight:700;margin-top:1px}

/* ── TABS ── */
.tabs{display:flex;gap:2px;background:var(--bg4);border-radius:8px;padding:3px;margin-bottom:15px;border:1px solid var(--bdr)}
.tab{flex:1;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;text-align:center;border:none;background:none;color:var(--tx3);font-family:'Rajdhani',sans-serif;letter-spacing:.5px}
.tab.active{background:var(--bg3);color:var(--ac);box-shadow:0 1px 4px rgba(0,0,0,.3);border:1px solid var(--bdr)}
.tab:hover:not(.active){color:var(--tx)}

/* ── OFFLINE ── */
.ofb{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);border-radius:8px;padding:9px 13px;display:flex;align-items:center;gap:9px;margin-bottom:13px}
.oft{font-size:12px;font-weight:600;color:#ff6b6b}

/* ── PRIORITY ── */
.pflow{display:flex;flex-direction:column;gap:7px}
.pi{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:7px;border:1px solid}
.pi.high{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.28)}
.pi.medium{background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.28)}
.pi.low{background:rgba(99,102,241,.08);border-color:rgba(99,102,241,.28)}
.plbl{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;width:58px}
.plbl.high{color:#ff6b6b}.plbl.medium{color:#fbbf24}.plbl.low{color:#a5b4fc}
.pdst{font-size:11px;color:var(--tx2)}
.pdst strong{color:var(--tx)}

/* ── LOGIN ── */
.lsc{display:flex;min-height:100vh;align-items:center;justify-content:center;background:var(--bg);position:relative;overflow:hidden}
.lbg{position:absolute;inset:0;background:radial-gradient(ellipse at 20% 80%,rgba(0,119,204,.15) 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,rgba(239,68,68,.1) 0%,transparent 50%)}
.lgr{position:absolute;inset:0;background-image:linear-gradient(var(--bdr) 1px,transparent 1px),linear-gradient(90deg,var(--bdr) 1px,transparent 1px);background-size:58px 58px;opacity:.13}
.lbx{background:var(--bg2);border:1px solid var(--bdr);border-radius:16px;padding:34px 30px;width:410px;position:relative;z-index:1}
.llo{text-align:center;margin-bottom:22px}
.lli{width:54px;height:54px;background:linear-gradient(135deg,#ef4444,#f59e0b);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 9px}
.lt{font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700}
.ls{font-size:11px;color:var(--tx3);margin-top:3px}
.fg{margin-bottom:15px}
.fl{font-size:11px;font-weight:600;color:var(--tx2);letter-spacing:.5px;margin-bottom:5px;display:block}
.fi2{width:100%;background:var(--bg3);border:1px solid var(--bdr);border-radius:7px;padding:9px 12px;color:var(--tx);font-size:12.5px;font-family:'Exo 2',sans-serif;outline:none;transition:border-color .2s}
.fi2:focus{border-color:var(--ac2)}
.fi2::placeholder{color:var(--tx3)}
.lbtn{width:100%;background:linear-gradient(135deg,var(--ac2),var(--ac));border:none;border-radius:7px;padding:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:'Rajdhani',sans-serif;letter-spacing:1px;transition:opacity .2s;margin-top:5px}
.lbtn:hover{opacity:.9}
.lerr{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.28);border-radius:6px;padding:7px 11px;font-size:12px;color:#ff6b6b;margin-bottom:13px}
.ql{margin-top:18px;border-top:1px solid var(--bdr);padding-top:14px}
.qtl{font-size:10.5px;color:var(--tx3);text-align:center;margin-bottom:9px}
.qbs{display:flex;flex-direction:column;gap:5px}
.qb{background:var(--bg3);border:1px solid var(--bdr);border-radius:6px;padding:7px 11px;cursor:pointer;transition:all .2s;display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--tx2)}
.qb:hover{border-color:var(--ac2);color:var(--tx)}
.qr{font-size:10px;background:rgba(0,200,255,.13);color:var(--ac);padding:2px 6px;border-radius:4px;font-weight:600}

/* ── USER TABLE ── */
.utr{display:flex;align-items:center;gap:9px;padding:9px 11px;border-bottom:1px solid var(--bdr)}
.utr:last-child{border-bottom:none}
.rbdg{font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px}
.rbdg.Admin{background:rgba(99,102,241,.2);color:#a5b4fc}

/* ── ANIMATIONS ── */
@keyframes fi{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.fade{animation:fi .35s ease}

/* ── RESPONSIVE ── */
@media(max-width:1024px){.mg{grid-template-columns:repeat(2,1fr)}.g2,.g3,.g75{grid-template-columns:1fr}}
@media(max-width:768px){.sidebar{transform:translateX(-100%)}.main{margin-left:0}.mg{grid-template-columns:1fr 1fr}}

input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;background:var(--bdr);outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:var(--ac);cursor:pointer}
select.fi2{cursor:pointer}
option{background:var(--bg2)}

/* ── REGISTER ── */
.rbx{background:var(--bg2);border:1px solid var(--bdr);border-radius:16px;padding:28px 26px;width:500px;position:relative;z-index:1;max-height:92vh;overflow-y:auto}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.lsuc{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.28);border-radius:6px;padding:7px 11px;font-size:12px;color:#4ade80;margin-bottom:13px}
.lswitch{text-align:center;margin-top:14px;font-size:12px;color:var(--tx3)}
.lswitch span{color:var(--ac);cursor:pointer;font-weight:600}
.lswitch span:hover{text-decoration:underline}
.role-sel{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:5px}
.role-opt{padding:9px 7px;border-radius:7px;border:1px solid var(--bdr);cursor:pointer;transition:all .2s;text-align:center;background:var(--bg3)}
.role-opt .ri2{font-size:18px;margin-bottom:3px}
.role-opt .rl2{font-size:10.5px;font-weight:600;color:var(--tx3)}
.role-opt.selected{border-color:var(--ac);background:rgba(0,200,255,.08)}
.role-opt.selected .rl2{color:var(--ac)}
.loc-btns{display:flex;gap:7px;margin-top:5px}
.loc-btn{flex:1;padding:8px 10px;border-radius:7px;border:1px solid var(--bdr);background:var(--bg3);color:var(--tx2);font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Rajdhani',sans-serif;letter-spacing:.5px}
.loc-btn:hover{border-color:var(--ac2);color:var(--ac)}
.loc-btn.active{border-color:var(--ac);color:var(--ac);background:rgba(0,200,255,.1)}
.loc-info{background:var(--bg4);border:1px solid rgba(34,197,94,.3);border-radius:6px;padding:7px 11px;font-size:11px;color:var(--gn);margin-top:7px;font-family:'Space Mono',monospace}
.toast{position:fixed;top:16px;right:16px;background:var(--bg2);border:1px solid var(--gn);border-radius:9px;padding:11px 16px;z-index:9999;font-size:12px;color:var(--gn);max-width:300px;animation:si .3s ease;box-shadow:0 4px 24px rgba(0,0,0,.5)}
.toast.warn{border-color:var(--rd);color:var(--rd)}
.lbtn:disabled{opacity:.5;cursor:not-allowed}

`;
// ─── SMALL COMPONENTS ──────────────────────────────────────────────────────

function Metric({ label, value, unit, color, icon, sub }) {
  return (
    <div className="mc">
      <div className="bic">{icon}</div>
      <div className="ml">{label}</div>
      <div className={`mv ${color}`}>{value}<span style={{ fontSize: 13, marginLeft: 3, opacity: .65 }}>{unit}</span></div>
      {sub && <div className="ms">{sub}</div>}
    </div>
  );
}

function AlertRow({ a }) {
  const sv = (a.severity || "low").toLowerCase();
  const em = a.type === "Fire" ? "🔥" : a.type === "Flood" ? "🌊" : "🌍";
  return (
    <div className={`ali ${sv}`}>
      <div className={`ad ${sv}`} />
      <div style={{ flex: 1 }}>
        <div className="at">{em} {a.type}<span className={`sv ${sv}`}>{a.severity}</span></div>
        <div className="adl">Node {a.nodeId} · {a.sensor} = {typeof a.value === "number" ? a.value.toFixed(2) : a.value} · {a.tier || "Edge"}</div>
      </div>
      <div className="atm">{a.time}</div>
    </div>
  );
}

function SBar({ label, value, max, unit, color }) {
  const p = Math.min((value / max) * 100, 100);
  const st = p > 80 ? "CRITICAL" : p > 60 ? "WARNING" : "NORMAL";
  const sc = p > 80 ? "#ef4444" : p > 60 ? "#f59e0b" : "#22c55e";
  return (
    <div className="srow">
      <div className="snm">{label}</div>
      <div className="sbw"><div className="sbar" style={{ width: `${p}%`, background: color }} /></div>
      <div className="srd" style={{ color }}>{value.toFixed(1)}{unit}</div>
      <div className="sst" style={{ color: sc }}>{st}</div>
    </div>
  );
}

function Logs({ logs }) {
  const r = useRef(null);
  useEffect(() => { if (r.current) r.current.scrollTop = r.current.scrollHeight; }, [logs]);
  return (
    <div ref={r} style={{ maxHeight: 190, overflowY: "auto" }}>
      {logs.map((l, i) => (
        <div key={i} className="logi">
          <span className="logt">{l.time}</span>
          <span className={`logl ${l.level}`}>{l.level}</span>
          <span className="logm">{l.msg}</span>
        </div>
      ))}
    </div>
  );
}

function Pipeline({ tier }) {
  return (
    <div className="pipe">
      <div className={`pn edge ${tier === "Edge" ? "active" : "inactive"}`}>⚡ EDGE</div>
      <div className="par">→</div>
      <div className={`pn fog ${tier === "Fog" ? "active" : "inactive"}`}>🌫️ FOG</div>
      <div className="par">→</div>
      <div className={`pn cloud ${tier === "Cloud" ? "active" : "inactive"}`}>☁️ CLOUD</div>
    </div>
  );
}

function Map({ latestMap, activeAlerts }) {
  const positions = { N001: { x: "32%", y: "24%" }, N002: { x: "56%", y: "70%" }, N003: { x: "70%", y: "36%" }, N004: { x: "20%", y: "57%" } };
  const nodeColor = {};
  Object.entries(latestMap).forEach(([id, r]) => {
    const a = detectAlerts(r);
    nodeColor[id] = a.some(x => x.severity === "Critical") ? "#ef4444" : a.some(x => x.severity === "Medium") ? "#f59e0b" : "#22c55e";
  });
  const dpos = { Fire: { x: "34%", y: "27%", e: "🔥" }, Flood: { x: "58%", y: "66%", e: "🌊" }, Earthquake: { x: "68%", y: "40%", e: "🌍" } };
  const types = [...new Set(activeAlerts.filter(a => a.severity === "Critical").map(a => a.type))];
  return (
    <div className="mapbox">
      <div className="mgrid" />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .08 }}>
        <path d="M70 155 Q195 78 315 115 Q415 58 500 98 Q558 76 598 116" stroke="#00c8ff" strokeWidth="1.5" fill="none" />
        <path d="M55 200 Q175 178 298 196 Q378 207 448 187 Q518 167 576 196" stroke="#0077cc" strokeWidth="1" fill="none" />
      </svg>
      {SENSOR_NODES.map(n => {
        const c = nodeColor[n.id] || "#22c55e";
        const p = positions[n.id];
        return (
          <div key={n.id} className="mpin" style={{ left: p.x, top: p.y }}>
            <div className="pinc" style={{ background: c }}>
              <div className="pinp" style={{ borderColor: c }} />
            </div>
            <div className="pinl" style={{ color: c }}>{n.id}</div>
          </div>
        );
      })}
      {types.map(t => {
        const dp = dpos[t];
        return dp ? <div key={t} className="dmk" style={{ left: dp.x, top: dp.y }}>{dp.e}</div> : null;
      })}
      <div className="mleg">
        {[["#22c55e", "Normal"], ["#f59e0b", "Warning"], ["#ef4444", "Critical"]].map(([c, l]) => (
          <div key={l} className="lgi"><div className="lgd" style={{ background: c }} /> {l}</div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 9, left: 9, fontSize: 9.5, color: "var(--tx3)", fontFamily: "Space Mono, monospace" }}>
        REGION: India · {SENSOR_NODES.length} Nodes
      </div>
    </div>
  );
}

// ─── PAGES ─────────────────────────────────────────────────────────────────

function DashboardPage({ sensorReadings, alerts, latencyHistory, systemLogs, cloudOffline }) {
  const latest = {};
  sensorReadings.forEach(r => { latest[r.nodeId] = r; });
  const vals = Object.values(latest);
  const critCount = alerts.filter(a => a.severity === "Critical").length;
  const avgTemp = vals.length ? (vals.reduce((s, r) => s + r.temperature, 0) / vals.length).toFixed(1) : "—";
  const lh = latencyHistory[latencyHistory.length - 1] || {};
  const lt = latencyTier(lh.network || 5, lh.processing || 3);

  return (
    <div className="fade">
      {cloudOffline && (
        <div className="ofb">
          <span style={{ fontSize: 17 }}>⚠️</span>
          <div>
            <div className="oft">CLOUD OFFLINE — Edge Fallback Active</div>
            <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 2 }}>Critical ops routing through edge nodes. Local anomaly detection engaged.</div>
          </div>
        </div>
      )}
      <div className="mg">
        <Metric label="Active Alerts" value={alerts.slice(0, 20).length} color={alerts.length > 5 ? "rd" : "am"} icon="🚨" sub={`${critCount} critical`} />
        <Metric label="Avg Temperature" value={avgTemp} unit="°C" color={+avgTemp > 45 ? "rd" : "gn"} icon="🌡️" sub="All nodes" />
        <Metric label="Latency" value={lt.latency.toFixed(1)} unit="ms" color={lt.tier === "Edge" ? "gn" : lt.tier === "Fog" ? "am" : "rd"} icon="⚡" sub={`Tier: ${lt.tier}`} />
        <Metric label="Sensor Nodes" value={SENSOR_NODES.length} color="bl" icon="📡" sub={cloudOffline ? "Cloud offline" : "All connected"} />
      </div>

      <div className="g75 mb">
        <div className="card">
          <div className="ch"><div className="ct">📊 Sensor Readings — Live</div><span style={{ fontSize: 9.5, color: "var(--tx3)", fontFamily: "Space Mono, monospace" }}>{ts()}</span></div>
          <ResponsiveContainer width="100%" height={195}>
            <AreaChart data={sensorReadings.slice(-30)}>
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="t" tick={{ fontSize: 8.5, fill: "#4a7899" }} />
              <YAxis tick={{ fontSize: 8.5, fill: "#4a7899" }} />
              <Tooltip contentStyle={{ background: "#0a1422", border: "1px solid #1e3a5f", fontSize: 10.5 }} />
              <Legend wrapperStyle={{ fontSize: 10.5 }} />
              <Area type="monotone" dataKey="temperature" stroke="#ef4444" fill="url(#tg)" strokeWidth={1.5} dot={false} name="Temp (°C)" />
              <Area type="monotone" dataKey="waterLevel" stroke="#3b82f6" fill="url(#wg)" strokeWidth={1.5} dot={false} name="Water (%)" />
              <Line type="monotone" dataKey="smoke" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Smoke (ppm)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="ch"><div className="ct">🚨 Live Alerts</div></div>
          <div style={{ maxHeight: 225, overflowY: "auto" }}>
            {alerts.length === 0
              ? <div style={{ textAlign: "center", color: "var(--tx3)", padding: "28px 0", fontSize: 12 }}>✅ No active alerts</div>
              : alerts.slice(0, 8).map(a => <AlertRow key={a.id} a={a} />)}
          </div>
        </div>
      </div>

      <div className="g2 mb">
        <div className="card">
          <div className="ch"><div className="ct">🗺️ Disaster Map</div></div>
          <Map latestMap={latest} activeAlerts={alerts} />
        </div>
        <div className="card">
          <div className="ch"><div className="ct">⚡ Latency Monitor</div></div>
          <div style={{ marginBottom: 11 }}>
            {SENSOR_NODES.map(n => {
              const r = latest[n.id]; if (!r) return null;
              const l = latencyTier(r.networkDelay, r.processingDelay);
              return (
                <div key={n.id} className="tdisp">
                  <div className="tdot" style={{ background: l.color }} />
                  <div className="tn" style={{ color: l.color }}>{l.tier}</div>
                  <div style={{ fontSize: 11.5, color: "var(--tx2)", flex: 1, marginLeft: 4 }}>{n.name}</div>
                  <div className="tv">{l.latency.toFixed(1)}ms</div>
                </div>
              );
            })}
          </div>
          <Pipeline tier={lt.tier} />
          <div style={{ marginTop: 11 }}>
            <ResponsiveContainer width="100%" height={105}>
              <BarChart data={latencyHistory.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="t" tick={{ fontSize: 7.5, fill: "#4a7899" }} />
                <YAxis tick={{ fontSize: 7.5, fill: "#4a7899" }} />
                <Tooltip contentStyle={{ background: "#0a1422", border: "1px solid #1e3a5f", fontSize: 10 }} />
                <Bar dataKey="network" stackId="a" fill="#00c8ff" name="Network" />
                <Bar dataKey="processing" stackId="a" fill="#f59e0b" name="Processing" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="ch"><div className="ct">📋 System Logs</div></div>
        <Logs logs={systemLogs.slice(-30)} />
      </div>
    </div>
  );
}

function SensorPage({ sensorReadings }) {
  const [sel, setSel] = useState("N001");
  const data = sensorReadings.filter(r => r.nodeId === sel).slice(-40);
  const lat = data[data.length - 1] || {};
  const cv = (v, w, c) => v >= c ? "rd" : v >= w ? "am" : "gn";

  return (
    <div className="fade">
      <div className="tabs">
        {SENSOR_NODES.map(n => <button key={n.id} className={`tab ${sel === n.id ? "active" : ""}`} onClick={() => setSel(n.id)}>{n.name}</button>)}
      </div>
      <div className="mg mb">
        <Metric label="Temperature" value={lat.temperature?.toFixed(1) || "—"} unit="°C" color={cv(lat.temperature, 45, 60)} icon="🌡️" />
        <Metric label="Smoke" value={lat.smoke?.toFixed(0) || "—"} unit="ppm" color={cv(lat.smoke, 300, 500)} icon="💨" />
        <Metric label="Water Level" value={lat.waterLevel?.toFixed(1) || "—"} unit="%" color={cv(lat.waterLevel, 65, 85)} icon="🌊" />
        <Metric label="Seismic" value={lat.seismic?.toFixed(2) || "—"} unit=" M" color={cv(lat.seismic, 3.5, 5.5)} icon="📳" />
      </div>
      <div className="card mb">
        <div className="ch"><div className="ct">🌡️ Temperature & Smoke — {sel}</div></div>
        <ResponsiveContainer width="100%" height={215}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="t" tick={{ fontSize: 8.5, fill: "#4a7899" }} />
            <YAxis yAxisId="l" tick={{ fontSize: 8.5, fill: "#4a7899" }} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 8.5, fill: "#4a7899" }} />
            <Tooltip contentStyle={{ background: "#0a1422", border: "1px solid #1e3a5f", fontSize: 10.5 }} />
            <Legend wrapperStyle={{ fontSize: 10.5 }} />
            <Line yAxisId="l" type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp (°C)" />
            <Line yAxisId="r" type="monotone" dataKey="smoke" stroke="#f59e0b" strokeWidth={2} dot={false} name="Smoke (ppm)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="g2 mb">
        <div className="card">
          <div className="ch"><div className="ct">🌊 Water Level</div></div>
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={data}>
              <defs><linearGradient id="wlg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={.4} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="t" tick={{ fontSize: 8.5, fill: "#4a7899" }} />
              <YAxis tick={{ fontSize: 8.5, fill: "#4a7899" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#0a1422", border: "1px solid #1e3a5f", fontSize: 10.5 }} />
              <Area type="monotone" dataKey="waterLevel" stroke="#3b82f6" fill="url(#wlg)" strokeWidth={2} dot={false} name="Water Level (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="ch"><div className="ct">📳 Seismic Activity</div></div>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={data.slice(-20)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="t" tick={{ fontSize: 8.5, fill: "#4a7899" }} />
              <YAxis tick={{ fontSize: 8.5, fill: "#4a7899" }} />
              <Tooltip contentStyle={{ background: "#0a1422", border: "1px solid #1e3a5f", fontSize: 10.5 }} />
              <Bar dataKey="seismic" name="Magnitude" fill={lat.seismic > 5.5 ? "#ef4444" : lat.seismic > 3.5 ? "#f59e0b" : "#22c55e"} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <div className="ch"><div className="ct">📊 Threshold Status</div></div>
        <SBar label="Temperature" value={lat.temperature || 0} max={100} unit="°C" color="#ef4444" />
        <SBar label="Smoke" value={lat.smoke || 0} max={800} unit="ppm" color="#f59e0b" />
        <SBar label="Water Level" value={lat.waterLevel || 0} max={100} unit="%" color="#3b82f6" />
        <SBar label="Seismic" value={lat.seismic || 0} max={9} unit="M" color="#a78bfa" />
      </div>
    </div>
  );
}

function LatencyPage({ latencyHistory }) {
  const lh = latencyHistory[latencyHistory.length - 1] || {};
  const lt = latencyTier(lh.network || 5, lh.processing || 3);
  const total = latencyHistory.length || 1;
  const ec = latencyHistory.filter(h => h.network + h.processing < LATENCY_THRESHOLDS.edge).length;
  const fc = latencyHistory.filter(h => { const t = h.network + h.processing; return t >= LATENCY_THRESHOLDS.edge && t < LATENCY_THRESHOLDS.fog; }).length;
  const cc = total - ec - fc;
  const pie = [{ name: "Edge", value: ec, color: "#22c55e" }, { name: "Fog", value: fc, color: "#f59e0b" }, { name: "Cloud", value: cc, color: "#6366f1" }];

  return (
    <div className="fade">
      <div className="mg mb">
        <Metric label="Current Tier" value={lt.tier} color={lt.tier === "Edge" ? "gn" : lt.tier === "Fog" ? "am" : "rd"} icon="⚡" sub={`${lt.latency.toFixed(1)}ms total`} />
        <Metric label="Edge Routing" value={`${Math.round((ec / total) * 100)}%`} color="gn" icon="🟢" sub={`${ec} decisions`} />
        <Metric label="Fog Routing" value={`${Math.round((fc / total) * 100)}%`} color="am" icon="🟡" sub={`${fc} decisions`} />
        <Metric label="Cloud Routing" value={`${Math.round((cc / total) * 100)}%`} color="bl" icon="☁️" sub={`${cc} decisions`} />
      </div>
      <div className="g2 mb">
        <div className="card">
          <div className="ch"><div className="ct">⚡ Latency Over Time</div></div>
          <ResponsiveContainer width="100%" height={215}>
            <AreaChart data={latencyHistory.slice(-40)}>
              <defs><linearGradient id="ng" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00c8ff" stopOpacity={.3} /><stop offset="95%" stopColor="#00c8ff" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="t" tick={{ fontSize: 8.5, fill: "#4a7899" }} />
              <YAxis tick={{ fontSize: 8.5, fill: "#4a7899" }} />
              <Tooltip contentStyle={{ background: "#0a1422", border: "1px solid #1e3a5f", fontSize: 10.5 }} />
              <Legend wrapperStyle={{ fontSize: 10.5 }} />
              <Area type="monotone" dataKey="network" stroke="#00c8ff" fill="url(#ng)" strokeWidth={2} dot={false} name="Network (ms)" />
              <Line type="monotone" dataKey="processing" stroke="#f59e0b" strokeWidth={2} dot={false} name="Processing (ms)" />
              <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Total (ms)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="ch"><div className="ct">📊 Tier Distribution</div></div>
          <ResponsiveContainer width="100%" height={175}>
            <PieChart>
              <Pie data={pie} cx="50%" cy="50%" innerRadius={46} outerRadius={76} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "#4a7899" }} fontSize={10.5}>
                {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0a1422", border: "1px solid #1e3a5f", fontSize: 10.5 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="g2 mb">
        <div className="card">
          <div className="ch"><div className="ct">🔁 Decision Logic</div></div>
          <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, lineHeight: 2.1, color: "var(--tx2)" }}>
            <div><span style={{ color: "#6366f1" }}>IF</span> total &lt; <span style={{ color: "#22c55e" }}>15ms</span> → <span style={{ color: "#22c55e", fontWeight: 700 }}>EDGE</span></div>
            <div><span style={{ color: "#6366f1" }}>ELIF</span> total &lt; <span style={{ color: "#f59e0b" }}>50ms</span> → <span style={{ color: "#f59e0b", fontWeight: 700 }}>FOG</span></div>
            <div><span style={{ color: "#6366f1" }}>ELSE</span> → <span style={{ color: "#6366f1", fontWeight: 700 }}>CLOUD</span></div>
            <div style={{ marginTop: 11, color: "var(--tx3)" }}>Now: {lh.network?.toFixed(1)}ms + {lh.processing?.toFixed(1)}ms</div>
            <div>= <span style={{ color: lt.color, fontWeight: 700 }}>{lt.latency.toFixed(1)}ms</span> → <span style={{ color: lt.color, fontWeight: 700 }}>{lt.tier}</span></div>
          </div>
        </div>
        <div className="card">
          <div className="ch"><div className="ct">🔀 Priority Offloading</div></div>
          <div className="pflow">
            {[
              { p: "high", l: "HIGH", d: <><strong>Edge Node</strong> — Immediate, 0–15ms</> },
              { p: "medium", l: "MEDIUM", d: <><strong>Fog Layer</strong> — Regional, 15–50ms</> },
              { p: "low", l: "LOW", d: <><strong>Cloud</strong> — Analytics, 50ms+</> },
            ].map(x => (
              <div key={x.p} className={`pi ${x.p}`}>
                <div className={`plbl ${x.p}`}>{x.l}</div>
                <div style={{ color: "var(--tx3)" }}>→</div>
                <div className="pdst">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="ch"><div className="ct">📈 Edge vs Fog vs Cloud Comparison</div></div>
        <ResponsiveContainer width="100%" height={195}>
          <BarChart data={latencyHistory.slice(-20)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="t" tick={{ fontSize: 8.5, fill: "#4a7899" }} />
            <YAxis tick={{ fontSize: 8.5, fill: "#4a7899" }} />
            <Tooltip contentStyle={{ background: "#0a1422", border: "1px solid #1e3a5f", fontSize: 10.5 }} />
            <Legend wrapperStyle={{ fontSize: 10.5 }} />
            <Bar dataKey="edge" name="Edge (sim)" fill="#22c55e" radius={[2, 2, 0, 0]} />
            <Bar dataKey="fog" name="Fog (sim)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            <Bar dataKey="total" name="Cloud (sim)" fill="#6366f1" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AlertsPage({ alerts }) {
  const [sf, setSf] = useState("All");
  const [tf, setTf] = useState("All");
  const filtered = alerts.filter(a => (sf === "All" || a.severity === sf) && (tf === "All" || a.type === tf));
  const crit = alerts.filter(a => a.severity === "Critical").length;
  const med = alerts.filter(a => a.severity === "Medium").length;

  return (
    <div className="fade">
      <div className="mg mb">
        <Metric label="Total Alerts" value={alerts.length} color="bl" icon="🚨" />
        <Metric label="Critical" value={crit} color="rd" icon="🔴" sub="Immediate action" />
        <Metric label="Medium" value={med} color="am" icon="🟡" sub="Monitor closely" />
        <Metric label="Low / Normal" value={Math.max(0, alerts.length - crit - med)} color="gn" icon="✅" />
      </div>
      <div className="g3 mb">
        {[["Fire", "🔥", "#ef4444", "Temp & Smoke"], ["Flood", "🌊", "#3b82f6", "Water level"], ["Earthquake", "🌍", "#f59e0b", "Seismic"]].map(([type, em, c, d]) => (
          <div key={type} className="card">
            <div className="ch"><div className="ct">{em} {type} Alerts</div></div>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 30, color: c, textAlign: "center", padding: "10px 0" }}>{alerts.filter(a => a.type === type).length}</div>
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--tx3)" }}>{d} events</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="ch">
          <div className="ct">📋 Alert History</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["All", "Critical", "Medium"].map(s => (
              <button key={s} onClick={() => setSf(s)} style={{ padding: "2px 9px", borderRadius: 5, border: "1px solid", fontSize: 10.5, cursor: "pointer", fontWeight: 600, background: sf === s ? "rgba(0,200,255,.13)" : "none", borderColor: sf === s ? "var(--ac)" : "var(--bdr)", color: sf === s ? "var(--ac)" : "var(--tx3)" }}>{s}</button>
            ))}
            {["All", "Fire", "Flood", "Earthquake"].map(t => (
              <button key={t} onClick={() => setTf(t)} style={{ padding: "2px 9px", borderRadius: 5, border: "1px solid", fontSize: 10.5, cursor: "pointer", fontWeight: 600, background: tf === t ? "rgba(245,158,11,.13)" : "none", borderColor: tf === t ? "var(--am)" : "var(--bdr)", color: tf === t ? "var(--am)" : "var(--tx3)" }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="dt">
            <thead><tr><th>ID</th><th>TYPE</th><th>SEVERITY</th><th>NODE</th><th>SENSOR</th><th>VALUE</th><th>TIER</th><th>TIME</th></tr></thead>
            <tbody>
              {filtered.slice(0, 60).map(a => (
                <tr key={a.id}>
                  <td className="mono">{a.id}</td>
                  <td>{a.type === "Fire" ? "🔥" : a.type === "Flood" ? "🌊" : "🌍"} {a.type}</td>
                  <td><span className={`sv ${a.severity?.toLowerCase()}`}>{a.severity}</span></td>
                  <td className="mono">{a.nodeId}</td>
                  <td style={{ color: "var(--tx2)" }}>{a.sensor}</td>
                  <td className="mono">{typeof a.value === "number" ? a.value.toFixed(2) : a.value}</td>
                  <td><span style={{ color: a.tier === "Edge" ? "#22c55e" : a.tier === "Fog" ? "#f59e0b" : "#6366f1", fontSize: 11, fontWeight: 700 }}>{a.tier || "Edge"}</span></td>
                  <td className="mono" style={{ color: "var(--tx3)" }}>{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ textAlign: "center", color: "var(--tx3)", padding: "22px 0", fontSize: 12 }}>No alerts match filter</div>}
        </div>
      </div>
    </div>
  );
}

function AdminPage({ user, alerts, sensorReadings, systemLogs }) {
  const [tab, setTab] = useState("overview");
  return (
    <div className="fade">
      {user.role !== "Admin" && (
        <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.28)", borderRadius: 8, padding: "11px 15px", marginBottom: 14 }}>
          <span style={{ color: "#ff6b6b", fontWeight: 600, fontSize: 13 }}>⛔ Admin privileges required for full access.</span>
          <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 3 }}>Viewing as {user.role}.</div>
        </div>
      )}
      <div className="tabs">
        {["overview", "users", "nodes", "logs", "settings"].map(t => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
      </div>
      {tab === "overview" && (
        <div>
          <div className="mg mb">
            <Metric label="Total Readings" value={sensorReadings.length} color="bl" icon="📡" sub="In-memory DB" />
            <Metric label="Total Alerts" value={alerts.length} color={alerts.length > 20 ? "rd" : "am"} icon="🚨" />
            <Metric label="Active Nodes" value={SENSOR_NODES.length} color="gn" icon="🟢" />
            <Metric label="System Uptime" value="99.8" unit="%" color="gn" icon="💚" sub="Simulated" />
          </div>
          <div className="card mb">
            <div className="ch"><div className="ct">🌐 REST API Reference</div></div>
            <table className="dt">
              <thead><tr><th>METHOD</th><th>ENDPOINT</th><th>DESCRIPTION</th><th>AUTH</th></tr></thead>
              <tbody>
                {[["GET","/api/sensors","Sensor readings","JWT"],["POST","/api/sensors","Submit data","API Key"],["GET","/api/alerts","Alert history","JWT"],["POST","/api/alerts","Create alert","JWT"],["GET","/api/latency","Latency metrics","JWT"],["GET","/api/dashboard","Dashboard summary","JWT"],["POST","/api/users/login","Login","None"],["POST","/api/users/register","Register","None"]].map(([m,ep,d,a]) => (
                  <tr key={ep}>
                    <td><span style={{ color: m === "GET" ? "#22c55e" : "#f59e0b", fontWeight: 700, fontSize: 11, fontFamily: "Space Mono, monospace" }}>{m}</span></td>
                    <td className="mono">{ep}</td>
                    <td style={{ color: "var(--tx2)", fontSize: 11 }}>{d}</td>
                    <td><span style={{ fontSize: 9.5, padding: "1px 5px", background: "rgba(0,200,255,.1)", color: "var(--ac)", borderRadius: 4 }}>{a}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <div className="ch"><div className="ct">🏗️ Architecture Layers</div></div>
            <div className="g3">
              {[
                { l: "IoT / Edge", items: ["4 Sensor Nodes", "Temp·Smoke·Water·Seismic", "Threshold Detection", "Offline Mode"], c: "#22c55e" },
                { l: "Fog Layer", items: ["Regional Aggregation", "Load Balancing", "Latency Routing", "Multi-node Analysis"], c: "#f59e0b" },
                { l: "Cloud Layer", items: ["Historical Storage", "Analytics Reports", "ML Insights (sim)", "Archive"], c: "#6366f1" },
              ].map(lyr => (
                <div key={lyr.l} style={{ background: "var(--bg4)", border: `1px solid ${lyr.c}33`, borderRadius: 8, padding: 12 }}>
                  <div style={{ color: lyr.c, fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{lyr.l}</div>
                  {lyr.items.map(i => <div key={i} style={{ fontSize: 11, color: "var(--tx2)", marginBottom: 4 }}>→ {i}</div>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === "users" && (
        <div className="card">
          <div className="ch"><div className="ct">👥 User Management</div></div>
          <div className="utr">
              <div className="ua">{user.name ? user.name[0].toUpperCase() : "U"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name || "User"}</div>
                <div style={{ fontSize: 11, color: "var(--tx3)" }}>{user.email}</div>
                {user.location && <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 2 }}>📍 {user.location}</div>}
              </div>
              <span className="rbdg" style={{ background: user.role === "Admin" ? "rgba(99,102,241,.2)" : user.role === "Emergency Authority" ? "rgba(239,68,68,.18)" : "rgba(34,197,94,.13)", color: user.role === "Admin" ? "#a5b4fc" : user.role === "Emergency Authority" ? "#ff6b6b" : "#4ade80" }}>{user.role}</span>
              <span style={{ fontSize: 10, color: "#22c55e", marginLeft: 11 }}>● Active</span>
            </div>
        </div>
      )}
      {tab === "nodes" && (
        <div className="g2">
          {SENSOR_NODES.map(node => {
            const readings = sensorReadings.filter(r => r.nodeId === node.id);
            const latest = readings[readings.length - 1] || {};
            const lt = latest.networkDelay ? latencyTier(latest.networkDelay, latest.processingDelay) : { tier: "—", color: "#4a7899", latency: 0 };
            return (
              <div key={node.id} className="nc">
                <div className="nh">
                  <div className="sdot" />
                  <div><div className="nnm">{node.name}</div><div className="nid">{node.id} · {node.region}</div></div>
                  <div className="nrg" style={{ color: lt.color }}>◉ {lt.tier}</div>
                </div>
                <div className="rg">
                  {[["Temp", latest.temperature, "°C"], ["Smoke", latest.smoke, "ppm"], ["Water", latest.waterLevel, "%"], ["Seismic", latest.seismic, "M"]].map(([l, v, u]) => (
                    <div key={l} className="ri">
                      <div className="rl">{l}</div>
                      <div className="rv" style={{ color: "var(--ac)" }}>{v?.toFixed(1) || "—"}<span style={{ fontSize: 11 }}>{u}</span></div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 7, fontSize: 9.5, color: "var(--tx3)", fontFamily: "Space Mono, monospace" }}>Readings: {readings.length} · Last: {latest.t || "—"}</div>
              </div>
            );
          })}
        </div>
      )}
      {tab === "logs" && (
        <div className="card"><div className="ch"><div className="ct">📋 Full System Logs</div></div><Logs logs={systemLogs} /></div>
      )}
      {tab === "settings" && (
        <div className="g2">
          <div className="card">
            <div className="ch"><div className="ct">⚙️ Alert Thresholds</div></div>
            {[["Temperature Critical (°C)", THRESHOLDS.temperature.critical, 120], ["Smoke Critical (ppm)", THRESHOLDS.smoke.critical, 1000], ["Water Level Critical (%)", THRESHOLDS.waterLevel.critical, 100], ["Seismic Critical (M)", THRESHOLDS.seismic.critical, 9]].map(([l, v, m]) => (
              <div key={l} style={{ marginBottom: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: "var(--tx2)" }}>{l}</span>
                  <span style={{ fontFamily: "Space Mono, monospace", fontSize: 12, color: "var(--rd)" }}>{v}</span>
                </div>
                <input type="range" min={0} max={m} defaultValue={v} />
              </div>
            ))}
          </div>
          <div className="card">
            <div className="ch"><div className="ct">🌐 System Config</div></div>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "var(--tx2)", lineHeight: 2.1, background: "var(--bg4)", padding: 13, borderRadius: 8 }}>
              <div>DB: MongoDB :27017</div>
              <div>Backend: Express :3001</div>
              <div>Socket.IO: ws://localhost:3001</div>
              <div>JWT Expiry: 24h</div>
              <div>Edge Threshold: {LATENCY_THRESHOLDS.edge}ms</div>
              <div>Fog Threshold: {LATENCY_THRESHOLDS.fog}ms</div>
              <div>IoT Tick: 2000ms</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomePage({ simulateEvent }) {
  return (
    <div className="fade">
      <div style={{ textAlign: "center", padding: "36px 18px 28px" }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🛡️</div>
        <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 30, fontWeight: 800, marginBottom: 7 }}>Latency-Aware Fog–Edge Framework</div>
        <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 18, color: "var(--ac)", marginBottom: 11 }}>Real-Time Disaster Response Management System</div>
        <div style={{ fontSize: 12.5, color: "var(--tx2)", maxWidth: 580, margin: "0 auto", lineHeight: 1.8 }}>A production-grade IoT-driven platform leveraging edge computing, fog coordination, and cloud analytics for intelligent, latency-aware disaster detection and response.</div>
      </div>
      <div className="g3 mb">
        {[
          { i: "📡", t: "IoT Acquisition", d: "4 sensor nodes generating temperature, smoke, water level & seismic data in real time.", c: "#22c55e" },
          { i: "⚡", t: "Edge Processing", d: "Immediate anomaly detection and threshold alerts with sub-15ms edge response.", c: "#00c8ff" },
          { i: "🌫️", t: "Fog Coordination", d: "Regional aggregation across nodes with load balancing and collective analysis.", c: "#f59e0b" },
          { i: "☁️", t: "Cloud Analytics", d: "Historical data storage, trend analysis, and comprehensive report generation.", c: "#6366f1" },
          { i: "🔁", t: "Priority Offloading", d: "Dynamic routing: High→Edge, Medium→Fog, Low→Cloud based on real-time latency.", c: "#a78bfa" },
          { i: "🚨", t: "Alert System", d: "Multi-tier notifications with severity classification, history, and authority routing.", c: "#ef4444" },
        ].map(f => (
          <div key={f.t} className="card" style={{ borderTop: `2px solid ${f.c}` }}>
            <div style={{ fontSize: 26, marginBottom: 9 }}>{f.i}</div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 14.5, fontWeight: 700, color: f.c, marginBottom: 7 }}>{f.t}</div>
            <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.7 }}>{f.d}</div>
          </div>
        ))}
      </div>
      <div className="card mb">
        <div className="ch"><div className="ct">🎮 Simulation Controls</div></div>
        <div style={{ display: "flex", gap: 11, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, fontSize: 12, color: "var(--tx2)", lineHeight: 1.7 }}>Trigger simulated disaster events to test system response. Each event injects abnormal sensor readings and propagates alerts through the edge–fog–cloud pipeline.</div>
          <div style={{ display: "flex", gap: 9 }}>
            <button className="sbtn fi" onClick={() => simulateEvent("fire")} style={{ padding: "9px 16px", fontSize: 13 }}>🔥 Simulate Fire</button>
            <button className="sbtn fl" onClick={() => simulateEvent("flood")} style={{ padding: "9px 16px", fontSize: 13 }}>🌊 Simulate Flood</button>
            <button className="sbtn eq" onClick={() => simulateEvent("earthquake")} style={{ padding: "9px 16px", fontSize: 13 }}>🌍 Simulate Earthquake</button>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="ch"><div className="ct">🏗️ System Architecture</div></div>
        <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "var(--tx2)", lineHeight: 2.3, background: "var(--bg4)", padding: 15, borderRadius: 8 }}>
          <div style={{ color: "#22c55e" }}>[ IoT Sensors: N001–N004 ] → Edge Nodes</div>
          <div style={{ paddingLeft: 18, color: "var(--tx3)" }}>↓ Anomaly Detection | Threshold Alerts | Offline Fallback</div>
          <div style={{ color: "#f59e0b", paddingLeft: 36 }}>→ Fog Layer (Regional Coordinator)</div>
          <div style={{ paddingLeft: 54, color: "var(--tx3)" }}>↓ Aggregation | Load Balancing | Priority Routing</div>
          <div style={{ color: "#6366f1", paddingLeft: 72 }}>→ Cloud Layer (Analytics & Storage)</div>
          <div style={{ paddingLeft: 90, color: "var(--tx3)" }}>↓ Historical DB | Reports | ML Insights</div>
          <div style={{ color: "var(--ac)", paddingLeft: 36 }}>⟶ React Dashboard (Real-Time WebSocket UI)</div>
        </div>
      </div>
    </div>
  );
}


// ─── LOCATION PICKER ─────────────────────────────────────────────────────────
function LocationPicker({ location, onChange }) {
  const [mode, setMode] = useState("manual");
  const [gpsStatus, setGpsStatus] = useState("");
  const [state, setState] = useState(location?.state || "Tamil Nadu");
  const [city, setCity] = useState(location?.city || "Chennai");

  const detectGPS = () => {
    setGpsStatus("Detecting your location...");
    if (!navigator.geolocation) { setGpsStatus("GPS not supported on this device"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsStatus("GPS: " + latitude.toFixed(4) + ", " + longitude.toFixed(4));
        onChange({ method: "gps", lat: latitude, lng: longitude, state: "GPS Detected", city: latitude.toFixed(2) + ", " + longitude.toFixed(2) });
      },
      () => { setGpsStatus("GPS denied — please use manual selection"); setMode("manual"); }
    );
  };

  useEffect(() => { if (mode === "manual") onChange({ method: "manual", state, city }); }, [state, city, mode]);

  const cities = INDIA[state] || [];
  return (
    <div>
      <div className="loc-btns">
        <button type="button" className={"loc-btn" + (mode === "gps" ? " active" : "")} onClick={() => { setMode("gps"); detectGPS(); }}>📍 Auto GPS</button>
        <button type="button" className={"loc-btn" + (mode === "manual" ? " active" : "")} onClick={() => setMode("manual")}>🗺️ Select Manually</button>
      </div>
      {mode === "gps" && gpsStatus && <div className="loc-info">{gpsStatus}</div>}
      {mode === "manual" && (
        <div className="frow" style={{ marginTop: 7 }}>
          <div>
            <label className="fl">STATE</label>
            <select className="fi2" value={state} onChange={e => { setState(e.target.value); setCity((INDIA[e.target.value] || [""])[0]); }}>
              {Object.keys(INDIA).sort().map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="fl">CITY</label>
            <select className="fi2" value={city} onChange={e => setCity(e.target.value)}>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
function Register({ onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [role, setRole] = useState("Public Viewer");
  const [location, setLocation] = useState({ method: "manual", state: "Tamil Nadu", city: "Chennai" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setErr("");
    if (!name.trim()) return setErr("Please enter your full name.");
    if (!email.trim()) return setErr("Please enter your email.");
    if (pwd.length < 6) return setErr("Password must be at least 6 characters.");
    if (pwd !== pwd2) return setErr("Passwords do not match.");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pwd);
      await updateProfile(cred.user, { displayName: name });
      const locStr = location.method === "gps" ? "GPS: " + location.city : location.city + ", " + location.state;
      saveProfile(cred.user.uid, { name, role, state: location.state || "India", city: location.city || "", location: locStr });
    } catch (e) {
      setErr(e.message.replace("Firebase: ", "").replace(/\(auth.*\)/, "").trim());
      setLoading(false);
    }
  };

  return (
    <div className="lsc">
      <div className="lbg" /><div className="lgr" />
      <div className="rbx">
        <div className="llo">
          <div className="lli">🛡️</div>
          <div className="lt">Create Account</div>
          <div className="ls">DisasterMS — Fog–Edge Framework v2.1</div>
        </div>
        {err && <div className="lerr">⚠️ {err}</div>}
        <div className="fg"><label className="fl">FULL NAME</label><input className="fi2" placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="fg"><label className="fl">EMAIL ADDRESS</label><input className="fi2" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="frow">
          <div className="fg"><label className="fl">PASSWORD</label><input className="fi2" type="password" placeholder="Min. 6 characters" value={pwd} onChange={e => setPwd(e.target.value)} /></div>
          <div className="fg"><label className="fl">CONFIRM PASSWORD</label><input className="fi2" type="password" placeholder="Repeat password" value={pwd2} onChange={e => setPwd2(e.target.value)} /></div>
        </div>
        <div className="fg">
          <label className="fl">ROLE</label>
          <div className="role-sel">
            {[{r:"Admin",i:"⚙️"},{r:"Emergency Authority",i:"🚨"},{r:"Public Viewer",i:"👁️"}].map(({r,i}) => (
              <div key={r} className={"role-opt" + (role === r ? " selected" : "")} onClick={() => setRole(r)}>
                <div className="ri2">{i}</div>
                <div className="rl2">{r}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="fg">
          <label className="fl">LOCATION (INDIA)</label>
          <LocationPicker location={location} onChange={setLocation} />
        </div>
        <button className="lbtn" onClick={go} disabled={loading}>{loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT →"}</button>
        <div className="lswitch">Already have an account? <span onClick={onSwitch}>Sign In</span></div>
      </div>
    </div>
  );
}

// ─── LOGIN ──────────────────────────────────────────────────────────────────
function Login({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const go = async () => {
    setErr(""); setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, pwd); }
    catch (e) { setErr("Invalid email or password. Please try again."); setLoading(false); }
  };
  return (
    <div className="lsc">
      <div className="lbg" /><div className="lgr" />
      <div className="lbx">
        <div className="llo"><div className="lli">🛡️</div><div className="lt">DisasterMS</div><div className="ls">Fog–Edge Disaster Response Framework v2.1</div></div>
        {err && <div className="lerr">⚠️ {err}</div>}
        <div className="fg"><label className="fl">EMAIL</label><input className="fi2" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} /></div>
        <div className="fg"><label className="fl">PASSWORD</label><input className="fi2" type="password" placeholder="••••••••" value={pwd} onChange={e => setPwd(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} /></div>
        <button className="lbtn" onClick={go} disabled={loading}>{loading ? "AUTHENTICATING..." : "AUTHENTICATE →"}</button>
        <div className="lswitch">No account yet? <span onClick={onSwitch}>Register here</span></div>
      </div>
    </div>
  );
}

// ─── ROOT ───────────────────────────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser] = useState(undefined);
  const [profile, setProfile] = useState({});
  const [showRegister, setShowRegister] = useState(false);
  const [page, setPage] = useState("home");
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [latHist, setLatHist] = useState([]);
  const [logs, setLogs] = useState([]);
  const [cloudOff, setCloudOff] = useState(false);
  const [now, setNow] = useState(ts());
  const [toast, setToast] = useState(null);
  const simRef = useRef(null);
  const tick = useRef(0);
  const emailCooldown = useRef({});

  const showToast = useCallback((msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); }, []);
  const log = useCallback((level, msg) => setLogs(p => [...p.slice(-200), { time: ts(), level, msg }]), []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        const prof = loadProfile(u.uid);
        setProfile({ name: u.displayName || prof.name || "User", email: u.email, role: prof.role || "Public Viewer", location: prof.location || "India", state: prof.state || "", city: prof.city || "", uid: u.uid });
        setAuthUser(u);
      } else { setAuthUser(null); setProfile({}); }
    });
    return unsub;
  }, []);

  useEffect(() => { const t = setInterval(() => setNow(ts()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!authUser) return;
    log("OK", "System initialized. IoT simulation running.");
    log("INFO", "Authenticated: " + profile.name + " (" + profile.role + ")");
    const iv = setInterval(() => {
      tick.current++;
      const ev = simRef.current; if (ev) simRef.current = null;
      const nodeId = SENSOR_NODES[tick.current % SENSOR_NODES.length].id;
      const r = generateReading(nodeId, ev);
      const lt = latencyTier(r.networkDelay, r.processingDelay);
      const newA = detectAlerts(r).map(a => ({ ...a, tier: lt.tier }));
      setReadings(p => [...p.slice(-240), r]);
      setLatHist(p => [...p.slice(-120), { t: ts(), network: r.networkDelay, processing: r.processingDelay, total: r.networkDelay + r.processingDelay, edge: rand(5, 14), fog: rand(16, 49) }]);
      if (newA.length) {
        setAlerts(p => [...newA, ...p].slice(0, 500));
        newA.forEach(a => {
          log(a.severity === "Critical" ? "CRIT" : "WARN", a.type + " [" + a.severity + "] " + a.nodeId + " · " + a.sensor + "=" + a.value.toFixed(1));
          if (a.severity === "Critical" && authUser?.email) {
            const key = a.type;
            const now2 = Date.now();
            if (!emailCooldown.current[key] || now2 - emailCooldown.current[key] > 120000) {
              emailCooldown.current[key] = now2;
              emailjs.send(EJ_SVC, EJ_TPL, { to_email: authUser.email, to_name: profile.name || "User", alert_type: a.type, severity: a.severity, location: profile.location || "India", sensor: a.sensor, value: a.value.toFixed(2), time: a.time })
                .then(() => { showToast("📧 Alert email sent to " + authUser.email); log("OK", "Email sent → " + authUser.email + " (" + a.type + ")"); })
                .catch(() => log("WARN", "Email send failed — check EmailJS config"));
            }
          }
        });
      } else if (tick.current % 6 === 0) log("INFO", nodeId + ": all normal. " + lt.tier + " @ " + lt.latency.toFixed(1) + "ms");
      if (tick.current % 22 === 0) { const off = Math.random() < 0.1; setCloudOff(off); if (off) log("WARN", "Cloud layer offline — edge fallback active."); }
    }, 2000);
    return () => clearInterval(iv);
  }, [authUser, log, showToast, profile]);

  const simulate = useCallback((type) => { simRef.current = type; log("CRIT", "SIM: " + type.toUpperCase() + " event injected into pipeline."); }, [log]);
  const critN = alerts.filter(a => a.severity === "Critical").length;
  const handleLogout = () => { signOut(auth); setAlerts([]); setReadings([]); setLatHist([]); setLogs([]); tick.current = 0; };

  if (authUser === undefined) return (
    <><style>{CSS}</style>
    <div style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}><div style={{ fontSize:40,marginBottom:14 }}>🛡️</div><div style={{ fontFamily:"Rajdhani,sans-serif",fontSize:16,color:"var(--tx3)" }}>Loading DisasterMS...</div></div>
    </div></>
  );

  if (!authUser) return (
    <><style>{CSS}</style>
    {showRegister ? <Register onSwitch={() => setShowRegister(false)} /> : <Login onSwitch={() => setShowRegister(true)} />}
    </>
  );

  const user = profile;
  const titles = { home:"System Overview",dashboard:"Live Dashboard",sensors:"Sensor Monitoring",latency:"Latency Analytics",alerts:"Alert Center",admin:"Admin Panel" };
  const NAV = [
    {id:"home",l:"Home",i:"🏠"},{id:"dashboard",l:"Dashboard",i:"📊"},
    {id:"sensors",l:"Sensor Monitor",i:"📡"},{id:"latency",l:"Latency Analytics",i:"⚡"},
    {id:"alerts",l:"Alert Center",i:"🚨",badge:critN||null},{id:"admin",l:"Admin Panel",i:"⚙️"},
  ];

  return (
    <>
      <style>{CSS}</style>
      {toast && <div className={"toast" + (toast.type === "warn" ? " warn" : "")}>{toast.msg}</div>}
      <div className="app">
        <nav className="sidebar">
          <div className="sb-logo"><div className="sb-icon">🛡️</div><div className="sb-txt">DisasterMS<span>Fog–Edge Framework v2.1</span></div></div>
          <div className="nav">
            <div className="nav-sec">
              <div className="nav-lbl">Navigation</div>
              {NAV.map(n => (
                <div key={n.id} className={"nav-item" + (page === n.id ? " active" : "")} onClick={() => setPage(n.id)}>
                  <span className="ic">{n.i}</span>{n.l}
                  {n.badge ? <span className="nav-bdg">{n.badge}</span> : null}
                </div>
              ))}
            </div>
            {user.city && (
              <div className="nav-sec">
                <div className="nav-lbl">My Location</div>
                <div style={{ padding:"5px 9px",fontSize:10.5,color:"var(--tx3)",fontFamily:"Space Mono,monospace" }}>📍 {user.city}</div>
                {user.state && <div style={{ padding:"0 9px 5px",fontSize:10,color:"var(--tx3)" }}>{user.state}, India</div>}
              </div>
            )}
          </div>
          <div className="sb-foot">
            <div className="uc">
              <div className="ua">{(user.name||"U")[0].toUpperCase()}</div>
              <div className="ui"><div className="un">{user.name}</div><div className="ur">{user.role}</div></div>
              <button className="lob" onClick={handleLogout} title="Logout">↩</button>
            </div>
          </div>
        </nav>
        <div className="main">
          <div className="topbar">
            <div className="tb-title">{titles[page]}<span>Fog–Edge Disaster Response</span></div>
            <div className="sbtns">
              <button className="sbtn fi" onClick={() => simulate("fire")}>🔥 Fire</button>
              <button className="sbtn fl" onClick={() => simulate("flood")}>🌊 Flood</button>
              <button className="sbtn eq" onClick={() => simulate("earthquake")}>🌍 Quake</button>
            </div>
            <div className={"sdot" + (cloudOff ? " red" : alerts.some(a => a.severity === "Critical") ? " am" : "")} />
            <div className="ttime">{now}</div>
          </div>
          <div className="content">
            {page === "home" && <HomePage simulateEvent={simulate} />}
            {page === "dashboard" && <DashboardPage sensorReadings={readings} alerts={alerts} latencyHistory={latHist} systemLogs={logs} cloudOffline={cloudOff} />}
            {page === "sensors" && <SensorPage sensorReadings={readings} />}
            {page === "latency" && <LatencyPage latencyHistory={latHist} />}
            {page === "alerts" && <AlertsPage alerts={alerts} />}
            {page === "admin" && <AdminPage user={user} alerts={alerts} sensorReadings={readings} systemLogs={logs} />}
          </div>
        </div>
      </div>
    </>
  );
}
