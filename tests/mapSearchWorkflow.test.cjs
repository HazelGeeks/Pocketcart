const test = require('node:test');
const assert = require('node:assert/strict');
const { mapHookHarness } = require('./helpers/mapHookHarness.cjs');
const stores = [
  { id: 'a', brand: 'H Mart', name: 'Downtown', area: 'Vancouver', address: '123 Robson Street', latitude: 49.28, longitude: -123.12 },
  { id: 'b', brand: 'T&T', name: 'Richmond', area: 'Richmond', address: '456 River Road', latitude: 49.18, longitude: -123.13 },
];
const point = { latitude: 49.18, longitude: -123.13, label: 'Richmond, BC, Canada' };
function setup(search = async () => [point], listStores) {
  let loads = 0;
  const hook = mapHookHarness({ search, listStores: listStores ?? (async () => { loads++; return { data: stores, error: null }; }) });
  const options = { activeTab: 'map', favoriteStoreIds: [], onboardingState: { locationMode: 'share', locationLatitude: 49.28, locationLongitude: -123.12, postalCode: null }, onOpenMap() {}, onHideOnboarding() {}, showToast() {} };
  return { hook, options, render: () => hook.render(options), loads: () => loads };
}
test('address search uses street field, does not refetch while typing, and focuses its result', async () => {
  const h = setup(); let map = await h.render();
  map.setQuery('456 river'); map = await h.render();
  assert.equal(map.filteredStores.length, 1); assert.equal(map.filteredStores[0].id, 'b');
  map.submitSearch(); map = await h.render();
  assert.equal(map.region.latitude, stores[1].latitude); assert.equal(h.loads(), 1);
  h.hook.unmount();
});
test('choosing a location moves the map and recalculates distance without filtering by address label', async () => {
  const h = setup(); let map = await h.render();
  map.setQuery('V6X 1A1'); map = await h.render(); map.submitSearch(); map = await h.render();
  assert.equal(map.locationResults.length, 0);
  assert.equal(map.searchOrigin.label, point.label);
  assert.equal(map.region.latitude, point.latitude); assert.equal(map.filteredStores.length, 2);
  assert.equal(map.filteredStores[0].id, 'b'); assert.equal(map.filteredStores[0].distance_km, 0);
  map.focusUserLocation(49.28, -123.12); map = await h.render();
  assert.equal(map.query, ''); assert.equal(map.searchOrigin, null); assert.equal(map.region.latitude, 49.28);
  h.hook.unmount();
});
test('stale location responses cannot override a newer search or a clear action', async () => {
  const pending = [];
  const h = setup(() => new Promise((resolve) => pending.push(resolve)));
  let map = await h.render(); map.setQuery('first'); map = await h.render(); map.searchLocation();
  map.setQuery('second'); map = await h.render(); map.searchLocation();
  pending[1]([point]); map = await h.render(); assert.equal(map.searchOrigin.label, point.label);
  pending[0]([{ ...point, label: 'Old' }]); map = await h.render(); assert.equal(map.searchOrigin.label, point.label);
  map.searchLocation(); map.setQuery(''); pending[2]([point]); map = await h.render();
  assert.equal(map.searchOrigin, null);
  assert.equal(map.locationResults.length, 0); assert.equal(map.searchingLocation, false);
  h.hook.unmount();
});
test('clearing a saved postal search stays cleared across map visits', async () => {
  const h = setup(); h.options.onboardingState = { locationMode: 'postal', postalCode: 'V6X1A1', locationLatitude: null, locationLongitude: null };
  let map = await h.render(); assert.equal(map.searchOrigin.label, point.label);
  map.setQuery(''); map = await h.render(); assert.equal(map.query, '');
  h.options.activeTab = 'home'; await h.render(); h.options.activeTab = 'map'; map = await h.render();
  assert.equal(map.query, ''); h.hook.unmount();
});
test('lookup failures and empty results produce useful feedback and stop loading', async () => {
  let fail = true; const h = setup(async () => { if (fail) throw Error('Service unavailable'); return []; });
  let map = await h.render(); map.setQuery('missing'); map = await h.render(); map.searchLocation(); map = await h.render();
  assert.equal(map.message, 'Service unavailable'); assert.equal(map.searchingLocation, false);
  fail = false; map.searchLocation(); map = await h.render(); assert.match(map.message, /Location not found/);
  h.hook.unmount();
});
test('old store requests cannot overwrite a later map visit', async () => {
  const pending = []; const h = setup(undefined, () => new Promise(resolve => pending.push(resolve)));
  await h.render(); h.options.activeTab = 'home'; await h.render(); h.options.activeTab = 'map'; await h.render();
  pending[1]({ data: [stores[1]], error: null }); let map = await h.render(); assert.equal(map.filteredStores[0].id, 'b');
  pending[0]({ data: [stores[0]], error: null }); map = await h.render(); assert.equal(map.filteredStores[0].id, 'b');
  h.hook.unmount();
});

test('submitting an address moves to its coordinates even if a store address matches', async () => {
  const destination = { latitude: 49.25, longitude: -123.08, label: '456 River Road' };
  const h = setup(async () => [destination]);
  let map = await h.render();
  const movements = [];
  map.mapRef.current = { animateToRegion: region => movements.push(region) };
  map.setQuery('456 River'); map = await h.render(); map.submitSearch(); map = await h.render();
  assert.equal(map.searchOrigin.label, destination.label);
  assert.equal(map.region.latitude, destination.latitude);
  assert.equal(movements.at(-1).latitude, destination.latitude);
  assert.equal(map.filteredStores.length, 2);
  h.hook.unmount();
});
test('ambiguous locations remain selectable, while retailer searches focus the store', async () => {
  let searches = 0;
  const h = setup(async () => { searches++; return [point, { ...point, latitude: 48, label: 'Other Richmond' }]; });
  let map = await h.render(); map.setQuery('H Mart'); map = await h.render(); map.submitSearch(); map = await h.render();
  assert.equal(searches, 0); assert.equal(map.focusedStoreId, 'a');
  map.setQuery('Richmond'); map = await h.render(); map.submitSearch(); map = await h.render();
  assert.equal(map.locationResults.length, 2); assert.equal(map.searchOrigin, null);
  map.selectLocation(map.locationResults[1]); map = await h.render(); assert.equal(map.region.latitude, 48);
  h.hook.unmount();
});
