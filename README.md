# Kadaele Services Shopkeeper - Cash Register & Sales Management App

A modern, offline-first Point of Sale (POS) system built with React, Capacitor, and Electron. Designed for small shops to manage sales, track credit customers, and monitor inventory.

## Features

### 🛒 Cash Register
- Quick product selection from catalogue
- Support for both cash and credit sales
- Photo capture of Credit Sales Book entries
- Offline-first with automatic sync
- Real-time basket management

### 📊 Sales Record
- View all sales transactions
- Filter by date, customer, payment type, and status
- Edit sales within 24 hours
- Void or refund transactions
- Detailed item breakdown for each sale

### 💳 Debtors Management
- Track credit customers and outstanding balances
- Record partial or full payments
- View credit sales history per customer
- Generate and share credit note cards
- Automatic balance calculations

### 📦 Inventory (Read-Only)
- View current stock levels
- Track low stock and out-of-stock items
- Filter and search products
- Stock level summaries
- *Note: Automatic stock updates will be added in future version*

## Technology Stack

- **Frontend**: React 18 with modern hooks
- **Mobile**: Capacitor 5 (iOS & Android)
- **Desktop**: Electron 28 (Windows, macOS, Linux)
- **Build Tool**: Vite 5
- **Storage**: LocalForage (IndexedDB)
- **Routing**: React Router 6
- **Styling**: Custom CSS with CSS variables
- **Date Handling**: date-fns
- **Image Generation**: html2canvas

## Project Structure

```
kadaele-pos/
├── src/
│   ├── screens/           # Main application screens
│   │   ├── CashRegister.jsx
│   │   ├── SalesRecord.jsx
│   │   ├── Debtors.jsx
│   │   └── Inventory.jsx
│   ├── services/          # Business logic & data management
│   │   └── dataService.js
│   ├── App.jsx           # Main app component with routing
│   ├── App.css           # App-level styles
│   ├── main.jsx          # React entry point
│   └── index.css         # Global styles
├── electron/
│   └── main.js           # Electron main process
├── public/               # Static assets
├── capacitor.config.json # Capacitor configuration
├── vite.config.js        # Vite build configuration
└── package.json          # Dependencies and scripts
```

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- For iOS development: macOS with Xcode
- For Android development: Android Studio
- For desktop builds: Platform-specific build tools

## Installation

1. **Clone or extract the project**
   ```bash
   cd kadaele-pos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Capacitor CLI globally (optional)**
   ```bash
   npm install -g @capacitor/cli
   ```

## Development

### Web Development
```bash
npm run dev
```
Opens the app at http://localhost:5173

### Electron (Desktop) Development
```bash
npm run electron:dev
```
Runs both Vite dev server and Electron

### Mobile Development

#### Android
```bash
# Build and sync
npm run cap:android

# Or manually:
npm run build
npx cap sync android
npx cap open android
```

#### iOS (macOS only)
```bash
# Build and sync
npm run cap:ios

# Or manually:
npm run build
npx cap sync ios
npx cap open ios
```

## Production Builds

### Web Build
```bash
npm run build
```
Output: `dist/` directory

### Desktop Build (Electron)
```bash
npm run electron:build
```
Output: Platform-specific installers in `dist/` directory

### Mobile Build

#### Android
1. Build the web assets: `npm run build`
2. Sync to Android: `npx cap sync android`
3. Open Android Studio: `npx cap open android`
4. Build APK/AAB from Android Studio

#### iOS
1. Build the web assets: `npm run build`
2. Sync to iOS: `npx cap sync ios`
3. Open Xcode: `npx cap open ios`
4. Build from Xcode

## Configuration

### Backend Integration (kadaele-services)

The app is designed to sync with a cloud backend called "kadaele-services". To integrate:

1. **Choose a database** (Supabase, Firebase, or MongoDB Atlas recommended)

2. **Update dataService.js** to connect to your backend:
   ```javascript
   // In src/services/dataService.js
   
   async getServerTime() {
     const response = await fetch('https://your-backend.com/api/time');
     const data = await response.json();
     return new Date(data.timestamp);
   }
   
   async syncToServer() {
     const queue = await localforage.getItem(DATA_KEYS.SYNC_QUEUE);
     const response = await fetch('https://your-backend.com/api/sync', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ items: queue }),
     });
     // Handle response...
   }
   ```

3. **Setup photo upload endpoint**:
   ```javascript
   async savePhoto(photoData, purchaseId) {
     const formData = new FormData();
     formData.append('photo', photoData);
     formData.append('purchaseId', purchaseId);
     
     await fetch('https://your-backend.com/api/upload', {
       method: 'POST',
       body: formData,
     });
   }
   ```

### Environment Variables

Create a `.env` file in the root directory:
```env
VITE_API_URL=https://your-backend.com/api
VITE_STORAGE_KEY=kadaele-pos
VITE_SHOP_NAME=Your Shop Name
```

Access in code:
```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

