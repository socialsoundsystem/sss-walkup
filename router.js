/**
 * SocialSoundSystem — Client-Side Router (debug build)
 */
(function () {

  let _initialLoad = true;

  function setupRouter() {
    console.log('🔀 Router: setupRouter running');
    console.log('🔀 Router: pathname =', window.location.pathname);
    console.log('🔀 Router: typeof showView =', typeof showView);
    console.log('🔀 Router: typeof openTeam =', typeof openTeam);
    console.log('🔀 Router: P.length =', typeof P !== 'undefined' ? P.length : 'UNDEFINED');
    console.log('🔀 Router: TM keys =', typeof TM !== 'undefined' ? Object.keys(TM).length : 'UNDEFINED');

    const _showView    = window.showView;
    const _openTeam    = window.openTeam;
    const _openMatchup = window.openMatchup;

    function viewToPath(v) {
      if (v === 'teams')  return '/';
      if (v === 'chart')  return '/charts';
      if (v === 'detail') return window.location.pathname;
      return '/' + v;
    }

    window.showView = function (v) {
      console.log('🔀 Router: showView called with', v, '| _initialLoad =', _initialLoad);
      const onSpecialPage = window.location.pathname.startsWith('/team/') ||
                            window.location.pathname.startsWith('/matchup/');
      // Block anything that would reset a team/matchup page during initial load
      if (_initialLoad && onSpecialPage && v !== 'detail') {
        console.log('🔀 Router: BLOCKED showView(' + v + ') on special page during initial load');
        return;
      }
      if (!_initialLoad) {
        const path = viewToPath(v);
        if (window.location.pathname !== path) {
          history.pushState({ type: 'view', view: v }, '', path);
        }
      }
      _showView(v);
    };

    window.openTeam = function (tid) {
      console.log('🔀 Router: openTeam called with', tid);
      if (!_initialLoad) {
        const path = '/team/' + tid;
        if (window.location.pathname !== path) {
          history.pushState({ type: 'team', team: tid }, '', path);
        }
      }
      _openTeam(tid);
    };

    window.openMatchup = function (awayId, homeId) {
      if (!_initialLoad) {
        const path = '/matchup/' + awayId + '/' + homeId;
        if (window.location.pathname !== path) {
          history.pushState({ type: 'matchup', away: awayId, home: homeId }, '', path);
        }
      }
      _openMatchup(awayId, homeId);
    };

    window.goBack = function () { history.back(); };

    window.addEventListener('popstate', function (e) {
      const s = e.state;
      if (!s)               { _showView('teams');               return; }
      if (s.type === 'view')    _showView(s.view);
      if (s.type === 'team')    _openTeam(s.team);
      if (s.type === 'matchup') _openMatchup(s.away, s.home);
    });

    // Parse URL on direct load
    const parts = window.location.pathname.split('/').filter(Boolean);
    console.log('🔀 Router: parts =', parts);

    if (!parts.length) {
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
      console.log('🔀 Router: calling _openTeam with', parts[1]);
      history.replaceState({ type: 'team', team: parts[1] }, '', '/team/' + parts[1]);
      _openTeam(parts[1]);
      console.log('🔀 Router: _openTeam done');

    } else if (parts[0] === 'matchup' && parts[1] && parts[2]) {
      history.replaceState({ type: 'matchup', away: parts[1], home: parts[2] }, '', '/matchup/' + parts[1] + '/' + parts[2]);
      _openMatchup(parts[1], parts[2]);
    }

    setTimeout(() => {
      _initialLoad = false;
      console.log('🔀 Router: _initialLoad = false, router fully active');
    }, 500);

    console.log('🔀 Router: setup complete');
  }

  if (document.readyState === 'complete') {
    console.log('🔀 Router: document already complete, running in 200ms');
    setTimeout(setupRouter, 200);
  } else {
    console.log('🔀 Router: waiting for load event');
    window.addEventListener('load', function () {
      setTimeout(setupRouter, 200);
    });
  }

})();