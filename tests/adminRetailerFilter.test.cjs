const test = require('node:test');
const assert = require('node:assert/strict');
const { sourceModule } = require('./helpers/sourceModule.cjs');
const helpers = sourceModule('src/utils/adminScreenHelpers.ts', {
  '../state/adminStore': require('../.tmp-tests/state/adminStore.js'),
  './businessDateTime': require('../.tmp-tests/utils/businessDateTime.js'),
  './storeVisibility': require('../.tmp-tests/utils/storeVisibility.js'),
  './adminCsvFiles': {}, './productCsvHeaders': {},
}, { process: { env: {} } });
const useDashboard = sourceModule('src/hooks/useAdminDashboardData.ts', {
  react: { useMemo: (factory) => factory() },
  '../utils/adminScreenHelpers': helpers,
  '../utils/adminProductSaleFilter': require('../.tmp-tests/utils/adminProductSaleFilter.js'),
  '../utils/adminValidation': require('../.tmp-tests/utils/adminValidation.js'),
  '../utils/productDataHealth': require('../.tmp-tests/utils/productDataHealth.js'),
  '../utils/productNames': require('../.tmp-tests/utils/productNames.js'),
  '../utils/saleSession': require('../.tmp-tests/utils/saleSession.js'),
}).default;
const store = (id, brand) => ({ id, brand, name: 'Burnaby', area: 'Burnaby', latitude: 49.25,
  longitude: -123, address: '1 Main St', price_note: null, store_type: 'grocery', is_active: true });
const stores = [store('safeway', 'Safeway'), store('save-on', 'Save on Foods'),
  store('superstore', 'Real Canadian Superstore'), store('h-mart', 'H-Mart')];
const product = { id: 'milk', english_name: 'Milk', korean_name: '', brand: null, gtin: null,
  category: 'Dairy', unit: '1 L', created_at: '2026-10-08T00:00:00Z' };
const price = { id: 'price', product_id: 'milk', store_id: 'h-mart', store_brand: 'H-Mart',
  store_name: 'Burnaby', price: 3.99, valid_from: '2026-10-01T00:00:00Z', valid_to: null,
  observed_at: '2026-10-01T00:00:00Z', created_at: '2026-10-01T00:00:00Z' };
function dashboard(overrides = {}) {
  return useDashboard({ products: [product], stores, prices: [price], auditLogs: [],
    storeSearchQuery: '', storeBrandFilter: 'all', storeStatusFilter: 'all', storeTypeFilter: 'all',
    selectedStoreMapId: null, productSearchQuery: '', productCategoryFilter: 'all',
    productBrandFilter: 'all', productSaleDateFilter: '', productOnSaleOnly: false,
    productSort: 'latest', flyerSelectedRows: 0, ...overrides });
}

test('Products retailer options include registered chains even without any product prices', () => {
  assert.deepEqual(Array.from(dashboard().productBrandFilterOptions),
    ['H-Mart', 'Real Canadian Superstore', 'Safeway', 'Save on Foods']);
  assert.deepEqual(Array.from(dashboard({ prices: [] }).productBrandFilterOptions),
    ['H-Mart', 'Real Canadian Superstore', 'Safeway', 'Save on Foods']);
});

test('options preserve price-only retailers and deduplicate registered branch brands', () => {
  const result = dashboard({ stores: [...stores, store('safeway-2', ' safeway ')],
    prices: [...[price], { ...price, id: 'legacy-price', store_id: 'legacy', store_brand: 'Legacy Mart' }] });
  assert.equal(result.productBrandFilterOptions.filter((brand) => brand.toLowerCase() === 'safeway').length, 1);
  assert.ok(result.productBrandFilterOptions.includes('Legacy Mart'));
});

test('choosing a retailer filters by actual linked prices and allows an empty result', () => {
  assert.equal(dashboard({ productBrandFilter: 'Safeway' }).filteredProducts.length, 0);
  assert.equal(dashboard({ productBrandFilter: 'H-Mart' }).filteredProducts.length, 1);
  assert.equal(dashboard({ prices: [{ ...price, store_id: 'safeway' }],
    productBrandFilter: 'Safeway' }).filteredProducts.length, 1);
});
