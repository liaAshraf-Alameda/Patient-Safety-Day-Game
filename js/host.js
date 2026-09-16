/**
 * Live host / big-screen leaderboard.
 * Each host session gets a unique QR code. Players joining through that QR
 * receive an ID prefixed with the session ID, allowing the host to show only
 * participants from the current event session without changing game.js.
 */

let currentSessionId = null;
let playersRef = null;
let hostMusicEnabled = false;
let roleBaselines = {};

function getHostMusic() {
  return document.getElementById("hostBackgroundMusic");
}

function updateMusicButton() {
  const button = document.getElementById("musicToggle");
  if (!button) return;
  button.classList.toggle("active", hostMusicEnabled);
  button.setAttribute("aria-pressed", hostMusicEnabled ? "true" : "false");
  button.querySelector("b").textContent = hostMusicEnabled ? "Music On" : "Music";
}

function startHostMusic() {
  const music = getHostMusic();
  if (!music || hostMusicEnabled) return;
  music.volume = 0.28;
  const playRequest = music.play();
  if (playRequest) {
    playRequest.then(() => {
      hostMusicEnabled = true;
      updateMusicButton();
    }).catch(() => {
      hostMusicEnabled = false;
      updateMusicButton();
    });
  }
}

function stopHostMusic() {
  const music = getHostMusic();
  if (music) music.pause();
  hostMusicEnabled = false;
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
    if (!roles[role]) roles[role] = { role, participants: 0, scoreTotal: 0, safetyTotal: 0, trustTotal: 0, finished: 0 };
    roles[role].participants += 1;
    roles[role].scoreTotal += getPlayerScore(player);
    roles[role].safetyTotal += Math.max(0, Number(player.safetyScore) || 0);
    roles[role].trustTotal += Math.max(0, Number(player.trustScore) || 0);
    if (player.status === "finished") roles[role].finished += 1;
  });

  return Object.values(roles).map(group => ({
    role: group.role,
    participants: group.participants,
    averageScore: group.participants ? group.scoreTotal / group.participants : 0,
    patientCenteredScore: group.participants ? (group.safetyTotal + group.trustTotal) / (group.participants * 2) : 0,
    finished: group.finished
  })).sort((a, b) => b.averageScore - a.averageScore || b.participants - a.participants);
}

function updateRoleAwards(groups) {
  const scoreName = document.getElementById("highestScoreRole");
  const scoreValue = document.getElementById("highestScoreValue");
  const improvedName = document.getElementById("mostImprovedRole");
  const improvedValue = document.getElementById("mostImprovedValue");
  const careName = document.getElementById("bestCareRole");
  const careValue = document.getElementById("bestCareValue");
  if (!scoreName || !groups.length) return;

  groups.forEach(group => {
    if (typeof roleBaselines[group.role] !== "number") roleBaselines[group.role] = group.averageScore;
    group.improvement = group.averageScore - roleBaselines[group.role];
  });

  const highest = groups.slice().sort((a, b) => b.averageScore - a.averageScore || b.participants - a.participants)[0];
  const improved = groups.slice().sort((a, b) => b.improvement - a.improvement || b.averageScore - a.averageScore)[0];
  const care = groups.slice().sort((a, b) => b.patientCenteredScore - a.patientCenteredScore || b.averageScore - a.averageScore)[0];

  scoreName.textContent = highest.role;
  scoreValue.textContent = Math.round(highest.averageScore * 10) / 10 + "% team average";
  improvedName.textContent = improved.role;
  improvedValue.textContent = "+" + Math.max(0, Math.round(improved.improvement * 10) / 10) + " points";
  careName.textContent = care.role;
  careValue.textContent = Math.round(care.patientCenteredScore * 10) / 10 + "% safety & trust";
}

function resetRoleAwards() {
  roleBaselines = {};
  const values = [
    ["highestScoreRole", "Waiting for teams"], ["highestScoreValue", "—"],
    ["mostImprovedRole", "Waiting for progress"], ["mostImprovedValue", "—"],
    ["bestCareRole", "Waiting for teams"], ["bestCareValue", "—"]
  ];
  values.forEach(([id, text]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  });
}

function renderLeaderboard(players) {
  const container = document.getElementById("leaderboard");
  const groups = aggregateByRole(players);

  if (!groups.length) {
    resetRoleAwards();
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
  try {
    updateRoleAwards(groups);
  } catch (error) {
    console.warn("Role awards could not update", error);
  }
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
  resetRoleAwards();
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
