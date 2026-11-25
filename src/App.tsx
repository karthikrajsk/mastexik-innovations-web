import React, { useEffect } from 'react';
import { HashRouter, useLocation } from 'react-router-dom';
import RoutesConfig from '@/routes/Routes';
import { Provider } from 'react-redux';
import { AuthProvider } from '@/contexts/AuthContext';
import { store } from '@/state/store';

// Sets document.title based on the current route path
function TitleSetter() {
  const location = useLocation();

  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const title = parts.length === 0 ? 'dashboard' : parts[parts.length - 1];
    document.title = title;
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <HashRouter>
          <TitleSetter />
          <RoutesConfig />
        </HashRouter>
      </AuthProvider>
    </Provider>
  );
}

export default App;
