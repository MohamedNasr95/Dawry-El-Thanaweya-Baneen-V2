/* =====================================================================
   DATA ENGINE
   =====================================================================
   This file is the "brain" of the site. It loads data/data.json and
   turns the raw players/teams/matches into the numbers every page
   shows (wins, losses, rounds, points, ranks, leaderboards...).

   YOU DO NOT NEED TO EDIT THIS FILE to update the league — just edit
   data/data.json. Only open this file if you want to change HOW
   something is calculated, for example:
     - how many league points a win/loss is worth  -> see computeMatchResult()
     - how ties in the standings are broken         -> see sortStandings()
     - how a team's display name is built           -> see getParticipantName()
   ===================================================================== */

// Cache so we only fetch the JSON file once per page load.
let _dataPromise = null;

/**
 * Loads data/data.json (relative to the page). Every page calls this
 * once at the top of its script.
 */
function loadLeagueData() {
  if (!_dataPromise) {
    _dataPromise = fetch('data/data.json')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load data/data.json (' + res.status + ')');
        return res.json();
      });
  }
  return _dataPromise;
}

/** Find a player object by id. Returns null if not found. */
function getPlayer(data, playerId) {
  return data.players.find((p) => p.id === playerId) || null;
}

/**
 * A "participant" in a division is either:
 *   - a player id (singles), or
 *   - a team id (doubles / mixed)
 * This function figures out which one it is and returns a display name.
 * EDIT the team-name line below if you want a different naming style
 * for doubles/mixed teams (e.g. "Omar & Nour" vs "Omar / Nour").
 */
function getParticipantName(data, eventKey, participantId) {
  if (eventKey === 'singles') {
    const player = getPlayer(data, participantId);
    return player ? player.name : participantId;
  }
  const team = (data.teams[eventKey] || []).find((t) => t.id === participantId);
  if (!team) return participantId;
  if (team.name && team.name.trim() !== '') return team.name;
  const names = team.playerIds.map((pid) => {
    const p = getPlayer(data, pid);
    return p ? p.name : pid; // first names only, e.g. "Omar & Nour"
  });
  return names.join(' & ');
}

/** Returns the id of the player who wins a single round, or null if it's a tie score. */
function roundWinnerSide(round) {
  if (round.a > round.b) return 'a';
  if (round.b > round.a) return 'b';
  return null;
}

/**
 * Works out the result of one match from its list of rounds.
 * A match is BEST OF 3 rounds — first side to win 2 rounds wins the match.
 * Returns an object with everything a table/history card needs.
 */
function computeMatchResult(match) {
  let roundsWonA = 0;
  let roundsWonB = 0;
  let pointsA = 0;
  let pointsB = 0;

  match.rounds.forEach((round) => {
    pointsA += round.a;
    pointsB += round.b;
    const winner = roundWinnerSide(round);
    if (winner === 'a') roundsWonA++;
    if (winner === 'b') roundsWonB++;
  });

  // A match is only "complete" once one side has reached 2 round wins.
  const complete = match.played && (roundsWonA === 2 || roundsWonB === 2);
  let winnerIndex = null; // 0 = participants[0] won, 1 = participants[1] won
  if (complete) winnerIndex = roundsWonA > roundsWonB ? 0 : 1;

  return { roundsWonA, roundsWonB, pointsA, pointsB, complete, winnerIndex };
}

/**
 * Builds the full standings table for one division: every participant's
 * wins/losses/rounds/points, sorted into rank order.
 *
 * TIE-BREAK ORDER (change the sort compare function below to reorder):
 *   1. League points (settings.pointsForWin/pointsForLoss)
 *   2. Round difference (rounds won - rounds lost)
 *   3. Point difference (points scored - points conceded)
 */
function computeDivisionStandings(data, eventKey, division) {
  const stats = {};
  division.participants.forEach((id) => {
    stats[id] = {
      id,
      name: getParticipantName(data, eventKey, id),
      played: 0, wins: 0, losses: 0,
      roundsWon: 0, roundsLost: 0,
      pointsFor: 0, pointsAgainst: 0,
      leaguePoints: 0,
    };
  });

  division.matches.forEach((match) => {
    const result = computeMatchResult(match);
    if (!result.complete) return; // skip matches that haven't been played/finished

    const [idA, idB] = match.participants;
    const sA = stats[idA];
    const sB = stats[idB];
    if (!sA || !sB) return; // guards against a typo'd id in the JSON

    sA.played++; sB.played++;
    sA.roundsWon += result.roundsWonA; sA.roundsLost += result.roundsWonB;
    sB.roundsWon += result.roundsWonB; sB.roundsLost += result.roundsWonA;
    sA.pointsFor += result.pointsA; sA.pointsAgainst += result.pointsB;
    sB.pointsFor += result.pointsB; sB.pointsAgainst += result.pointsA;

    const winPts = data.settings.pointsForWin;
    const losePts = data.settings.pointsForLoss;

    if (result.winnerIndex === 0) {
      sA.wins++; sB.losses++;
      sA.leaguePoints += winPts; sB.leaguePoints += losePts;
    } else {
      sB.wins++; sA.losses++;
      sB.leaguePoints += winPts; sA.leaguePoints += losePts;
    }
  });

  const list = Object.values(stats);
  sortStandings(list);
  list.forEach((row, i) => { row.rank = i + 1; });
  return list;
}

