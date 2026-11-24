/** Shared navigation model for the desktop rail and the mobile drawer.
 *  Per-site deep dives (scene, lenses, recovery, time series, sonification)
 *  now live inside the full-screen case file opened from the Atlas, so the
 *  landing navigation only lists the global sections. */
export const NAV_ITEMS = [
  { id: 'home', key: 'navbar.home', icon: 'home' },
  { id: 'demo', key: 'navbar.demo', icon: 'play' },
  { id: 'mission', key: 'navbar.mission', icon: 'info-sign' },
  { id: 'atlas', key: 'navbar.atlas', icon: 'map' },
  { id: 'game', key: 'navbar.game', icon: 'search' },
  { id: 'data', key: 'navbar.data', icon: 'database' },
  { id: 'team', key: 'navbar.team', icon: 'people' },
];