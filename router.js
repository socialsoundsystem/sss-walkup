/**
 * SocialSoundSystem — Client-Side Router
 * Adds clean URLs to the existing SPA without modifying index.html logic.
 *
 * Routes:
 *   /              → Teams
 *   /games         → Games Today
 *   /charts        → Charts
 *   /standings     → Standings
 *   /team/:slug    → Team detail (e.g. /team/dodgers)
 *   /matchup/:away/:home → Matchup detail
 */
(function() {

  // Wait for page functions to be defined
  function init() {
    if (typeof showView === 'undefined' || typeof openTeam === 'undefined') {
      setTimeout(init, 50);
      return;
    }
    setupRouter();
  }

  function setupRouter() {
    // ── Store originals ─────────────────────────────────────────────────────
    const _showView    = window.showView;
    const _openTeam    = window.openTeam;
    const _openMatchup = window.openMatchup;
    const _goBack      = window.goBack;

    // ── URL helpers ──────────────────────────────────────────────────────────
    function viewToPath(v) {
      if (v === 'teams')    return '/';
      if (v === 'chart')    return '/charts';
      return '/' + v; // games, standings, detail
    }

    // ── Wrap showView ────────────────────────────────────────────────────────
    window.showView = function(v) {
      const path = viewToPath(v);
      // Only push state if the path actually changed
      if (window.location.pathname !== path) {
        history.pushState({ type: 'view', view: v }, '', path);
      }
      _showView(v);
    };

    // ── Wrap openTeam ────────────────────────────────────────────────────────
    window.openTeam = function(tid) {
      const path = '/team/' + tid;
      if (window.location.pathname !== path) {
        history.pushState({ type: 'team', team: tid }, '', path);
      }
      _openTeam(tid);
    };

    // ── Wrap openMatchup ─────────────────────────────────────────────────────
    window.openMatchup = function(awayId, homeId) {
      const path = '/matchup/' + awayId + '/' + homeId;
      if (window.location.pathname !== path) {
        history.pushState({ type: 'matchup', away: awayId, home: homeId }, '', path);
      }
      _openMatchup(awayId, homeId);
    };

    // ── Wrap goBack to use browser history ───────────────────────────────────
    window.goBack = function() {
      history.back();
    };

    // ── Handle browser back / forward ────────────────────────────────────────
    window.addEventListener('popstate', function(e) {
      const s = e.state;
      if (!s) { _showView('teams'); return; }
      if (s.type === 'view')    _showView(s.view);
      if (s.type === 'team')    _openTeam(s.team);
      if (s.type === 'matchup') _openMatchup(s.away, s.home);
    });

    // ── Parse URL on direct load ─────────────────────────────────────────────
    const parts = window.location.pathname.split('/').filter(Boolean);

    if (!parts.length) {
      // / → Teams (already the default, just set state)
      history.replaceState({ type: 'view', view: 'teams' }, '', '/');

    } else if (parts[0] === 'games') {
      history.replaceState({ type: 'view', view: 'games' }, '', '/games');
      _showView('games');

    } else if (parts[0] === 'charts') {
      history.replaceState({ type: 'view', view: 'chart' }, '', '/charts');
      _showView('chart');

    } else if (parts[0] === 'standings') {
      history.replaceState({ type: 'view', view: 'standings' }, '', '/standings');
      _showView('standings');

    } else if (parts[0] === 'team' && parts[1]) {
      history.replaceState({ type: 'team', team: parts[1] }, '', '/team/' + parts[1]);
      _openTeam(parts[1]);

    } else if (parts[0] === 'matchup' && parts[1] && parts[2]) {
      history.replaceState({ type: 'matchup', away: parts[1], home: parts[2] }, '', '/matchup/' + parts[1] + '/' + parts[2]);
      _openMatchup(parts[1], parts[2]);
    }

    console.log('✅ Router ready — path:', window.location.pathname);
  }

  init();
})();
