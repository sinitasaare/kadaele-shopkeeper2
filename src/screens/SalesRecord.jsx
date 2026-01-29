import React, { useState, useEffect } from 'react';
import { Search, Calendar, ChevronDown, ChevronUp, Edit, Trash2, XCircle, DollarSign, Eye, Filter } from 'lucide-react';
import { format } from 'date-fns';
import dataService from '../services/dataService';
import './SalesRecord.css';

function SalesRecord() {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [notification, setNotification] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [purchases, searchTerm, filterType, filterStatus, startDate, endDate]);

  const loadPurchases = async () => {
    const data = await dataService.getPurchases();
    setPurchases(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const applyFilters = () => {
    let filtered = [...purchases];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Payment type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.paymentType === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(p => new Date(p.date) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => new Date(p.date) <= end);
    }

    setFilteredPurchases(filtered);
  };

  const canEdit = (purchase) => {
    const createdDate = new Date(purchase.createdAt);
    const now = new Date();
    const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const startEdit = (purchase) => {
    if (!canEdit(purchase)) {
      showNotification('Cannot edit this sale after 24 hours.', 'error');
      return;
    }
    setEditingId(purchase.id);
    setEditForm({
      customerName: purchase.customerName || '',
      customerPhone: purchase.customerPhone || '',
      items: [...purchase.items],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (purchaseId) => {
    try {
      const total = editForm.items.reduce((sum, item) => sum + item.subtotal, 0);
      await dataService.updatePurchase(purchaseId, {
        customerName: editForm.customerName,
        customerPhone: editForm.customerPhone,
        items: editForm.items,
        total,
      });
      showNotification('Sale updated successfully.', 'success');
      loadPurchases();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      showNotification(error.message || 'Failed to update sale.', 'error');
    }
  };

  const handleVoid = async (purchaseId) => {
    const reason = prompt('Please enter reason for voiding this sale:');
    if (reason) {
      try {
        await dataService.voidPurchase(purchaseId, reason);
        showNotification('Sale voided successfully.', 'success');
        loadPurchases();
      } catch (error) {
        showNotification('Failed to void sale.', 'error');
      }
    }
  };

  const handleRefund = async (purchaseId, total) => {
    const amount = prompt(`Enter refund amount (max: $${total.toFixed(2)}):`);
    if (amount) {
      const refundAmount = parseFloat(amount);
      if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > total) {
        showNotification('Invalid refund amount.', 'error');
        return;
      }
      const reason = prompt('Please enter reason for refund:');
      if (reason) {
        try {
          await dataService.refundPurchase(purchaseId, refundAmount, reason);
          showNotification('Refund processed successfully.', 'success');
          loadPurchases();
        } catch (error) {
          showNotification('Failed to process refund.', 'error');
        }
      }
    }
  };

  const updateItemQuantity = (index, quantity) => {
    const newItems = [...editForm.items];
    const qty = parseInt(quantity) || 0;
    if (qty > 0) {
      newItems[index].quantity = qty;
      newItems[index].subtotal = newItems[index].price * qty;
      setEditForm({ ...editForm, items: newItems });
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Active</span>;
      case 'voided':
        return <span className="badge badge-danger">Voided</span>;
      case 'refunded':
        return <span className="badge badge-warning">Refunded</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const getTotalSales = () => {
    return filteredPurchases
      .filter(p => p.status === 'active')
      .reduce((sum, p) => sum + p.total, 0);
  };

  const getTotalCash = () => {
    return filteredPurchases
      .filter(p => p.status === 'active' && p.paymentType === 'cash')
      .reduce((sum, p) => sum + p.total, 0);
  };

  const getTotalCredit = () => {
    return filteredPurchases
      .filter(p => p.status === 'active' && p.paymentType === 'credit')
      .reduce((sum, p) => sum + p.total, 0);
  };

  return (
    <div className="sales-record">
      <div className="record-header">
        <h2 className="screen-title">Sales Record</h2>
        <button
          className="btn btn-outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {showFilters && (
        <div className="filters-panel card">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search</label>
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search by customer or item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Payment Type</label>
              <select
                className="input-field"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="voided">Voided</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#dbeafe' }}>
            <DollarSign size={24} color="#1e40af" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Total Sales</p>
            <p className="summary-value">${getTotalSales().toFixed(2)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#d1fae5' }}>
            <DollarSign size={24} color="#065f46" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Cash Sales</p>
            <p className="summary-value">${getTotalCash().toFixed(2)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#fef3c7' }}>
            <DollarSign size={24} color="#92400e" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Credit Sales</p>
            <p className="summary-value">${getTotalCredit().toFixed(2)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon" style={{ backgroundColor: '#e0e7ff' }}>
            <Eye size={24} color="#3730a3" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Transactions</p>
            <p className="summary-value">{filteredPurchases.length}</p>
          </div>
        </div>
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="card empty-state">
          <FileText size={64} />
          <h3>No sales found</h3>
          <p>Try adjusting your filters or make your first sale in the Cash Register.</p>
        </div>
      ) : (
        <div className="sales-list">
          {filteredPurchases.map(purchase => (
            <div key={purchase.id} className="sale-card card">
              <div className="sale-header" onClick={() => toggleExpand(purchase.id)}>
                <div className="sale-info">
                  <div className="sale-main">
                    <span className="sale-date">
                      {format(new Date(purchase.date), 'MMM dd, yyyy HH:mm')}
                    </span>
                    {purchase.customerName && (
                      <span className="sale-customer">{purchase.customerName}</span>
                    )}
                  </div>
                  <div className="sale-meta">
                    <span className={`payment-badge ${purchase.paymentType}`}>
                      {purchase.paymentType === 'cash' ? 'Cash' : 'Credit'}
                    </span>
                    {getStatusBadge(purchase.status)}
                  </div>
                </div>
                <div className="sale-amount">${purchase.total.toFixed(2)}</div>
                <button className="expand-btn">
                  {expandedId === purchase.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {expandedId === purchase.id && (
                <div className="sale-details">
                  {editingId === purchase.id ? (
                    <div className="edit-form">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Customer Name</label>
                          <input
                            type="text"
                            className="input-field"
                            value={editForm.customerName}
                            onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Customer Phone</label>
                          <input
                            type="tel"
                            className="input-field"
                            value={editForm.customerPhone}
                            onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="items-list">
                        <h4>Items</h4>
                        {editForm.items.map((item, index) => (
                          <div key={index} className="item-row">
                            <span className="item-name">{item.name}</span>
                            <input
                              type="number"
                              className="input-field"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, e.target.value)}
                              min="1"
                              style={{ width: '80px' }}
                            />
                            <span className="item-price">${item.price.toFixed(2)}</span>
                            <span className="item-subtotal">${item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="form-actions">
                        <button className="btn btn-outline" onClick={cancelEdit}>
                          Cancel
                        </button>
                        <button className="btn btn-primary" onClick={() => saveEdit(purchase.id)}>
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="details-grid">
                        {purchase.customerName && (
                          <>
                            <div className="detail-item">
                              <span className="detail-label">Customer:</span>
                              <span className="detail-value">{purchase.customerName}</span>
                            </div>
                            {purchase.customerPhone && (
                              <div className="detail-item">
                                <span className="detail-label">Phone:</span>
                                <span className="detail-value">{purchase.customerPhone}</span>
                              </div>
                            )}
                          </>
                        )}
                        {purchase.refund && (
                          <div className="detail-item">
                            <span className="detail-label">Refund:</span>
                            <span className="detail-value refund">
                              ${purchase.refund.amount.toFixed(2)} - {purchase.refund.reason}
                            </span>
                          </div>
                        )}
                        {purchase.voidReason && (
                          <div className="detail-item">
                            <span className="detail-label">Void Reason:</span>
                            <span className="detail-value">{purchase.voidReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="items-table">
                        <h4>Items</h4>
                        <table>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Price</th>
                              <th>Qty</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {purchase.items.map((item, index) => (
                              <tr key={index}>
                                <td>{item.name}</td>
                                <td>${item.price.toFixed(2)}</td>
                                <td>{item.quantity}</td>
                                <td>${item.subtotal.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {purchase.status === 'active' && (
                        <div className="sale-actions">
                          {canEdit(purchase) && (
                            <button className="btn btn-outline" onClick={() => startEdit(purchase)}>
                              <Edit size={18} />
                              Edit
                            </button>
                          )}
                          <button
                            className="btn btn-outline"
                            onClick={() => handleRefund(purchase.id, purchase.total)}
                          >
                            <DollarSign size={18} />
                            Refund
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleVoid(purchase.id)}
                          >
                            <XCircle size={18} />
                            Void
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Placeholder icon
function FileText({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export default SalesRecord;