/**
 * Shared sort used by division tables AND the leaderboard.
 * `field` is which "points" number decides the ranking:
 *   - 'leaguePoints' for the division tables (match points only)
 *   - 'totalPoints'  for the leaderboard (match points + division bonus, see below)
 * Ties are always broken the same way: round difference, then point difference.
 */
function sortStandings(list, field) {
  field = field || 'leaguePoints';
  list.sort((a, b) => {
    if (b[field] !== a[field]) return b[field] - a[field];
    const roundDiffA = a.roundsWon - a.roundsLost;
    const roundDiffB = b.roundsWon - b.roundsLost;
    if (roundDiffB !== roundDiffA) return roundDiffB - roundDiffA;
    const ptsDiffA = a.pointsFor - a.pointsAgainst;
    const ptsDiffB = b.pointsFor - b.pointsAgainst;
    return ptsDiffB - ptsDiffA;
  });
}

/**
 * DIVISION BONUS POINTS (for the leaderboard only)
 * ------------------------------------------------
 * The brief: players in a higher division should get a bonus added to
 * their leaderboard total, on a sliding scale — the LAST (bottom)
 * division gets +0, the one above it gets +1, the one above that +2,
 * and so on. This is fully adaptable: it re-calculates from however
 * many divisions the event actually has, so adding or removing a
 * division automatically reshuffles the bonus scale — you never have
 * to renumber anything by hand.
 *
 * IMPORTANT — division order matters: in data/data.json, list each
 * event's divisions from STRONGEST/TOP first to WEAKEST/LAST last
 * (e.g. "Division A" then "Division B" then "Division C"). The bonus
 * is worked out from that order.
 *
 * Want a bigger/smaller gap between divisions? Change
 * settings.divisionBonusIncrement in data.json (default 1).
 * Want to turn this off completely? Set it to 0.
 */
function computeDivisionBonus(data, divisionIndex, totalDivisions) {
  const increment = (data.settings && typeof data.settings.divisionBonusIncrement === 'number')
    ? data.settings.divisionBonusIncrement
    : 2;
  const stepsFromLast = (totalDivisions - 1) - divisionIndex; // last division = 0 steps
  return stepsFromLast * increment;
}

/**
 * Builds the leaderboard for one event: every participant across every
 * division in that event, combined into one ranked list.
 */
function computeEventLeaderboard(data, eventKey) {
  const event = data.events[eventKey];
  const totalDivisions = event.divisions.length;
  const combined = {};

  event.divisions.forEach((division, divisionIndex) => {
    const bonus = computeDivisionBonus(data, divisionIndex, totalDivisions);
    const rows = computeDivisionStandings(data, eventKey, division);
    rows.forEach((row) => {
      combined[row.id] = {
        ...row,
        divisionName: division.name,
        divisionBonus: bonus,
        totalPoints: row.leaguePoints + bonus,
      };
    });
  });

  const list = Object.values(combined);
  sortStandings(list, 'totalPoints');
  list.forEach((row, i) => { row.rank = i + 1; });
  return list;
}

/** Flattens every match in an event into one list, each tagged with its division name. */
function getAllMatchesForEvent(data, eventKey) {
  const event = data.events[eventKey];
  const all = [];
  event.divisions.forEach((division) => {
    division.matches.forEach((match) => {
      all.push({ ...match, divisionName: division.name });
    });
  });
  return all;
}

/** Groups a list of matches by their date, sorted chronologically. */
function groupMatchesByDate(matches) {
  const groups = {};
  matches.forEach((m) => {
    if (!groups[m.date]) groups[m.date] = { date: m.date, day: m.day, matches: [] };
    groups[m.date].matches.push(m);
  });
  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
}

/** Pretty-prints an ISO date ("2026-09-11") as "11 Sep 2026". */
function formatDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d)) return isoDate;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
