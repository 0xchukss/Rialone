import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PrivyProvider } from './lib/PrivyProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider>
      <App />
    </PrivyProvider>
  </StrictMode>,
);
