import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import Index from './pages/index';
import { Root } from './Root';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

createRoot(container).render(
  <StrictMode>
    <Root>
      <App>
        <Index />
      </App>
    </Root>
  </StrictMode>,
);

