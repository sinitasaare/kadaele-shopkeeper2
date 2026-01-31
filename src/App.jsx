import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { ShoppingCart, FileText, Users, Package, Wifi, WifiOff } from 'lucide-react';
import CashRegister from './screens/CashRegister';
import SalesRecord from './screens/SalesRecord';
import Debtors from './screens/Debtors';
import Inventory from './screens/Inventory';
import dataService from './services/dataService';
import './App.css';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Initialize sample data
    dataService.initializeSampleData();

    // Load last sync time
    loadLastSync();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadLastSync = async () => {
    const sync = await dataService.getLastSyncTime();
    setLastSync(sync);
  };

  const syncData = async () => {
    const result = await dataService.syncToServer();
    if (result.success) {
      loadLastSync();
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">Kadaele POS</h1>
            <div className="header-status">
              <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              {lastSync && (
                <span className="sync-time">Synced {formatLastSync()}</span>
              )}
            </div>
          </div>
        </header>

        <div className="app-layout">
          <nav className="app-nav">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShoppingCart size={20} />
              <span>Cash Register</span>
            </NavLink>
            <NavLink to="/sales" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileText size={20} />
              <span>Sales Record</span>
            </NavLink>
            <NavLink to="/debtors" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              <span>Debtors</span>
            </NavLink>
            <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Package size={20} />
              <span>Inventory</span>
            </NavLink>
          </nav>

          <main className="app-main">
            <Routes>
              <Route path="/" element={<CashRegister />} />
              <Route path="/sales" element={<SalesRecord />} />
              <Route path="/debtors" element={<Debtors />} />
              <Route path="/inventory" element={<Inventory />} />
            </Routes>
          </main>
        </div>

        {!isOnline && (
          <div className="offline-banner">
            <WifiOff size={16} />
            <span>You are offline. Data will sync when connection is restored.</span>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;


