// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
// Adjust the import path if your main component is named differently
import App from '../pages/index.jsx';

createRoot(document.getElementById('root')).render(<App />);
