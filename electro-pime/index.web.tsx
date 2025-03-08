import { AppRegistry } from 'react-native';
import App from './app'; // Changed to lowercase to match file system

// Define app name directly since app.json name import is not working
const appName = 'ElectroPime';

AppRegistry.registerComponent(appName, () => App);

// Add this for web rendering
AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});