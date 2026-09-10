import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@zwantum/blog-editor/styles.css';
import '@zwantum/blog-admin/styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
