/* =====================================================================
   PAGE SCRIPT: history.html
   Groups every match in the selected event by date and renders one
   "day card" per date, each listing that day's matches with their
   round-by-round score, or a "To be played" tag if it hasn't happened.
   ===================================================================== */

(function () {
  const eventKey = getCurrentEventKey();
  renderNav('history');

  loadLeagueData().then((data) => {
    const matches = getAllMatchesForEvent(data, eventKey);
    const days = groupMatchesByDate(matches);
    const container = document.getElementById('history-content');

    if (days.length === 0) {
      container.innerHTML = '<div class="empty-state">No matches have been scheduled yet for this event.</div>';
      return;
    }

    container.innerHTML = days.map((day) => renderDayCard(data, eventKey, day)).join('');
  }).catch((err) => {
    console.error(err);
    document.getElementById('history-content').innerHTML =
      '<div class="empty-state">Could not load data/data.json. If you are opening this file directly ' +
      'from your computer (file://), most browsers block that — run a local server or view it on GitHub Pages instead.</div>';
  });

  /** One card = one date, with every match played/scheduled that day. */
  function renderDayCard(data, eventKey, day) {
    const rows = day.matches.map((match) => renderMatchRow(data, eventKey, match)).join('');
    return `
      <div class="day-card">
        <div class="day-header">
          <span class="day-name">${day.day}</span>
          <span class="day-date">${formatDate(day.date)}</span>
        </div>
        ${rows}
      </div>
    `;
  }

  /** One row inside a day card: participant A, score, participant B. */
  function renderMatchRow(data, eventKey, match) {
    const result = computeMatchResult(match);
    const nameA = getParticipantName(data, eventKey, match.participants[0]);
    const nameB = getParticipantName(data, eventKey, match.participants[1]);

    const aIsWinner = result.complete && result.winnerIndex === 0;
    const bIsWinner = result.complete && result.winnerIndex === 1;

    // Middle column: either the round-by-round score pills, or a "to be played" tag.
    let centerHtml;
    if (match.played && match.rounds.length > 0) {
      const pills = match.rounds.map((round) => {
        const winnerSide = roundWinnerSide(round);
        const aWin = winnerSide === 'a' ? ' round-win' : '';
        const bWin = winnerSide === 'b' ? ' round-win' : '';
        return `<span class="round-pill${aWin}">${round.a}</span><span class="round-pill${bWin}">${round.b}</span>`;
      }).join('');
      centerHtml = `
        <div class="round-scores">${pills}</div>
        <div class="event-tag">${result.roundsWonA}-${result.roundsWonB} in rounds</div>
      `;
    } else {
      centerHtml = '<span class="pending-tag">To be played</span>';
    }

    return `
      <div class="match-row">
        <div class="match-side${aIsWinner ? ' winner' : ''}">
          <div class="side-name">${nameA}</div>
        </div>
        <div class="match-center">${centerHtml}</div>
        <div class="match-side right${bIsWinner ? ' winner' : ''}">
          <div class="side-name">${nameB}</div>
        </div>
      </div>
    `;
  }
})();
