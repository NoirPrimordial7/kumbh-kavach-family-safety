import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/features.css';
import './styles/panels.css';
import './styles/responsive.css';
import './styles/map.css';
import '@fontsource-variable/manrope';
import '@fontsource/dm-serif-display';

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
