import { AppRegistry } from 'react-native';
import App from './App';

const appName = 'ElectroPime';

AppRegistry.registerComponent(appName, () => App);

// Only run this in browser environments
if (typeof document !== 'undefined') {
  // Add necessary styles for react-native-web
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    #root {
      display: flex;
      flex: 1;
    }
  `;
  document.head.appendChild(style);
  AppRegistry.runApplication(appName, {
    rootTag: document.getElementById('root')
  });
}