/**
 * Live host / big-screen leaderboard.
 * Subscribes to Firebase Realtime Database "players" node and renders a
 * ranked, auto-updating leaderboard for everyone currently playing.
 */

const STATUS_LABELS = {
  playing: "Playing",
  who_challenge: "WHO Challenge",
  finished: "Finished"
};

function computeRank(player) {
  // Rank primarily by how many questions were answered correctly, then by
  // combined safety + trust score as a tiebreaker.
  const answered = player.answeredCorrectly || 0;
  const combinedScore = (player.safetyScore || 0) + (player.trustScore || 0);
  return answered * 1000 + combinedScore;
}

function renderLeaderboard(players) {
  const container = document.getElementById("leaderboard");
  const entries = Object.keys(players || {}).map(id => Object.assign({ id }, players[id]));

  if (entries.length === 0) {
    container.innerHTML = '<div class="leaderboard-empty">Waiting for players to join…</div>';
    return;
  }

  entries.sort((a, b) => computeRank(b) - computeRank(a));

  container.innerHTML = entries.map((player, index) => {
    const rank = index + 1;
    const safety = Math.max(0, Math.min(100, player.safetyScore ?? 100));
    const trust = Math.max(0, Math.min(100, player.trustScore ?? 100));
    const status = player.status || "playing";
    const statusLabel = STATUS_LABELS[status] || status;
    const station = player.station && player.station !== "-" ? player.station : "—";

    return `
      <div class="leaderboard-row rank-${rank}">
        <div class="leaderboard-rank">#${rank}</div>
        <div class="leaderboard-player">
          <span class="player-name">${escapeHtml(player.name || "Anonymous")}</span>
          <span class="player-meta">${escapeHtml(player.role || "")} • ${escapeHtml(player.department || "")}</span>
        </div>
        <div class="leaderboard-station">📍 ${escapeHtml(station)}</div>
        <div class="leaderboard-bar-wrap">
          <div class="leaderboard-bar-label"><span>Safety</span><span>${safety}</span></div>
          <div class="leaderboard-bar"><div class="fill" style="width:${safety}%;background:linear-gradient(90deg,var(--accent-highlight),var(--accent-primary));"></div></div>
          <div class="leaderboard-bar-label"><span>Trust</span><span>${trust}%</span></div>
          <div class="leaderboard-bar"><div class="fill" style="width:${trust}%;background:linear-gradient(90deg,var(--accent-primary),var(--accent-success));"></div></div>
        </div>
        <div class="leaderboard-status status-${status}">${statusLabel}</div>
      </div>
    `;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

window.addEventListener("DOMContentLoaded", () => {
  if (typeof firebaseDb === "undefined" || !firebaseDb) {
    document.getElementById("leaderboard").innerHTML =
      '<div class="leaderboard-empty">⚠️ Could not connect to Firebase. Check js/firebase-config.js.</div>';
    return;
  }

  firebaseDb.ref("players").on("value", snapshot => {
    renderLeaderboard(snapshot.val());
  }, err => {
    console.error("Failed to read live scores", err);
    document.getElementById("leaderboard").innerHTML =
      '<div class="leaderboard-empty">⚠️ Failed to load live scores.</div>';
  });
});
