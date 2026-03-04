import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Home from './pages/home.jsx';
import Register from './pages/register.jsx';
import './css/globals.css';

import { BrowserRouter, Routes, Route } from "react-router-dom";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* App is now the layout for nested pages */}
        <Route path="*" element={<App />}>
          <Route index element={<Home />} />            {/* Default page "/" */}
          <Route path="Home" element={<Home />} />      {/* "/Home" */}
          <Route path="Register" element={<Register />} />  {/* "/Register" */}
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
