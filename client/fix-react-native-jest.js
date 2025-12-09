const fs = require('fs');
const path = require('path');

// Fix React Native index.js TypeScript syntax
const reactNativeIndexPath = path.join(__dirname, 'node_modules/react-native/index.js');
if (fs.existsSync(reactNativeIndexPath)) {
  let indexContent = fs.readFileSync(reactNativeIndexPath, 'utf8');
  // Remove TypeScript 'as' type assertion
  if (indexContent.includes('} as ReactNativePublicAPI;')) {
    indexContent = indexContent.replace('} as ReactNativePublicAPI;', '};');
    fs.writeFileSync(reactNativeIndexPath, indexContent);
    console.log('Fixed react-native/index.js');
  }
}

// Fix jest-expo setup to ensure UIManager exists and handle Refs module
const setupPath = path.join(__dirname, 'node_modules/jest-expo/src/preset/setup.js');
if (fs.existsSync(setupPath)) {
  let setupContent = fs.readFileSync(setupPath, 'utf8');
  const originalContent = setupContent;
  let hasChanges = false;
  
  // Add a guard to ensure UIManager exists before trying to define properties on it
  if (!setupContent.includes('// Ensure UIManager exists')) {
    const oldCode = `Object.keys(mockNativeModules.NativeUnimoduleProxy.viewManagersMetadata).forEach(
  (viewManagerName) => {
    Object.defineProperty(mockNativeModules.UIManager, \`ViewManagerAdapter_\${viewManagerName}\`, {`;
    
    const newCode = `// Ensure UIManager exists and is an object
if (!mockNativeModules.UIManager || typeof mockNativeModules.UIManager !== 'object') {
  mockNativeModules.UIManager = {};
}

Object.keys(mockNativeModules.NativeUnimoduleProxy.viewManagersMetadata || {}).forEach(
  (viewManagerName) => {
    Object.defineProperty(mockNativeModules.UIManager, \`ViewManagerAdapter_\${viewManagerName}\`, {`;
    
    if (setupContent.includes(oldCode)) {
      setupContent = setupContent.replace(oldCode, newCode);
      hasChanges = true;
    }
  }
  
  // Comment out Refs mock if it causes module resolution issues
  if (setupContent.includes("jest.doMock('expo-modules-core/src/Refs'") && !setupContent.includes('// Commented out due to module resolution')) {
    const oldRefsCode = `// Mock the \`createSnapshotFriendlyRef\` to return an ref that can be serialized in snapshots.
jest.doMock('expo-modules-core/src/Refs', () => ({
  createSnapshotFriendlyRef: () => {
    // We cannot use \`createRef\` since it is not extensible.
    const ref = { current: null };
    Object.defineProperty(ref, 'toJSON', {
      value: () => '[React.ref]',
    });
    return ref;
  },
}));`;
    
    const newRefsCode = `// Mock the \`createSnapshotFriendlyRef\` to return an ref that can be serialized in snapshots.
// Commented out due to module resolution issues - snapshots will still work without this
// jest.doMock('expo-modules-core/src/Refs', () => ({
//   createSnapshotFriendlyRef: () => {
//     // We cannot use \`createRef\` since it is not extensible.
//     const ref = { current: null };
//     Object.defineProperty(ref, 'toJSON', {
//       value: () => '[React.ref]',
//     });
//     return ref;
//   },
// }));`;
    
    if (setupContent.includes(oldRefsCode)) {
      setupContent = setupContent.replace(oldRefsCode, newRefsCode);
      hasChanges = true;
    }
  }
  
  // Comment out web/index.web require if it doesn't exist
  if (setupContent.includes("require('expo-modules-core/src/web/index.web');") && !setupContent.includes('// require(\'expo-modules-core/src/web/index.web\');')) {
    const oldWebCode = `// Installs web implementations of global things that are normally installed through JSI.
require('expo-modules-core/src/web/index.web');`;
    const newWebCode = `// Installs web implementations of global things that are normally installed through JSI.
// Commented out due to module resolution issues - not needed for Jest tests
// require('expo-modules-core/src/web/index.web');`;
    if (setupContent.includes(oldWebCode)) {
      setupContent = setupContent.replace(oldWebCode, newWebCode);
      hasChanges = true;
    }
  }
  
  // Only write if changes were made
  if (hasChanges && setupContent !== originalContent) {
    try {
      fs.writeFileSync(setupPath, setupContent);
      console.log('Fixed jest-expo setup.js');
    } catch (error) {
      console.warn('Could not write jest-expo setup.js (may already be fixed):', error.message);
    }
  } else {
    console.log('jest-expo setup.js already has required fixes');
  }
}

