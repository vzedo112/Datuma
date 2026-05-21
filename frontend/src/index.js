// Sentry must be imported first so it can wrap React internals.
import { Sentry, sentryEnabled } from './sentry';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const Tree = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  sentryEnabled ? (
    <Sentry.ErrorBoundary fallback={<p style={{ padding: 24 }}>Something went wrong. Please refresh.</p>}>
      {Tree}
    </Sentry.ErrorBoundary>
  ) : (
    Tree
  )
);
