import React from 'react';
import ReactDOM from 'react-dom/client';
import { FocusStyleManager } from '@blueprintjs/core';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/table/lib/css/table.css';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import App from './App';
import './i18n';
import './index.css';

FocusStyleManager.onlyShowFocusOnTabs();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