## Data Structure

### goods.json
```json
[
  {
    "id": "string",
    "name": "string",
    "price": number,
    "category": "string",
    "barcode": "string",
    "createdAt": "ISO8601"
  }
]
```

### purchases.json
```json
[
  {
    "id": "string",
    "date": "ISO8601",
    "items": [
      {
        "id": "string",
        "name": "string",
        "price": number,
        "quantity": number,
        "subtotal": number
      }
    ],
    "total": number,
    "paymentType": "cash|credit",
    "customerName": "string",
    "customerPhone": "string",
    "status": "active|voided|refunded",
    "photoUrl": "string",
    "refund": {
      "amount": number,
      "reason": "string",
      "date": "ISO8601"
    }
  }
]
```

### debtors.json
```json
[
  {
    "id": "string",
    "customerName": "string",
    "customerPhone": "string",
    "totalDue": number,
    "totalPaid": number,
    "balance": number,
    "purchaseIds": ["string"],
    "createdAt": "ISO8601",
    "lastPurchase": "ISO8601",
    "lastPayment": "ISO8601"
  }
]
```

### inventory.json
```json
[
  {
    "itemId": "string",
    "stockLevel": number,
    "lastUpdated": "ISO8601"
  }
]
```

## Features & Usage

### Offline-First Architecture
- All data saved locally first using IndexedDB
- Automatic sync when online
- Queue system for pending syncs
- Visual online/offline indicators

### Cash Register Workflow
1. Select products from catalogue
2. Adjust quantities as needed
3. Choose payment type (Cash or Credit)
4. For credit: Enter customer details and optionally take photo
5. Submit payment

### Sales Editing Rules
- Sales can be edited within 24 hours of creation
- After 24 hours, editing is locked
- Voiding and refunds can be done at any time

### Credit Note Generation
- Automatically generates professional credit note cards
- Can be saved as PNG image
- Can be shared via WhatsApp, Messenger, Gmail (on mobile)

## Customization

### Branding
Update shop name and colors in `src/index.css`:
```css
:root {
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  /* ... other colors */
}
```

### Shop Logo
Add your logo to credit notes in `src/screens/Debtors.jsx`:
```jsx
<div className="note-header">
  <img src="/logo.png" alt="Shop Logo" />
  <h2>Your Shop Name</h2>
</div>
```

## Known Limitations

Current version does not include:
- Automatic stock level updates from sales
- Multi-branch support
- Multi-user roles/permissions
- Advanced accounting reports
- Card payment integration
- Customer profiles for non-credit customers

These features can be added in future versions.

## Troubleshooting

### Camera not working on web
The camera requires HTTPS or localhost. For production web deployments, ensure SSL is configured.

### Build errors on mobile
Ensure all Capacitor platforms are properly installed:
```bash
npx cap doctor
```

### Sync not working
Check browser console for network errors. Ensure backend endpoints are configured correctly.

### Data not persisting
Check that IndexedDB is enabled in the browser and not in private/incognito mode.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

To add features:
1. Add new data fields in `dataService.js`
2. Update UI components in relevant screens
3. Update data structures in README
4. Test offline functionality

## License

This project is provided as-is for use by Kadaele Shop.

## Support

For issues or questions:
1. Check this README
2. Review code comments in dataService.js
3. Check browser console for errors
4. Verify network connectivity for sync issues

---

**Built with ❤️ for Kadaele Shop**
