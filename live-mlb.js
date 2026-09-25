/**
 * SocialSoundSystem — Live MLB Data
 * Fetches today's schedule + current standings from the free MLB Stats API.
 * Runs on page load — updates TODAY_GAMES and all team W-L records,
 * then re-renders whichever view is active.
 *
 * No API key. No auth. Fully CORS-open.
 */
(async function liveMLB() {

  // ET date → YYYY-MM-DD
  const now = new Date();
  const etOffset = -4; // ET is UTC-4 (EDT) or UTC-5 (EST)
  const etNow = new Date(now.getTime() + (etOffset * 60 + now.getTimezoneOffset()) * 60000);
  const today = `${etNow.getFullYear()}-${String(etNow.getMonth()+1).padStart(2,'0')}-${String(etNow.getDate()).padStart(2,'0')}`;
  const season = etNow.getFullYear();

  // Build MLB numeric team ID → app slug map from the existing T array
  const midToSlug = {};
  T.forEach(t => { midToSlug[t.mid] = t.i; });

  // ── Helpers ──────────────────────────────────────────────────────────────

  function etTime(isoStr) {
    return new Date(isoStr).toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }) + ' ET';
  }

  function tvNets(broadcasts) {
    return (broadcasts || [])
      .filter(b => b.type === 'TV')
      .map(b => b.name)
      .slice(0, 2)
      .join('/');
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────

  try {
    const [stRes, schRes] = await Promise.all([
      fetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${season}&hydrate=team`),
      fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=team,probablePitcher,linescore,broadcasts(all)`),
    ]);

    // ── Standings → update every team's W-L ──────────────────────────────
    if (stRes.ok) {
      const st = await stRes.json();
      (st.records || []).forEach(div => {
        (div.teamRecords || []).forEach(tr => {
          const slug = midToSlug[tr.team.id];
          if (!slug) return;
          if (TM[slug]) { TM[slug].w = tr.wins; TM[slug].l = tr.losses; }
          const t = T.find(x => x.i === slug);
          if (t)         { t.w = tr.wins; t.l = tr.losses; }
        });
      });
    }

    // ── Schedule → replace TODAY_GAMES ───────────────────────────────────
    if (schRes.ok) {
      const sch   = await schRes.json();
      const games = sch.dates?.[0]?.games || [];

      const newGames = games.map(g => {
        const awaySlug = midToSlug[g.teams.away.team.id];
        const homeSlug = midToSlug[g.teams.home.team.id];
        if (!awaySlug || !homeSlug) return null;

        const status = g.status?.abstractGameState; // 'Preview' | 'Live' | 'Final'

        return {
          away:       awaySlug,
          home:       homeSlug,
          time:       etTime(g.gameDate),
          tv:         tvNets(g.broadcasts),
          awayP:      g.teams.away.probablePitcher?.fullName || 'TBD',
          homeP:      g.teams.home.probablePitcher?.fullName || 'TBD',
          status,
          awayScore:  g.teams.away.score ?? null,
          homeScore:  g.teams.home.score ?? null,
          inning:     g.linescore?.currentInning     || null,
          inningHalf: g.linescore?.inningHalf        || null,
        };
      }).filter(Boolean);

      // Mutate TODAY_GAMES in place — it's a const but arrays are mutable
      TODAY_GAMES.splice(0, TODAY_GAMES.length, ...newGames);

      // Update the "Games Today" date header
      const dateEl = document.getElementById('games-date');
      if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          timeZone: 'America/New_York',
        });
      }

      // Update the standings "last updated" line
      const stdDate = document.getElementById('std-date');
      if (stdDate) stdDate.textContent = 'Updated ' + new Date().toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York',
      });
    }

    // ── Re-render everything ──────────────────────────────────────────────
    // Always pre-render both so data is fresh when user navigates to either tab
    if (typeof renderGames === 'function')     renderGames();
    if (typeof renderStandings === 'function') renderStandings();

    // ── Post-render: overlay live scores on game cards ────────────────────
    if (TODAY_GAMES.some(g => g.status === 'Live' || g.status === 'Final')) {
      document.querySelectorAll('.game-card').forEach((card, i) => {
        const g = TODAY_GAMES[i];
        if (!g || g.awayScore == null) return;

        const isFinal = g.status === 'Final';
        const isLive  = g.status === 'Live';

        const recs = card.querySelectorAll('.game-rec');
        if (recs[0]) recs[0].textContent = g.awayScore;
        if (recs[1]) recs[1].textContent = g.homeScore;

        const timeEl = card.querySelector('.game-time');
        if (timeEl) {
          if (isFinal) {
            timeEl.innerHTML = '🏁 FINAL';
            timeEl.style.color = 'var(--accent, #3DC8D4)';
          } else if (isLive) {
            const half = g.inningHalf === 'Top' ? '▲' : '▼';
            timeEl.innerHTML = `🔴 LIVE ${half}${g.inning}`;
            timeEl.style.color = '#ff4757';
          }
        }
      });
    }

    console.log(`✅ Live MLB data: ${TODAY_GAMES.length} games · standings updated`);

  } catch (e) {
    console.warn('⚠️ MLB Stats API unavailable — using baked-in data:', e.message);
  }

})();