/* =====================================================================
   PAGE SCRIPT: leaderboard.html
   Combines every division in the selected event into one ranked list.
   Ranking is by TOTAL POINTS = match league points + the division
   bonus described in js/data-engine.js (computeDivisionBonus). Ranks
   1-3 get a medal, both on the podium up top and next to their row
   further down the full list.
   ===================================================================== */

(function () {
  const eventKey = getCurrentEventKey();
  renderNav('leaderboard');

  // Medal emoji shown for ranks 1, 2, 3. Change these three characters
  // if you'd rather use text like "G" / "S" / "B" instead of emoji.
  const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

  loadLeagueData().then((data) => {
    const standings = computeEventLeaderboard(data, eventKey);

    renderPodium(standings);
    renderList(data, eventKey, standings);
  }).catch((err) => {
    console.error(err);
    document.getElementById('leaderboard-list').innerHTML =
      '<div class="empty-state">Could not load data/data.json. If you are opening this file directly ' +
      'from your computer (file://), most browsers block that — run a local server or view it on GitHub Pages instead.</div>';
  });

  /** Top-of-page podium: 3 spots, gold in the middle, silver left, bronze right (see CSS 'order'). */
  function renderPodium(standings) {
    const podiumEl = document.getElementById('podium');
    const top3 = standings.slice(0, 3);

    if (top3.length === 0) {
      podiumEl.innerHTML = '';
      return;
    }

    const classNames = { 1: 'gold', 2: 'silver', 3: 'bronze' };
    podiumEl.innerHTML = top3.map((row) => `
      <div class="podium-spot ${classNames[row.rank]}">
        <div class="medal">${MEDALS[row.rank]}</div>
        <div class="p-name">${row.name}</div>
        <div class="p-sub">${row.divisionName}</div>
        <div class="p-points">${row.totalPoints} pts</div>
      </div>
    `).join('');
  }

  /** Full ranked list underneath the podium, including ranks 4+. */
  function renderList(data, eventKey, standings) {
    const listEl = document.getElementById('leaderboard-list');

    if (standings.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No results yet for this event.</div>';
      return;
    }

    listEl.innerHTML = standings.map((row) => {
      const medal = MEDALS[row.rank] ? `${MEDALS[row.rank]} ` : '';
      // Show the bonus breakdown so it's clear where the total came from,
      // e.g. "8 match pts + 2 division bonus". Remove this span if you'd
      // rather just show the plain total with no explanation.
      const bonusNote = row.divisionBonus > 0
        ? `${row.leaguePoints} match + ${row.divisionBonus} division bonus`
        : `${row.leaguePoints} match pts`;

      return `
        <div class="lb-row">
          <div class="lb-rank">${medal}${row.rank}</div>
          <div class="lb-name-block">
            <div class="lb-name">${row.name}</div>
            <div class="lb-meta">${row.divisionName} &middot; ${row.wins}W-${row.losses}L &middot; ${bonusNote}</div>
          </div>
          <div class="lb-points">${row.totalPoints}</div>
        </div>
      `;
    }).join('');
  }
})();
