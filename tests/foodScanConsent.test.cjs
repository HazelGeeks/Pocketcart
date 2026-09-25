const test = require('node:test');
const assert = require('node:assert/strict');
const { sourceModule } = require('./helpers/sourceModule.cjs');

test('Food Scan sends no photo until explicit OpenAI confirmation', async () => {
  let state = 0, dialog, requests = 0;
  const values = ['fresh', { uri: 'file://test.jpg', base64: 'test-image', mimeType: 'image/jpeg' }, null, false, false, null, null];
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    useRef: () => ({ current: null }), useState: () => [values[state++], () => {}], useCallback: fn => fn,
  };
  const dependencies = {
    react,
    'expo-camera': { CameraView: 'CameraView', useCameraPermissions: () => [{ granted: true }, () => {}] },
    'react-native': { ActivityIndicator: 'ActivityIndicator', Alert: { alert: (...args) => { dialog = args; } }, Image: 'Image', Linking: {}, Pressable: 'Pressable', Text: 'Text', View: 'View' },
    '../../hooks/useFoodScanProductLink': () => ({}),
    '../../screens/nativeAppStyles': { st: {} },
    '../../services/foodScan': { analyzeFoodPhoto: async () => { requests++; return {}; } },
    '../../shared/design/palette': { marketingPalette: {} },
    '../icons/AppIcon': { AppIcon: 'AppIcon' },
    './FoodScanModeSelector': { FoodScanModeSelector: 'Mode' },
    './FoodScanNotice': { FoodScanNotice: 'Notice' },
    './FoodScanResultSurface': { FoodScanResultSurface: 'Result' },
  };
  const { FoodScanPanel } = sourceModule('src/components/nativeApp/FoodScanPanel.tsx', dependencies);
  const tree = FoodScanPanel({ onOpenProduct() {} });
  const nodes = [];
  function visit(node) { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) return node.forEach(visit); nodes.push(node); node.children?.forEach(visit); }
  visit(tree);
  nodes.find(n => n.props?.accessibilityLabel === 'Analyze photo').props.onPress();
  assert.equal(requests, 0);
  assert.match(dialog[0], /OpenAI/);
  const cancel = dialog[2].find(b => b.style === 'cancel');
  cancel.onPress?.();
  assert.equal(requests, 0);
  dialog[2].find(b => b.text === 'Send and analyze').onPress();
  await Promise.resolve();
  assert.equal(requests, 1);
});
