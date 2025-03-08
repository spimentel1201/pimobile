import { AppRegistry } from 'react-native';
import App from './App';  // Updated import path

const appName = 'ElectroPime';

AppRegistry.registerComponent(appName, () => App);

// Add this for web rendering
AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});