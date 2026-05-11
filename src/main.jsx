import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import SmgApp from './smg/SmgApp.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/2shot_smg" element={<SmgApp />} />
        <Route path="/2shot_smg/*" element={<SmgApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)