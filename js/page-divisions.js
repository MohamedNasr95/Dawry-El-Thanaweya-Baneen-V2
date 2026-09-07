/* =====================================================================
   PAGE SCRIPT: divisions.html
   Draws one table per division for whichever event is selected
   (?event=singles / doubles / mixed). All the maths comes from
   js/data-engine.js — this file only builds the HTML.
   ===================================================================== */

(function () {
  const eventKey = getCurrentEventKey();
  renderNav('divisions');

  loadLeagueData().then((data) => {
    const event = data.events[eventKey];
    document.getElementById('event-title').textContent = event.label + ' — Division Tables';

    const container = document.getElementById('divisions-content');

    if (!event.divisions || event.divisions.length === 0) {
      container.innerHTML = '<div class="empty-state">No divisions have been added yet for this event.</div>';
      return;
    }

    container.innerHTML = event.divisions.map((division) => renderDivisionCard(data, eventKey, division)).join('');
  }).catch((err) => {
    console.error(err);
    document.getElementById('divisions-content').innerHTML =
      '<div class="empty-state">Could not load data/data.json. If you are opening this file directly ' +
      'from your computer (file://), most browsers block that — run a local server or view it on GitHub Pages instead.</div>';
  });

  /**
   * Builds one <div class="division-card"> containing the standings table.
   * COLUMN ORDER matches the brief: ID, Name, Rank, Points, Wins, Losses,
   * Rounds Won, Rounds Lost, Points Gained, Points Lost.
   * To add/remove/reorder a column, edit BOTH the <thead> and the row-builder below.
   */
  function renderDivisionCard(data, eventKey, division) {
    const standings = computeDivisionStandings(data, eventKey, division);

    const rows = standings.map((row) => `
      <tr>
        <td class="name-cell">
          <span class="player-id">${row.id.toUpperCase()}</span><br>
          <span class="player-name">${row.name}</span>
        </td>
        <td class="rank-cell">${ordinal(row.rank)}</td>
        <td>${row.leaguePoints}</td>
        <td>${row.wins}</td>
        <td>${row.losses}</td>
        <td>${row.roundsWon}</td>
        <td>${row.roundsLost}</td>
        <td>${row.pointsFor}</td>
        <td>${row.pointsAgainst}</td>
      </tr>
    `).join('');

    return `
      <div class="division-card">
        <div class="division-title">
          <h2>${division.name}</h2>
          <span class="count">${division.participants.length} ${eventKey === 'singles' ? 'players' : 'teams'}</span>
        </div>
        <div class="table-scroll">
          <table class="standings">
            <thead>
              <tr>
                <th class="name-cell">ID / Name</th>
                <th>Rank</th>
                <th>Points</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Rounds Won</th>
                <th>Rounds Lost</th>
                <th>Pts Gained</th>
                <th>Pts Lost</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  /** Turns 1,2,3,4 into "1st","2nd","3rd","4th" for the Rank column. */
  function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
})();
