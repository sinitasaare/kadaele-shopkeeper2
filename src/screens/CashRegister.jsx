import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Camera, DollarSign, CreditCard, X, Check } from 'lucide-react';
import { Camera as CapCamera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import dataService from '../services/dataService';
import './CashRegister.css';

function CashRegister() {
  const [goods, setGoods] = useState([]);
  const [basket, setBasket] = useState([]);
  const [paymentType, setPaymentType] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadGoods();
  }, []);

  const loadGoods = async () => {
    const goodsData = await dataService.getGoods();
    setGoods(goodsData);
  };

  const filteredGoods = goods.filter(good =>
    good.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToBasket = (good) => {
    const existing = basket.find(item => item.id === good.id);
    if (existing) {
      setBasket(basket.map(item =>
        item.id === good.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setBasket([...basket, { ...good, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setBasket(basket.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromBasket = (id) => {
    setBasket(basket.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return basket.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const takeCreditPhoto = async () => {
    if (!Capacitor.isNativePlatform()) {
      // For web/desktop, use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'camera';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setCapturedPhoto(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // For mobile, use Capacitor Camera
      try {
        const image = await CapCamera.getPhoto({
          quality: 70,
          allowEditing: false,
          resultType: 'dataUrl',
        });
        setCapturedPhoto(image.dataUrl);
      } catch (error) {
        showNotification('Could not capture photo. Please try again.', 'error');
      }
    }
  };

  const handleSubmitPayment = async () => {
    if (basket.length === 0) {
      showNotification('Please add items to the basket first.', 'error');
      return;
    }

    if (paymentType === 'credit' && (!customerName || !customerPhone)) {
      showNotification('Please enter customer name and phone for credit sales.', 'error');
      return;
    }

    if (paymentType === 'credit' && !capturedPhoto) {
      const confirm = window.confirm(
        'No photo of Credit Sales Book entry was taken. Do you want to proceed without a photo?'
      );
      if (!confirm) {
        setShowPhotoModal(true);
        return;
      }
    }

    setIsProcessing(true);

    try {
      const total = calculateTotal();
      const items = basket.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }));

      let photoUrl = null;
      if (capturedPhoto) {
        try {
          photoUrl = await dataService.savePhoto(capturedPhoto, Date.now().toString());
        } catch (error) {
          console.error('Photo save error:', error);
          showNotification('Warning: Photo could not be saved.', 'warning');
        }
      }

      const purchase = await dataService.addPurchase({
        items,
        total,
        paymentType,
        customerName: paymentType === 'credit' ? customerName : '',
        customerPhone: paymentType === 'credit' ? customerPhone : '',
        photoUrl,
      });

      showNotification(
        paymentType === 'cash'
          ? `Sale completed! Total: $${total.toFixed(2)}`
          : `Credit sale recorded for ${customerName}. Total: $${total.toFixed(2)}`,
        'success'
      );

      // Reset form
      setBasket([]);
      setCustomerName('');
      setCustomerPhone('');
      setCapturedPhoto(null);
      setPaymentType('cash');
    } catch (error) {
      console.error('Payment error:', error);
      showNotification(
        navigator.onLine
          ? 'Payment failed. Please try again.'
          : 'No internet. Your sale is saved locally and will sync when online.',
        navigator.onLine ? 'error' : 'info'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const clearBasket = () => {
    if (basket.length > 0) {
      const confirm = window.confirm('Are you sure you want to clear the basket?');
      if (confirm) {
        setBasket([]);
        setCapturedPhoto(null);
      }
    }
  };

  return (
    <div className="cash-register">
      <div className="register-header">
        <h2 className="screen-title">Cash Register</h2>
        {basket.length > 0 && (
          <button className="btn btn-outline" onClick={clearBasket}>
            <Trash2 size={18} />
            Clear Basket
          </button>
        )}
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.type === 'success' && <Check size={20} />}
          {notification.type === 'error' && <X size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="register-layout">
        <div className="goods-panel">
          <div className="panel-header">
            <h3>Products</h3>
            <input
              type="text"
              className="input-field"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="goods-grid">
            {filteredGoods.map(good => (
              <div key={good.id} className="good-card" onClick={() => addToBasket(good)}>
                <div className="good-info">
                  <h4 className="good-name">{good.name}</h4>
                  <p className="good-category">{good.category}</p>
                </div>
                <div className="good-price">${good.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="basket-panel">
          <div className="panel-header">
            <h3>Current Sale</h3>
          </div>

          {basket.length === 0 ? (
            <div className="empty-basket">
              <ShoppingCart size={48} />
              <p>No items in basket</p>
              <p className="empty-subtitle">Click on products to add them</p>
            </div>
          ) : (
            <>
              <div className="basket-items">
                {basket.map(item => (
                  <div key={item.id} className="basket-item">
                    <div className="item-info">
                      <h4 className="item-name">{item.name}</h4>
                      <p className="item-price">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="item-controls">
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromBasket(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="item-subtotal">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="payment-section">
                <div className="total-section">
                  <span className="total-label">Total:</span>
                  <span className="total-amount">${calculateTotal().toFixed(2)}</span>
                </div>

                <div className="payment-type">
                  <button
                    className={`payment-btn ${paymentType === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentType('cash')}
                  >
                    <DollarSign size={20} />
                    Cash
                  </button>
                  <button
                    className={`payment-btn ${paymentType === 'credit' ? 'active' : ''}`}
                    onClick={() => setPaymentType('credit')}
                  >
                    <CreditCard size={20} />
                    Credit
                  </button>
                </div>

                {paymentType === 'credit' && (
                  <div className="credit-details">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Customer Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="Customer Phone *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    <button
                      className="btn btn-outline"
                      onClick={() => setShowPhotoModal(true)}
                    >
                      <Camera size={18} />
                      {capturedPhoto ? 'Retake Photo' : 'Take Photo of Credit Sales Book'}
                    </button>
                    {capturedPhoto && (
                      <div className="photo-preview">
                        <img src={capturedPhoto} alt="Credit book entry" />
                        <button
                          className="remove-photo"
                          onClick={() => setCapturedPhoto(null)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="btn btn-primary btn-submit"
                  onClick={handleSubmitPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="spinner" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Submit Payment
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Credit Sales Book Entry</h3>
              <button className="close-btn" onClick={() => setShowPhotoModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <p className="modal-description">
                Please take a photo of the written entry in your Credit Sales Book.
                This will help with record keeping and dispute resolution.
              </p>
              {capturedPhoto ? (
                <div className="photo-display">
                  <img src={capturedPhoto} alt="Credit book entry" />
                  <button className="btn btn-secondary" onClick={takeCreditPhoto}>
                    <Camera size={18} />
                    Retake Photo
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={takeCreditPhoto}>
                  <Camera size={20} />
                  Take Photo
                </button>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowPhotoModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowPhotoModal(false)}
                disabled={!capturedPhoto}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder icon for empty basket
function ShoppingCart({ size }) {
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
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export default CashRegister;
