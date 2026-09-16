/**
 * Live host / big-screen leaderboard.
 * Each host session gets a unique QR code. Players joining through that QR
 * receive an ID prefixed with the session ID, allowing the host to show only
 * participants from the current event session without changing game.js.
 */

let currentSessionId = null;
let playersRef = null;
let hostAudioContext = null;
let hostMusicGain = null;
let hostMusicTimer = null;
let hostMusicEnabled = false;

function playAmbientPhrase() {
  if (!hostAudioContext || !hostMusicEnabled) return;
  const notes = [261.63, 329.63, 392.00, 493.88, 392.00, 329.63];
  const start = hostAudioContext.currentTime + 0.05;
  notes.forEach((frequency, index) => {
    const oscillator = hostAudioContext.createOscillator();
    const gain = hostAudioContext.createGain();
    oscillator.type = index % 2 ? "sine" : "triangle";
    oscillator.frequency.value = frequency / (index === 3 ? 2 : 1);
    gain.gain.setValueAtTime(0.0001, start + index * 0.48);
    gain.gain.exponentialRampToValueAtTime(0.055, start + index * 0.48 + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.48 + 1.35);
    oscillator.connect(gain);
    gain.connect(hostMusicGain);
    oscillator.start(start + index * 0.48);
    oscillator.stop(start + index * 0.48 + 1.5);
  });
}

function updateMusicButton() {
  const button = document.getElementById("musicToggle");
  if (!button) return;
  button.classList.toggle("active", hostMusicEnabled);
  button.setAttribute("aria-pressed", hostMusicEnabled ? "true" : "false");
  button.querySelector("b").textContent = hostMusicEnabled ? "Music On" : "Music";
}

function startHostMusic() {
  if (hostMusicEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  hostAudioContext = hostAudioContext || new AudioContextClass();
  if (hostAudioContext.state === "suspended") hostAudioContext.resume();
  hostMusicGain = hostMusicGain || hostAudioContext.createGain();
  hostMusicGain.gain.value = 0.55;
  hostMusicGain.connect(hostAudioContext.destination);
  hostMusicEnabled = true;
  playAmbientPhrase();
  hostMusicTimer = setInterval(playAmbientPhrase, 4300);
  updateMusicButton();
}

function stopHostMusic() {
  hostMusicEnabled = false;
  if (hostMusicTimer) clearInterval(hostMusicTimer);
  hostMusicTimer = null;
  if (hostMusicGain && hostAudioContext) {
    hostMusicGain.gain.cancelScheduledValues(hostAudioContext.currentTime);
    hostMusicGain.gain.setTargetAtTime(0.0001, hostAudioContext.currentTime, 0.08);
  }
  updateMusicButton();
}

function toggleHostMusic() {
  if (hostMusicEnabled) stopHostMusic();
  else startHostMusic();
}
window.toggleHostMusic = toggleHostMusic;

function makeSessionId() {
  return "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function getPlayerScore(player) {
  if (typeof player.finalScore === "number") return player.finalScore;
  const total = Number(player.totalQuestions) || 0;
  const correct = Number(player.answeredCorrectly) || 0;
  return total > 0 ? (correct / total) * 100 : 0;
}

function aggregateByRole(players) {
  const prefix = currentSessionId + "__";
  const roles = {};

  Object.keys(players || {}).forEach(id => {
    if (!id.startsWith(prefix)) return;
    const player = players[id] || {};
    const role = player.role || "Unknown";
    if (!roles[role]) roles[role] = { role, participants: 0, scoreTotal: 0, finished: 0 };
    roles[role].participants += 1;
    roles[role].scoreTotal += getPlayerScore(player);
    if (player.status === "finished") roles[role].finished += 1;
  });

  return Object.values(roles).map(group => ({
    role: group.role,
    participants: group.participants,
    averageScore: group.participants ? group.scoreTotal / group.participants : 0,
    finished: group.finished
  })).sort((a, b) => b.averageScore - a.averageScore || b.participants - a.participants);
}

function renderLeaderboard(players) {
  const container = document.getElementById("leaderboard");
  const groups = aggregateByRole(players);

  if (!groups.length) {
    container.innerHTML = '<div class="leaderboard-empty">Waiting for players in this session to join…</div>';
    return;
  }

  container.innerHTML = groups.map((group, index) => {
    const rank = index + 1;
    const average = Math.round(group.averageScore * 10) / 10;
    return `
      <div class="leaderboard-row role-row rank-${rank}">
        <div class="leaderboard-rank">#${rank}</div>
        <div class="leaderboard-player">
          <span class="player-name">${escapeHtml(group.role)}</span>
          <span class="player-meta">${group.finished}/${group.participants} finished</span>
        </div>
        <div class="role-participants"><strong>${group.participants}</strong><span>Participants</span></div>
        <div class="leaderboard-bar-wrap">
          <div class="leaderboard-bar-label"><span>Average score</span><span>${average}%</span></div>
          <div class="leaderboard-bar"><div class="fill" style="width:${Math.max(0, Math.min(100, average))}%;background:linear-gradient(90deg,var(--accent-highlight),var(--accent-success));"></div></div>
        </div>
        <div class="role-average">${average}%</div>
      </div>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function getJoinUrl() {
  const url = new URL("join.html", window.location.href);
  url.searchParams.set("session", currentSessionId);
  return url.href;
}

function renderJoinQr() {
  const joinUrl = getJoinUrl();
  const urlText = document.getElementById("joinUrlText");
  const sessionText = document.getElementById("sessionIdText");
  const canvas = document.getElementById("joinQrCode");

  if (sessionText) sessionText.textContent = currentSessionId;
  urlText.textContent = joinUrl;

  if (window.location.protocol === "file:") {
    canvas.style.display = "none";
    urlText.textContent = "Serve this page over http(s) for phone QR joining.";
    return;
  }
  if (typeof QRCode === "undefined") {
    canvas.style.display = "none";
    return;
  }
  canvas.style.display = "block";
  QRCode.toCanvas(canvas, joinUrl, { width: 180, margin: 1, color: { dark: "#0c1230", light: "#f5f8ff" } }, err => {
    if (err) console.error("Failed to render join QR code", err);
  });
}

function startNewSession() {
  currentSessionId = makeSessionId();
  sessionStorage.setItem("psd_host_session_id", currentSessionId);
  renderJoinQr();
  document.getElementById("leaderboard").innerHTML = '<div class="leaderboard-empty">Waiting for players in this session to join…</div>';
}

window.startNewSession = startNewSession;

document.addEventListener("pointerdown", event => {
  if (!event.target.closest("#musicToggle")) startHostMusic();
}, { once: true });

window.addEventListener("DOMContentLoaded", () => {
  currentSessionId = sessionStorage.getItem("psd_host_session_id") || makeSessionId();
  sessionStorage.setItem("psd_host_session_id", currentSessionId);
  renderJoinQr();

  if (typeof firebaseDb === "undefined" || !firebaseDb) {
    document.getElementById("leaderboard").innerHTML = '<div class="leaderboard-empty">⚠️ Could not connect to Firebase.</div>';
    return;
  }

  playersRef = firebaseDb.ref("players");
  playersRef.on("value", snapshot => renderLeaderboard(snapshot.val()), err => {
    console.error("Failed to read live scores", err);
    document.getElementById("leaderboard").innerHTML = '<div class="leaderboard-empty">⚠️ Failed to load live scores.</div>';
  });
});
