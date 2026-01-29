import React, { useState, useEffect } from 'react';
import { Search, Package, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { format } from 'date-fns';
import dataService from '../services/dataService';
import './Inventory.css';

function Inventory() {
  const [goods, setGoods] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [goods, inventory, searchTerm]);

  const loadData = async () => {
    const goodsData = await dataService.getGoods();
    const inventoryData = await dataService.getInventory();
    setGoods(goodsData);
    setInventory(inventoryData);
  };

  const applyFilters = () => {
    // Combine goods with inventory data
    const combined = goods.map(good => {
      const inventoryItem = inventory.find(inv => inv.itemId === good.id);
      return {
        ...good,
        stockLevel: inventoryItem?.stockLevel || 0,
        lastUpdated: inventoryItem?.lastUpdated || null,
      };
    });

    // Apply search filter
    let filtered = combined;
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const getTotalItems = () => {
    return filteredItems.length;
  };

  const getTotalStock = () => {
    return filteredItems.reduce((sum, item) => sum + item.stockLevel, 0);
  };

  const getLowStockCount = () => {
    // Consider items with less than 10 units as low stock
    return filteredItems.filter(item => item.stockLevel > 0 && item.stockLevel < 10).length;
  };

  const getOutOfStockCount = () => {
    return filteredItems.filter(item => item.stockLevel === 0).length;
  };

  const getStockStatus = (stockLevel) => {
    if (stockLevel === 0) {
      return { label: 'Out of Stock', className: 'out-of-stock', icon: <AlertTriangle size={16} /> };
    } else if (stockLevel < 10) {
      return { label: 'Low Stock', className: 'low-stock', icon: <AlertTriangle size={16} /> };
    } else {
      return { label: 'In Stock', className: 'in-stock', icon: <TrendingUp size={16} /> };
    }
  };

  return (
    <div className="inventory">
      <div className="inventory-header">
        <div>
          <h2 className="screen-title">Inventory</h2>
          <p className="screen-subtitle">View current stock levels (Read-only)</p>
        </div>
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="info-banner">
        <Info size={20} />
        <div>
          <p className="banner-title">Stock Management Coming Soon</p>
          <p className="banner-text">
            This screen currently shows stock levels for reference only. Automatic stock updates
            when sales are made will be added in a future version.
          </p>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#dbeafe' }}>
            <Package size={24} color="#1e40af" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Total Items</p>
            <p className="summary-value">{getTotalItems()}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#d1fae5' }}>
            <TrendingUp size={24} color="#065f46" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Total Stock</p>
            <p className="summary-value">{getTotalStock()} units</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#fef3c7' }}>
            <AlertTriangle size={24} color="#92400e" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Low Stock</p>
            <p className="summary-value">{getLowStockCount()}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#fee2e2' }}>
            <AlertTriangle size={24} color="#991b1b" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Out of Stock</p>
            <p className="summary-value">{getOutOfStockCount()}</p>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="card empty-state">
          <Package size={64} />
          <h3>No items found</h3>
          <p>Add products in your goods catalogue to see them here.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Level</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const status = getStockStatus(item.stockLevel);
                  return (
                    <tr key={item.id}>
                      <td className="item-name">{item.name}</td>
                      <td>{item.category || 'General'}</td>
                      <td className="item-price">${item.price.toFixed(2)}</td>
                      <td className="stock-level">
                        <span className={`stock-badge ${status.className}`}>
                          {item.stockLevel} units
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${status.className}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="last-updated">
                        {item.lastUpdated
                          ? format(new Date(item.lastUpdated), 'MMM dd, yyyy')
                          : 'Never'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
