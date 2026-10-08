import React from 'react';

import { Routes, Route, BrowserRouter } from 'react-router-dom';
import LoginPage from '../pages/Login';

const PublicRoutes: React.FC = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default PublicRoutes;
