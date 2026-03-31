// ========================================
// GKS RENT PRO - COMPLETE BUSINESS LOGIC
// Professional Construction Material Management
// ========================================

// Database Management (localStorage + optional Firebase Firestore sync)
const DB = {
  firebaseEnabled: false,
  _cache: {}, // in-memory cache; when Firebase is enabled this is the primary source of truth
  collections: [
    'gks_clients',
    'gks_projects',
    'gks_items',
    'gks_bookings',
    'gks_transactions',
    'gks_payments',
    'gks_deposits',
    'gks_staff',
    'gks_loyalty',
    'gks_cart_out',
    'gks_cart_in'
  ],

  init: () => {
    // Ensure localStorage keys exist so the app can always work offline
    DB.collections.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
      // seed in-memory cache from localStorage initially
      DB._cache[key] = JSON.parse(localStorage.getItem(key) || '[]');
    });

    // Hook into Firebase Firestore if it has been configured
    DB.firebaseEnabled = !!(window.firebaseEnabled && window.firestore);

    if (DB.firebaseEnabled) {
      try {
        DB._setupFirestoreSync();
      } catch (err) {
        console.error('Error setting up Firestore sync, falling back to localStorage only.', err);
        DB.firebaseEnabled = false;
      }
    }
  },

  // Read: when Firebase is enabled, use in-memory cache (kept in sync from Firestore).
  // Otherwise, fall back to localStorage.
  get: (key) => {
    if (DB.firebaseEnabled) {
      return DB._cache[key] || [];
    }
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  // Add a single record
  add: (key, data) => {
    const docId = String(data.id || Date.now());
    const record = { ...data, id: data.id ?? docId };

    // Update in-memory cache first (source of truth for the app)
    const current = DB._cache[key] || DB.get(key);
    const updated = [...current, record];
    DB._cache[key] = updated;

    // Mirror to localStorage for offline/backup
    localStorage.setItem(key, JSON.stringify(updated));

    // When Firebase is enabled, write to Firestore as the persistent backend
    if (DB.firebaseEnabled) {
      try {
        window.firestore
          .collection(key)
          .doc(docId)
          .set(record)
          .catch(err => console.error('Firestore add error for', key, err));
      } catch (err) {
        console.error('Firestore add unexpected error for', key, err);
      }
    }
  },

  // Replace entire collection with new array
  update: (key, data) => {
    const safeData = Array.isArray(data) ? data : [];

    // Update in-memory cache
    DB._cache[key] = safeData;

    // Mirror to localStorage
    localStorage.setItem(key, JSON.stringify(safeData));

    if (DB.firebaseEnabled) {
      try {
        const colRef = window.firestore.collection(key);

        // For simplicity, upsert all docs from the array.
        // (If some remote docs no longer exist locally, they will remain until cleaned manually.)
        safeData.forEach(item => {
          if (!item) return;
          const docId = String(item.id || Date.now());
          colRef
            .doc(docId)
            .set({ ...item, id: item.id ?? docId }, { merge: true })
            .catch(err => console.error('Firestore update error for', key, err));
        });
      } catch (err) {
        console.error('Firestore bulk update unexpected error for', key, err);
      }
    }
  },

  // Find single record in local cache
  find: (key, id) => {
    const arr = DB.get(key);
    return arr.find(item => item.id == id);
  },

  // Internal: keep cache (and localStorage) updated from Firestore in real time
  _setupFirestoreSync: () => {
    const fs = window.firestore;
    if (!fs) return;

    DB.collections.forEach(key => {
      fs.collection(key).onSnapshot(
        snapshot => {
          const data = snapshot.docs.map(doc => doc.data());
          DB._cache[key] = data;
          localStorage.setItem(key, JSON.stringify(data));
        },
        err => {
          console.error('Firestore listener error for', key, err);
        }
      );
    });
  }
};

// Main App Object
const APP_CONFIG = {
  adminUsername: 'admin',
  adminPassword: 'admin123',
  ownerPhone: '7850832958',
  upiId: 'kumaresaini728@okhdfcbank',
  upiPayeeName: 'GKS_RENT'
};

const AppPro = {
  cart: [],
  lastQRData: '',

  // ========== LOGIN ==========
  login: (e) => {
    e.preventDefault();
    const username = e.target[0].value;
    const password = e.target[1].value;

    if (username === APP_CONFIG.adminUsername && password === APP_CONFIG.adminPassword) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app-main').style.display = 'flex';

      DB.init();
      AppPro.navigate('dashboard');
      AppPro.toast('Welcome to GKS Rent Pro!', 'success');
      AppPro.loadDashboard();
    } else {
      AppPro.toast('Invalid credentials!', 'danger');
    }
  },

  // ========== NAVIGATION ==========
  navigate: (pageId) => {
    // Remove active from all sections
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    event?.currentTarget?.classList.add('active');

    // Update page title
    const titles = {
      'dashboard': 'Dashboard',
      'clients': 'Client Management',
      'projects': 'Project Management',
      'items': 'Items Master',
      'booking': 'Booking & Reservation',
      'material-out': 'Material OUT',
      'material-in': 'Material IN & Billing',
      'payments': 'Payment Management',
      'deposits': 'Security Deposits',
      'whatsapp': 'WhatsApp Integration',
      'qr-codes': 'QR Code Generator',
      'staff': 'Staff Management',
      'loyalty': 'Loyalty Program',
      'reports': 'Reports & Ledger'
    };

    document.getElementById('page-title').innerText = titles[pageId] || pageId;

    // Load data
    if (pageId === 'dashboard') AppPro.loadDashboard();
    if (pageId === 'clients') AppPro.loadClients();
    if (pageId === 'projects') AppPro.loadProjects();
    if (pageId === 'items') AppPro.loadItems();
    if (pageId === 'booking') AppPro.loadBookings();
    if (pageId === 'staff') AppPro.loadStaff();
    if (pageId === 'deposits') AppPro.loadDeposits();
    if (pageId === 'loyalty') AppPro.loadLoyalty();
    if (pageId.includes('material') || pageId === 'payments' || pageId === 'reports' || pageId === 'whatsapp' || pageId === 'booking' || pageId === 'qr-codes') {
      AppPro.loadDropdowns();
    }
    if (pageId === 'payments') AppPro.loadOutstanding();
  },

  // ========== CLIENTS ==========
  saveClient: (e) => {
    e.preventDefault();

    const client = {
      id: Date.now(),
      name: document.getElementById('client-name').value,
      mobile: document.getElementById('client-mobile').value,
      email: document.getElementById('client-email').value,
      address: document.getElementById('client-address').value,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString()
    };

    DB.add('gks_clients', client);
    AppPro.toast('Client added successfully!', 'success');
    e.target.reset();
    AppPro.toggleForm('client-form');
    AppPro.loadClients();
  },

  loadClients: () => {
    const clients = DB.get('gks_clients');
    const projects = DB.get('gks_projects');
    const transactions = DB.get('gks_transactions');
    const payments = DB.get('gks_payments');

    const html = clients.map(client => {
      // Count projects
      const clientProjects = projects.filter(p => p.clientId == client.id).length;

      // Calculate outstanding
      let outstanding = 0;
      transactions.filter(t => t.clientId == client.id && t.type === 'IN').forEach(t => {
        outstanding += t.grandTotal || 0;
      });
      payments.filter(p => p.clientId == client.id).forEach(p => {
        outstanding -= p.amount || 0;
      });

      return `
        <tr>
          <td><strong>${client.name}</strong></td>
          <td>${client.mobile}</td>
          <td>${client.email || '-'}</td>
          <td><span class="badge-custom badge-primary">${clientProjects}</span></td>
          <td class="${outstanding > 0 ? 'text-danger' : 'text-success'} fw-bold">₹${outstanding.toFixed(2)}</td>
          <td><span class="badge-custom badge-warning">${client.loyaltyPoints || 0} pts</span></td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="AppPro.removeClient(${client.id})">
              <i class="fas fa-trash"></i> Remove
            </button>
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('clients-table').innerHTML = html || '<tr><td colspan="7" class="text-center text-muted">No clients yet</td></tr>';
  },

  removeClient: (id) => {
    const projects = DB.get('gks_projects').filter(p => p.clientId == id);
    const bookings = DB.get('gks_bookings').filter(b => b.clientId == id);
    const transactions = DB.get('gks_transactions').filter(t => t.clientId == id);
    const payments = DB.get('gks_payments').filter(p => p.clientId == id);
    const deposits = DB.get('gks_deposits').filter(d => d.clientId == id);

    const linkedCount = projects.length + bookings.length + transactions.length + payments.length + deposits.length;
    if (linkedCount > 0) {
      AppPro.toast('Cannot remove client with linked records (projects/bookings/bills/payments/deposits).', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to remove this client?')) return;

    let clients = DB.get('gks_clients');
    clients = clients.filter(c => c.id != id);
    DB.update('gks_clients', clients);
    AppPro.toast('Client removed successfully!', 'success');
    AppPro.loadClients();
    AppPro.loadDropdowns();
  },

  // ========== PROJECTS ==========
  saveProject: (e) => {
    e.preventDefault();

    const project = {
      id: Date.now(),
      clientId: document.getElementById('project-client').value,
      name: document.getElementById('project-name').value,
      location: document.getElementById('project-location').value,
      startDate: document.getElementById('project-start').value,
      endDate: document.getElementById('project-end').value,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    DB.add('gks_projects', project);
    AppPro.toast('Project created successfully!', 'success');
    e.target.reset();
    AppPro.toggleForm('project-form');
    AppPro.loadProjects();
  },

  loadProjects: () => {
    const projects = DB.get('gks_projects');
    const clients = DB.get('gks_clients');

    if (projects.length === 0) {
      document.getElementById('projects-list').innerHTML = '<div class="col-12 text-center text-muted p-4">No projects yet</div>';
      return;
    }

    const html = projects.map(project => {
      const client = clients.find(c => c.id == project.clientId);
      const statusColors = {
        active: 'badge-success',
        completed: 'badge-primary',
        hold: 'badge-warning'
      };

      return `
        <div class="col-md-6">
          <div class="project-card">
            <div class="project-header">
              <div>
                <div class="project-name">${project.name}</div>
                <small class="text-muted"><i class="fas fa-user"></i> ${client?.name || 'Unknown'}</small>
              </div>
              <span class="badge-custom ${statusColors[project.status]}">${project.status.toUpperCase()}</span>
            </div>
            <div style="color: #64748b; font-size: 0.9em;">
              <i class="fas fa-map-marker-alt"></i> ${project.location}<br>
              <i class="fas fa-calendar"></i> ${project.startDate || 'N/A'} → ${project.endDate || 'Ongoing'}
            </div>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('projects-list').innerHTML = html;
  },

  // ========== ITEMS MASTER ==========
  saveItem: (e) => {
    e.preventDefault();

    const item = {
      id: Date.now(),
      name: document.getElementById('item-name').value,
      rentalType: document.getElementById('item-rental-type').value, // 'day' or 'month'
      rate: parseFloat(document.getElementById('item-rate').value),
      stock: parseInt(document.getElementById('item-stock').value),
      createdAt: new Date().toISOString()
    };

    DB.add('gks_items', item);
    AppPro.toast('Item added successfully!', 'success');
    e.target.reset();
    AppPro.toggleForm('item-form');
    AppPro.loadItems();
  },

  loadItems: () => {
    const items = DB.get('gks_items');

    const html = items.map(item => {
      const statusClass = item.stock > 10 ? 'badge-success' : (item.stock > 0 ? 'badge-warning' : 'badge-danger');
      const statusText = item.stock > 10 ? 'In Stock' : (item.stock > 0 ? 'Low Stock' : 'Out of Stock');

      return `
        <tr>
          <td><strong>${item.name}</strong></td>
          <td><span class="badge-custom badge-info">${item.rentalType === 'day' ? 'Per Day' : 'Per Month'}</span></td>
          <td>₹${item.rate.toFixed(2)} / ${item.rentalType}</td>
          <td><strong>${item.stock}</strong></td>
          <td><span class="badge-custom ${statusClass}">${statusText}</span></td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="AppPro.removeItem(${item.id})">
              <i class="fas fa-trash"></i> Remove
            </button>
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('items-table').innerHTML = html || '<tr><td colspan="6" class="text-center text-muted">No items yet</td></tr>';
  },

  removeItem: (id) => {
    const transactions = DB.get('gks_transactions');
    const isUsedInTransactions = transactions.some(t => (t.items || []).some(it => it.id == id));

    if (isUsedInTransactions) {
      AppPro.toast('Cannot remove item that is already used in transactions.', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to remove this item?')) return;

    let items = DB.get('gks_items');
    items = items.filter(i => i.id != id);
    DB.update('gks_items', items);
    AppPro.toast('Item removed successfully!', 'success');
    AppPro.loadItems();
    AppPro.loadDropdowns();
  },

  // ========== BOOKING SYSTEM ==========
  saveBooking: (e) => {
    e.preventDefault();
    const projectEl = document.getElementById('booking-project');
    const booking = {
      id: Date.now(),
      bookingId: 'BKG' + Date.now().toString().slice(-6),
      clientId: document.getElementById('booking-client').value,
      projectId: projectEl ? projectEl.value : '',
      bookingDate: document.getElementById('booking-date').value,
      requiredDate: document.getElementById('booking-required').value,
      items: document.getElementById('booking-items').value,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    DB.add('gks_bookings', booking);
    AppPro.toast('Booking confirmed successfully!', 'success');

    // Send WhatsApp notification to store owner about this booking
    try {
      const clients = DB.get('gks_clients');
      const projects = DB.get('gks_projects');
      const client = clients.find(c => c.id == booking.clientId);
      const project = projects.find(p => p.id == booking.projectId);

      const ownerPhone = APP_CONFIG.ownerPhone;
      const msgLines = [
        'New booking received ✅',
        '',
        `Booking ID: ${booking.bookingId}`,
        `Client: ${client?.name || 'Unknown'}`,
        `Mobile: ${client?.mobile || '-'}`,
        project ? `Project: ${project.name} - ${project.location}` : '',
        `Booking Date: ${booking.bookingDate}`,
        `Required Date: ${booking.requiredDate}`,
        '',
        'Items:',
        booking.items,
        '',
        'GKS Rent Pro'
      ].filter(Boolean);

      const ownerUrl = `https://wa.me/91${ownerPhone}?text=${encodeURIComponent(msgLines.join('\n'))}`;
      window.open(ownerUrl, '_blank');
    } catch (err) {
      console.error('Error while preparing owner WhatsApp notification', err);
    }

    e.target.reset();
    AppPro.loadBookings();
  },

  loadBookings: () => {
    const bookings = DB.get('gks_bookings');
    const clients = DB.get('gks_clients');

    const html = bookings.map(booking => {
      const client = clients.find(c => c.id == booking.clientId);
      const statusColors = {
        pending: 'badge-warning',
        confirmed: 'badge-success',
        cancelled: 'badge-danger'
      };

      return `
        <tr>
          <td><strong>${booking.bookingId}</strong></td>
          <td>${client?.name || 'Unknown'}</td>
          <td>${booking.bookingDate}</td>
          <td>${booking.requiredDate}</td>
          <td>${booking.items}</td>
          <td><span class="badge-custom ${statusColors[booking.status]}">${booking.status.toUpperCase()}</span></td>
          <td>
            <button class="btn btn-sm btn-success" onclick="AppPro.confirmBooking(${booking.id})">
              <i class="fas fa-check"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="AppPro.cancelBooking(${booking.id})">
              <i class="fas fa-times"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('bookings-table').innerHTML = html || '<tr><td colspan="7" class="text-center text-muted">No bookings yet</td></tr>';
  },

  confirmBooking: (id) => {
    let bookings = DB.get('gks_bookings');
    const booking = bookings.find(b => b.id == id);
    if (booking) {
      booking.status = 'confirmed';
      DB.update('gks_bookings', bookings);
      AppPro.toast('Booking confirmed!', 'success');
      AppPro.loadBookings();
    }
  },

  cancelBooking: (id) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      let bookings = DB.get('gks_bookings');
      const booking = bookings.find(b => b.id == id);
      if (booking) {
        booking.status = 'cancelled';
        DB.update('gks_bookings', bookings);
        AppPro.toast('Booking cancelled!', 'warning');
        AppPro.loadBookings();
      }
    }
  },

  // ========== BILL CONFIRMATION MODAL ==========
  openBillConfirmModal: () => {
    const modal = document.getElementById('bill-confirm-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  closeBillConfirmModal: () => {
    const modal = document.getElementById('bill-confirm-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  handleBillConfirmation: (sendOnWhatsApp) => {
    AppPro.closeBillConfirmModal();
    // Save IN transaction with or without WhatsApp sending
    AppPro.saveTransaction('IN', { sendWhatsApp: !!sendOnWhatsApp });
  },

  // ========== MATERIAL OUT (WITH MULTIPLE ITEMS) ==========
  addToCart: (type) => {
    const itemId = document.getElementById(`${type}-item`).value;
    if (!itemId) {
      AppPro.toast('Please select an item!', 'warning');
      return;
    }

    const items = DB.get('gks_items');
    const item = items.find(i => i.id == itemId);

    if (!item) {
      AppPro.toast('Item not found!', 'danger');
      return;
    }

    const qty = parseInt(document.getElementById(`${type}-qty`).value) || 1;

    if (type === 'out') {
      // Check stock
      if (item.stock < qty) {
        AppPro.toast(`Insufficient stock! Available: ${item.stock}`, 'danger');
        return;
      }

      const lineTotal = qty * item.rate;

      AppPro.cart.push({
        itemId: item.id,
        name: item.name,
        qty: qty,
        rentalType: item.rentalType,
        rate: item.rate,
        lineTotal: lineTotal
      });

      AppPro.renderCart('out');
      document.getElementById('out-qty').value = 1;
    } else {
      // Material IN
      const duration = parseInt(document.getElementById('in-duration').value) || 1;
      const lineTotal = qty * duration * item.rate;

      AppPro.cart.push({
        itemId: item.id,
        name: item.name,
        qty: qty,
        duration: duration,
        rentalType: item.rentalType,
        rate: item.rate,
        total: lineTotal
      });

      AppPro.renderCart('in');
      document.getElementById('in-qty').value = 1;
      document.getElementById('in-duration').value = 1;
      document.getElementById('in-line-total').value = '';
    }
  },

  renderCart: (type) => {
    if (type === 'out') {
      let grandTotal = 0;
      const html = AppPro.cart.map((item, idx) => {
        const lineTotal = item.lineTotal ?? (item.qty * item.rate);
        grandTotal += lineTotal;
        return `
        <tr>
          <td>${item.name}</td>
          <td>${item.qty}</td>
          <td><span class="badge-custom badge-info">${item.rentalType === 'day' ? 'Per Day' : 'Per Month'}</span></td>
          <td>₹${item.rate}</td>
          <td>₹${lineTotal.toFixed(2)}</td>
          <td>
            <i class="fas fa-times remove-btn" onclick="AppPro.removeFromCart(${idx})"></i>
          </td>
        </tr>
      `;
      }).join('');

      const outCartEl = document.getElementById('out-cart');
      if (outCartEl) {
        outCartEl.innerHTML = html || '<tr><td colspan="6" class="text-center text-muted">No items added yet</td></tr>';
      }
      const outGrandTotalEl = document.getElementById('out-grand-total');
      if (outGrandTotalEl) {
        outGrandTotalEl.innerText = '₹' + grandTotal.toFixed(2);
      }
    } else {
      let grandTotal = 0;
      const html = AppPro.cart.map((item, idx) => {
        grandTotal += item.total || 0;
        return `
          <tr>
            <td>${item.name} <small class="badge-custom badge-info">${item.rentalType === 'day' ? 'Per Day' : 'Per Month'}</small></td>
            <td>${item.qty}</td>
            <td>${item.duration} ${item.rentalType === 'day' ? 'days' : 'months'}</td>
            <td>₹${item.rate}</td>
            <td>₹${item.total.toFixed(2)}</td>
            <td>
              <i class="fas fa-times remove-btn" onclick="AppPro.removeFromCart(${idx})"></i>
            </td>
          </tr>
        `;
      }).join('');

      const inCartEl = document.getElementById('in-cart');
      if (inCartEl) {
        inCartEl.innerHTML = html || '<tr><td colspan="6" class="text-center text-muted">No items added yet</td></tr>';
      }
      const inGrandEl = document.getElementById('in-grand-total');
      if (inGrandEl) {
        inGrandEl.innerText = '₹' + grandTotal.toFixed(2);
      }
    }
  },

  removeFromCart: (idx) => {
    AppPro.cart.splice(idx, 1);
    const type = document.querySelector('.page-section.active').id.includes('out') ? 'out' : 'in';
    AppPro.renderCart(type);
  },

  updateInItem: () => {
    const itemId = document.getElementById('in-item').value;
    if (!itemId) return;

    const items = DB.get('gks_items');
    const item = items.find(i => i.id == itemId);

    if (item) {
      document.getElementById('in-rate-display').value = `₹${item.rate} / ${item.rentalType}`;
      AppPro.calculateLineTotal('in');
    }
  },

  calculateLineTotal: (type) => {
    const itemId = document.getElementById('in-item').value;
    if (!itemId) return;

    const items = DB.get('gks_items');
    const item = items.find(i => i.id == itemId);

    if (item) {
      const qty = parseInt(document.getElementById('in-qty').value) || 0;
      const duration = parseInt(document.getElementById('in-duration').value) || 0;
      const total = qty * duration * item.rate;
      document.getElementById('in-line-total').value = '₹' + total.toFixed(2);
    }
  },

  saveTransaction: (type, options = {}) => {
    const clientId = document.getElementById(`${type === 'OUT' ? 'out' : 'in'}-client`).value;
    const projectElId = `${type === 'OUT' ? 'out' : 'in'}-project`;
    const projectEl = document.getElementById(projectElId);
    const projectId = projectEl ? projectEl.value : '';

    if (!clientId) {
      AppPro.toast('Please select client!', 'danger');
      return;
    }

    if (AppPro.cart.length === 0) {
      AppPro.toast('Please add items to cart!', 'danger');
      return;
    }

    let grandTotal = 0;
    if (type === 'IN') {
      grandTotal = AppPro.cart.reduce((sum, item) => sum + (item.total || 0), 0);
    } else if (type === 'OUT') {
      grandTotal = AppPro.cart.reduce((sum, item) => {
        const lineTotal = item.lineTotal ?? (item.qty * item.rate);
        return sum + lineTotal;
      }, 0);
    }

    const transaction = {
      id: Date.now(),
      invoiceNo: type + Date.now().toString().slice(-6),
      clientId: clientId,
      projectId: projectId || null,
      type: type,
      date: document.getElementById(`${type === 'OUT' ? 'out' : 'in'}-date`).value,
      items: [...AppPro.cart],
      grandTotal: grandTotal,
      createdAt: new Date().toISOString()
    };

    // Update stock
    let items = DB.get('gks_items');
    AppPro.cart.forEach(cartItem => {
      const item = items.find(i => i.id == cartItem.itemId);
      if (item) {
        if (type === 'OUT') {
          item.stock -= cartItem.qty;
        } else {
          item.stock += cartItem.qty;
        }
      }
    });
    DB.update('gks_items', items);

    DB.add('gks_transactions', transaction);

    // Update loyalty points for billing
    if (type === 'IN') {
      AppPro.updateLoyaltyPoints(clientId, grandTotal);
    }

    AppPro.toast(`${type === 'OUT' ? 'Challan' : 'Bill'} generated successfully!`, 'success');

    // Optional: send bill to client on WhatsApp for IN transactions
    if (type === 'IN' && options.sendWhatsApp) {
      AppPro.sendBillOnWhatsApp(transaction);
    }

    // Prepare structured printable invoice and print using a snapshot of transaction data.
    AppPro.printTransaction(transaction);
  },

  // ========== PAYMENTS ==========
  savePayment: (e) => {
    e.preventDefault();

    const payment = {
      id: Date.now(),
      receiptNo: 'RCP' + Date.now().toString().slice(-6),
      clientId: document.getElementById('pay-client').value,
      mode: document.getElementById('pay-mode').value,
      amount: parseFloat(document.getElementById('pay-amount').value),
      reference: document.getElementById('pay-ref').value,
      date: document.getElementById('pay-date').value,
      createdAt: new Date().toISOString()
    };

    DB.add('gks_payments', payment);
    AppPro.toast('Payment recorded successfully!', 'success');
    e.target.reset();
    AppPro.loadOutstanding();
  },

  loadOutstanding: () => {
    const clients = DB.get('gks_clients');
    const transactions = DB.get('gks_transactions');
    const payments = DB.get('gks_payments');

    const html = clients.map(client => {
      let outstanding = 0;

      transactions.filter(t => t.clientId == client.id && t.type === 'IN').forEach(t => {
        outstanding += t.grandTotal || 0;
      });

      payments.filter(p => p.clientId == client.id).forEach(p => {
        outstanding -= p.amount || 0;
      });

      if (outstanding > 0) {
        return `
          <tr>
            <td>${client.name}</td>
            <td class="text-end text-danger fw-bold">₹${outstanding.toFixed(2)}</td>
          </tr>
        `;
      }
      return '';
    }).join('');

    document.getElementById('outstanding-list').innerHTML = html || '<tr><td colspan="2" class="text-center text-muted">All clear!</td></tr>';
  },

  // ========== SECURITY DEPOSITS ==========
  saveDeposit: (e) => {
    e.preventDefault();

    const deposit = {
      id: Date.now(),
      clientId: document.getElementById('deposit-client').value,
      amount: parseFloat(document.getElementById('deposit-amount').value),
      date: document.getElementById('deposit-date').value,
      notes: document.getElementById('deposit-notes').value,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    DB.add('gks_deposits', deposit);
    AppPro.toast('Security deposit recorded!', 'success');
    e.target.reset();
    AppPro.toggleForm('deposit-form');
    AppPro.loadDeposits();
  },

  loadDeposits: () => {
    const deposits = DB.get('gks_deposits');
    const clients = DB.get('gks_clients');

    const html = deposits.map(deposit => {
      const client = clients.find(c => c.id == deposit.clientId);
      return `
        <tr>
          <td>${client?.name || 'Unknown'}</td>
          <td class="fw-bold">₹${deposit.amount.toFixed(2)}</td>
          <td>${deposit.date}</td>
          <td><span class="badge-custom ${deposit.status === 'active' ? 'badge-success' : 'badge-danger'}">${deposit.status.toUpperCase()}</span></td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="AppPro.refundDeposit(${deposit.id})">
              <i class="fas fa-undo"></i> Refund
            </button>
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('deposits-table').innerHTML = html || '<tr><td colspan="5" class="text-center text-muted">No deposits yet</td></tr>';
  },

  refundDeposit: (id) => {
    if (confirm('Are you sure you want to refund this deposit?')) {
      let deposits = DB.get('gks_deposits');
      const deposit = deposits.find(d => d.id == id);
      if (deposit) {
        deposit.status = 'refunded';
        DB.update('gks_deposits', deposits);
        AppPro.toast('Deposit refunded!', 'success');
        AppPro.loadDeposits();
      }
    }
  },

  // ========== STAFF MANAGEMENT ==========
  saveStaff: (e) => {
    e.preventDefault();

    const staff = {
      id: Date.now(),
      name: document.getElementById('staff-name').value,
      mobile: document.getElementById('staff-mobile').value,
      role: document.getElementById('staff-role').value,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    DB.add('gks_staff', staff);
    AppPro.toast('Staff member added!', 'success');
    e.target.reset();
    AppPro.toggleForm('staff-form');
    AppPro.loadStaff();
  },

  loadStaff: () => {
    const staff = DB.get('gks_staff');

    if (staff.length === 0) {
      document.getElementById('staff-list').innerHTML = '<div class="col-12 text-center text-muted p-4">No staff members yet</div>';
      return;
    }

    const html = staff.map(member => `
      <div class="col-md-6">
        <div class="staff-card">
          <div class="staff-header">
            <div class="staff-avatar">${member.name.charAt(0).toUpperCase()}</div>
            <div class="staff-info">
              <h6>${member.name}</h6>
              <small>${member.role} | ${member.mobile}</small>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="badge-custom badge-success">${member.status.toUpperCase()}</span>
            <button class="btn btn-sm btn-danger" onclick="AppPro.removeStaff(${member.id})">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
      </div>
    `).join('');

    document.getElementById('staff-list').innerHTML = html;
  },

  removeStaff: (id) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      let staff = DB.get('gks_staff');
      staff = staff.filter(s => s.id != id);
      DB.update('gks_staff', staff);
      AppPro.toast('Staff member removed!', 'warning');
      AppPro.loadStaff();
    }
  },

  // ========== WHATSAPP INTEGRATION ==========
  getMonthlyDuesForClient: (clientId) => {
    const transactions = DB.get('gks_transactions')
      .filter(t => t.clientId == clientId && t.type === 'IN')
      .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
    const payments = DB.get('gks_payments')
      .filter(p => p.clientId == clientId)
      .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));

    const billEntries = transactions.map(t => ({
      monthKey: (t.date || new Date(t.createdAt).toISOString().split('T')[0]).slice(0, 7),
      billed: parseFloat(t.grandTotal || 0),
      remaining: parseFloat(t.grandTotal || 0)
    }));

    let totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    billEntries.forEach(entry => {
      if (totalPaid <= 0 || entry.remaining <= 0) return;
      const used = Math.min(totalPaid, entry.remaining);
      entry.remaining -= used;
      totalPaid -= used;
    });

    const monthlyHistoryMap = {};
    billEntries.forEach(entry => {
      if (!monthlyHistoryMap[entry.monthKey]) {
        monthlyHistoryMap[entry.monthKey] = { billed: 0, due: 0 };
      }
      monthlyHistoryMap[entry.monthKey].billed += entry.billed;
      monthlyHistoryMap[entry.monthKey].due += Math.max(0, entry.remaining);
    });

    return Object.keys(monthlyHistoryMap)
      .sort((a, b) => a.localeCompare(b))
      .map(monthKey => ({
        monthKey,
        billed: monthlyHistoryMap[monthKey].billed,
        due: monthlyHistoryMap[monthKey].due
      }));
  },

  formatMonthLabel: (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  },

  renderWhatsAppClientHistory: (clientId) => {
    const historySection = document.getElementById('wa-history-section');
    const historyTable = document.getElementById('wa-history-table');
    const totalBilledEl = document.getElementById('wa-history-total-billed');
    const totalPaidEl = document.getElementById('wa-history-total-paid');
    const totalDueEl = document.getElementById('wa-history-total-due');

    if (!historySection || !historyTable || !totalBilledEl || !totalPaidEl || !totalDueEl) return;

    if (!clientId) {
      historySection.style.display = 'none';
      historyTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Select client to view history</td></tr>';
      totalBilledEl.innerText = '₹0.00';
      totalPaidEl.innerText = '₹0.00';
      totalDueEl.innerText = '₹0.00';
      return;
    }

    const monthlyDueRows = AppPro.getMonthlyDuesForClient(clientId);
    const transactions = DB.get('gks_transactions')
      .filter(t => t.clientId == clientId && t.type === 'IN');
    const payments = DB.get('gks_payments')
      .filter(p => p.clientId == clientId);

    const paidByMonth = {};
    payments.forEach(p => {
      const monthKey = (p.date || new Date(p.createdAt).toISOString().split('T')[0]).slice(0, 7);
      paidByMonth[monthKey] = (paidByMonth[monthKey] || 0) + parseFloat(p.amount || 0);
    });

    const rows = monthlyDueRows.map(row => ({
      monthKey: row.monthKey,
      billed: row.billed,
      paid: paidByMonth[row.monthKey] || 0,
      due: row.due
    }));

    const totalBilled = transactions.reduce((sum, t) => sum + parseFloat(t.grandTotal || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalDue = rows.reduce((sum, row) => sum + row.due, 0);

    totalBilledEl.innerText = `₹${totalBilled.toFixed(2)}`;
    totalPaidEl.innerText = `₹${totalPaid.toFixed(2)}`;
    totalDueEl.innerText = `₹${totalDue.toFixed(2)}`;

    if (rows.length === 0) {
      historyTable.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No billing/payment history found</td></tr>';
    } else {
      historyTable.innerHTML = rows.map(row => `
        <tr>
          <td>${AppPro.formatMonthLabel(row.monthKey)}</td>
          <td class="text-end">₹${row.billed.toFixed(2)}</td>
          <td class="text-end">₹${row.paid.toFixed(2)}</td>
          <td class="text-end ${row.due > 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}">₹${row.due.toFixed(2)}</td>
        </tr>
      `).join('');
    }

    historySection.style.display = 'block';
  },

  getDuePaymentLinks: (amount) => {
    const safeAmount = Number(amount || 0);
    if (!safeAmount || safeAmount <= 0) return { upiLink: '', qrImageUrl: '' };

    const upiLink = `upi://pay?pa=${APP_CONFIG.upiId}&pn=${APP_CONFIG.upiPayeeName}&am=${safeAmount.toFixed(2)}&cu=INR`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
    return { upiLink, qrImageUrl };
  },

  loadWhatsAppTemplate: () => {
    const type = document.getElementById('wa-type').value;
    const clientId = document.getElementById('wa-client').value;
    const monthlyDueGroup = document.getElementById('wa-monthly-due-group');
    const monthlyDueSelect = document.getElementById('wa-monthly-due');

    if (!clientId || !type) {
      if (monthlyDueGroup) monthlyDueGroup.style.display = 'none';
      AppPro.renderWhatsAppClientHistory(clientId);
      document.getElementById('wa-message').value = '';
      document.getElementById('wa-preview').style.display = 'none';
      return;
    }

    const clients = DB.get('gks_clients');
    const client = clients.find(c => c.id == clientId);

    if (!client) return;
    AppPro.renderWhatsAppClientHistory(clientId);

    let message = '';
    if (type === 'total-due') {
      const monthlyHistory = AppPro.getMonthlyDuesForClient(clientId);
      const totalDue = monthlyHistory.reduce((sum, row) => sum + row.due, 0);

      if (monthlyDueGroup && monthlyDueSelect) {
        if (monthlyHistory.length > 0) {
          monthlyDueGroup.style.display = 'block';

          if (!monthlyDueSelect.dataset.loadedFor || monthlyDueSelect.dataset.loadedFor !== String(clientId)) {
            monthlyDueSelect.innerHTML = '<option value="">Choose month...</option>' +
              monthlyHistory.map(row => `<option value="${row.monthKey}">${AppPro.formatMonthLabel(row.monthKey)} | Bill: ₹${row.billed.toFixed(2)} | Due: ₹${row.due.toFixed(2)}</option>`).join('');
            monthlyDueSelect.dataset.loadedFor = String(clientId);
          }
        } else {
          monthlyDueGroup.style.display = 'none';
          monthlyDueSelect.innerHTML = '<option value="">Choose month...</option>';
          monthlyDueSelect.dataset.loadedFor = String(clientId);
        }
      }

      if (monthlyHistory.length === 0) {
        message = `Dear ${client.name},

You currently have no pending due amount in our records.

Thank you,
GKS Rent Pro`;
      } else {
        const selectedMonth = monthlyDueSelect ? monthlyDueSelect.value : '';
        const selectedMonthDue = monthlyHistory.find(row => row.monthKey === selectedMonth);
        const payableAmount = selectedMonthDue ? selectedMonthDue.due : totalDue;
        const { upiLink } = AppPro.getDuePaymentLinks(payableAmount);

        message = `Dear ${client.name},

Your total pending due amount is ₹${totalDue.toFixed(2)}.` +
          (selectedMonthDue
            ? `\n\nSelected month (${AppPro.formatMonthLabel(selectedMonthDue.monthKey)}): Bill ₹${selectedMonthDue.billed.toFixed(2)}, Due ₹${selectedMonthDue.due.toFixed(2)}.`
            : '\n\nPlease select a month from the Monthly Due dropdown to include that month due in this message.') +
          `\n\nPay now using UPI link:\n${upiLink}` +
          `\n\nKindly clear your outstanding dues at the earliest.\n\nThank you,\nGKS Rent Pro`;
      }
    } else {
      if (monthlyDueGroup) monthlyDueGroup.style.display = 'none';
      if (monthlyDueSelect) {
        monthlyDueSelect.innerHTML = '<option value="">Choose month...</option>';
        delete monthlyDueSelect.dataset.loadedFor;
      }
      message = '';
    }

    document.getElementById('wa-message').value = message;
    document.getElementById('wa-preview').style.display = 'block';
    document.getElementById('wa-preview-text').innerText = message;
  },

  sendWhatsApp: (e) => {
    e.preventDefault();

    const clientId = document.getElementById('wa-client').value;
    const type = document.getElementById('wa-type').value;
    const message = document.getElementById('wa-message').value;
    const monthlyDueSelect = document.getElementById('wa-monthly-due');

    if (!clientId || !message) {
      AppPro.toast('Please select client and enter message!', 'danger');
      return;
    }

    const clients = DB.get('gks_clients');
    const client = clients.find(c => c.id == clientId);

    if (!client || !client.mobile) {
      AppPro.toast('Client mobile number not found!', 'danger');
      return;
    }

    // Open WhatsApp with pre-filled message
    const fullNumber = AppPro.normalizeWhatsAppNumber(client.mobile);
    if (!fullNumber) {
      AppPro.toast('Invalid client mobile number for WhatsApp!', 'danger');
      return;
    }

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${fullNumber}?text=${encodedMessage}`;

    const win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      AppPro.toast('Please allow pop-ups in your browser to open WhatsApp.', 'warning');
      return;
    }
    AppPro.toast('Opening WhatsApp...', 'success');
  },

  // ========== QR CODE GENERATION ==========
  generateQR: () => {
    const type = document.getElementById('qr-type').value;

    // Clear previous QR
    document.getElementById('qr-canvas').innerHTML = '';

    let qrData = '';

    if (type === 'upi') {
      const amount = document.getElementById('qr-amount').value;
      // UPI Payment Link with your UPI ID
      qrData = `upi://pay?pa=${APP_CONFIG.upiId}&pn=${APP_CONFIG.upiPayeeName}&am=${amount}&cu=INR`;
    } else if (type === 'bill') {
      qrData = `https://gksrent.com/verify/${Date.now()}`;
    } else {
      qrData = `BEGIN:VCARD
VERSION:3.0
FN:GKS Rent Pro
TEL:7850832958
EMAIL:info@gksrent.com
END:VCARD`;
    }

    // Generate QR Code
    new QRCode(document.getElementById('qr-canvas'), {
      text: qrData,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    AppPro.lastQRData = qrData;
    document.getElementById('qr-result').style.display = 'block';
    AppPro.toast('QR Code generated!', 'success');
  },

  sendGeneratedQR: () => {
    const clientId = document.getElementById('qr-client')?.value;
    const qrType = document.getElementById('qr-type')?.value || 'upi';
    if (!clientId) {
      AppPro.toast('Please select client to send QR!', 'warning');
      return;
    }

    if (!AppPro.lastQRData) {
      AppPro.toast('Please generate QR first!', 'warning');
      return;
    }

    const clients = DB.get('gks_clients');
    const client = clients.find(c => c.id == clientId);

    if (!client || !client.mobile) {
      AppPro.toast('Client mobile number not found!', 'danger');
      return;
    }

    const fullNumber = AppPro.normalizeWhatsAppNumber(client.mobile);
    if (!fullNumber) {
      AppPro.toast('Invalid client mobile number for WhatsApp!', 'danger');
      return;
    }

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(AppPro.lastQRData)}`;

    let message = `Dear ${client.name},

Please find your QR below:
${qrImageUrl}`;

    if (qrType === 'upi') {
      message += `

You can also use this payment link:
${AppPro.lastQRData}`;
    } else if (qrType === 'bill') {
      message += `

Bill verification link:
${AppPro.lastQRData}`;
    } else {
      message += `

Contact QR details:
${AppPro.lastQRData}`;
    }

    message += `

Thank you,
GKS Rent Pro`;

    const url = `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
    const win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      AppPro.toast('Please allow pop-ups in your browser to open WhatsApp.', 'warning');
      return;
    }
    AppPro.toast('Opening WhatsApp with QR message...', 'success');
  },

  downloadQR: () => {
    const canvas = document.querySelector('#qr-canvas canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `GKS-QR-${Date.now()}.png`;
      link.href = url;
      link.click();
      AppPro.toast('QR Code downloaded!', 'success');
    }
  },

  updateQRForm: () => {
    const type = document.getElementById('qr-type').value;
    // Can add different forms based on QR type if needed
  },

  // Reusable QR generator for UPI links (used for WhatsApp / billing)
  generatePaymentQR: (upiLink, options = {}) => {
    const targetId = options.targetId;
    const openInNewTab = options.openInNewTab !== false; // default true when no targetId

    let container;
    if (targetId) {
      container = document.getElementById(targetId);
      if (!container) return;
      container.innerHTML = '';
    } else {
      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);
    }

    new QRCode(container, {
      text: upiLink,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    const canvas = container.querySelector('canvas');
    if (canvas && openInNewTab) {
      const url = canvas.toDataURL('image/png');
      window.open(url, '_blank');
    }

    if (!targetId) {
      // Clean up temporary container after a short delay
      setTimeout(() => {
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 1000);
    }
  },

  // Normalize phone number for WhatsApp (avoid double country code, strip non-digits)
  normalizeWhatsAppNumber: (mobile) => {
    if (!mobile) return null;
    let digits = String(mobile).replace(/[^0-9]/g, '');
    if (!digits) return null;

    // Remove leading zero if present
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    // If already includes country code 91 and longer than 10 digits, keep last 10 as local
    if (digits.length > 10 && digits.startsWith('91')) {
      digits = digits.slice(-10);
    }

    if (digits.length !== 10) {
      return null;
    }

    const countryCode = '91';
    return countryCode + digits;
  },

  // Build printable invoice HTML into the dedicated template container
  buildPrintInvoice: (transaction) => {
    const container = document.getElementById('print-invoice-template');
    if (!container || !transaction) return;

    const clients = DB.get('gks_clients');
    const client = clients.find(c => c.id == transaction.clientId);

    const typeLabel = transaction.type === 'IN' ? 'TAX INVOICE' : 'DELIVERY CHALLAN';
    const items = transaction.items || [];

    const rowsHtml = items.map((it, idx) => {
      const qty = it.qty || 0;
      const duration = it.duration || '';
      const rate = it.rate || 0;
      const lineTotal = (it.total ?? it.lineTotal ?? (qty * rate)) || 0;
      const durationText = transaction.type === 'IN'
        ? (duration ? `${duration} ${it.rentalType === 'day' ? 'days' : 'months'}` : '-')
        : '-';
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${it.name || ''}</td>
          <td>${qty}</td>
          <td>${durationText}</td>
          <td>₹${rate.toFixed(2)}</td>
          <td>₹${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const grandTotal = transaction.grandTotal || 0;

    container.innerHTML = `
      <div class="print-header">
        <h2>G.K.S RENT</h2>
        <div class="print-meta">
          <div>Professional Construction Material Management</div>
          <div>Phone: 7850832958</div>
        </div>
      </div>

      <h3>${typeLabel}</h3>

      <div class="print-meta">
        <div><strong>Invoice No:</strong> ${transaction.invoiceNo}</div>
        <div><strong>Date:</strong> ${transaction.date || new Date(transaction.createdAt).toISOString().split('T')[0]}</div>
      </div>

      <div class="print-meta" style="margin-top: 8px;">
        <div><strong>Client:</strong> ${client?.name || 'N/A'}</div>
        <div><strong>Mobile:</strong> ${client?.mobile || '-'}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Duration</th>
            <th>Rate</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="6">No items</td></tr>'}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="text-right fw-bold">GRAND TOTAL</td>
            <td class="fw-bold">₹${grandTotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div class="print-signature">
        <div>
          <div>Receiver Signature</div>
          <div>__________________________</div>
        </div>
        <div class="text-right">
          <div>For G.K.S RENT</div>
          <div>Authorised Signatory</div>
          <div>__________________________</div>
        </div>
      </div>

      <div class="print-footer">
        <small>Thank you for your business. Please retain this ${transaction.type === 'IN' ? 'invoice' : 'challan'} for your records.</small>
      </div>
    `;
  },

  // Prepare invoice, attach onafterprint, then trigger print
  printTransaction: (transaction) => {
    const container = document.getElementById('print-invoice-template');
    if (!container || !transaction) {
      window.print();
      return;
    }

    AppPro.buildPrintInvoice(transaction);
    container.style.display = 'block';

    const previousHandler = window.onafterprint;
    window.onafterprint = () => {
      // Reset cart and UI only after printing is completed
      AppPro.cart = [];
      const cartType = transaction.type === 'OUT' ? 'out' : 'in';
      AppPro.renderCart(cartType);

      container.innerHTML = '';
      container.style.display = 'none';

      if (typeof previousHandler === 'function') {
        previousHandler();
      }
      // Restore previous handler to avoid leaking this behaviour
      window.onafterprint = previousHandler || null;
    };

    window.print();
  },

  // ========== BILL WHATSAPP SENDER ==========
  sendBillOnWhatsApp: (transaction) => {
    if (!transaction || !transaction.clientId) return;

    const clients = DB.get('gks_clients');
    const client = clients.find(c => c.id == transaction.clientId);
    if (!client || !client.mobile) {
      AppPro.toast('Cannot send bill on WhatsApp: client mobile not found', 'danger');
      return;
    }

    const lineItems = (transaction.items || []).map((it, idx) => {
      const qtyPart = `Qty: ${it.qty}`;
      const durPart = it.duration ? `, Duration: ${it.duration} ${it.rentalType === 'day' ? 'days' : 'months'}` : '';
      const ratePart = `, Rate: ₹${it.rate}`;
      const lineTotal = (it.total ?? it.lineTotal ?? (it.qty * it.rate)) || 0;
      const totalPart = `, Line Total: ₹${lineTotal.toFixed(2)}`;
      return `${idx + 1}. ${it.name} (${qtyPart}${durPart}${ratePart}${totalPart})`;
    }).join('\n');

    const grandTotal = transaction.grandTotal || 0;
    const upiLink = `upi://pay?pa=${APP_CONFIG.upiId}&pn=${APP_CONFIG.upiPayeeName}&am=${grandTotal.toFixed(2)}&cu=INR`;

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;

    const msgLines = [
      `Dear ${client.name},`,
      '',
      'Your bill from GKS Rent is ready.',
      '',
      `Invoice No: ${transaction.invoiceNo}`,
      `Bill Date: ${transaction.date}`,
      '',
      'Items:',
      lineItems,
      '',
      `Grand Total: ₹${grandTotal.toFixed(2)}`,
      '',
      'You can pay instantly using this UPI link:',
      upiLink,
      '',
      'QR Code (open/share this image):',
      qrImageUrl,
      '',
      'Thank you for your business!',
      'GKS Rent Pro'
    ].filter(Boolean);

    const fullNumber = AppPro.normalizeWhatsAppNumber(client.mobile);
    if (!fullNumber) {
      AppPro.toast('Invalid client mobile number for WhatsApp!', 'danger');
      return;
    }

    const url = `https://wa.me/${fullNumber}?text=${encodeURIComponent(msgLines.join('\n'))}`;
    const win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      AppPro.toast('Please allow pop-ups in your browser to open WhatsApp.', 'warning');
      return;
    }
    AppPro.toast('Opening WhatsApp with bill...', 'success');
  },

  // ========== LOYALTY PROGRAM ==========
  updateLoyaltyPoints: (clientId, amount) => {
    let clients = DB.get('gks_clients');
    const client = clients.find(c => c.id == clientId);

    if (client) {
      // 1 point per ₹100 spent
      const points = Math.floor(amount / 100);
      client.loyaltyPoints = (client.loyaltyPoints || 0) + points;
      DB.update('gks_clients', clients);
    }
  },

  loadLoyalty: () => {
    const clients = DB.get('gks_clients').filter(c => (c.loyaltyPoints || 0) > 0);

    const html = clients.map(client => {
      const points = client.loyaltyPoints || 0;
      let tier = 'Silver';
      let tierClass = 'badge-info';

      if (points >= 1000) {
        tier = 'Platinum';
        tierClass = 'badge-primary';
      } else if (points >= 500) {
        tier = 'Gold';
        tierClass = 'badge-warning';
      }

      const discount = Math.floor(points / 100) * 100;

      return `
        <tr>
          <td>${client.name}</td>
          <td class="fw-bold text-success">${points} pts</td>
          <td><span class="badge-custom ${tierClass}">${tier}</span></td>
          <td class="text-primary fw-bold">₹${discount}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="AppPro.redeemPoints(${client.id})">
              <i class="fas fa-gift"></i> Redeem
            </button>
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('loyalty-table').innerHTML = html || '<tr><td colspan="5" class="text-center text-muted">No clients with loyalty points yet</td></tr>';
  },

  redeemPoints: (clientId) => {
    let clients = DB.get('gks_clients');
    const client = clients.find(c => c.id == clientId);

    if (client && client.loyaltyPoints >= 100) {
      const discount = Math.floor(client.loyaltyPoints / 100) * 100;

      if (confirm(`Redeem ${client.loyaltyPoints} points for ₹${discount} discount?`)) {
        client.loyaltyPoints = client.loyaltyPoints % 100;
        DB.update('gks_clients', clients);
        AppPro.toast(`₹${discount} discount applied!`, 'success');
        AppPro.loadLoyalty();
      }
    } else {
      AppPro.toast('Minimum 100 points required to redeem!', 'warning');
    }
  },

  // ========== REPORTS & LEDGER ==========
  loadLedger: () => {
    const clientId = document.getElementById('report-client').value;
    if (!clientId) return;

    const clients = DB.get('gks_clients');
    const transactions = DB.get('gks_transactions');
    const payments = DB.get('gks_payments');

    const client = clients.find(c => c.id == clientId);
    document.getElementById('ledger-title').innerText = `${client.name} - LEDGER`;

    let balance = 0;
    const allEntries = [];

    // Add transactions
    transactions.filter(t => t.clientId == clientId).forEach(t => {
      // Business rule: only IN (bills) affect debit; OUT is informational here
      if (t.type === 'OUT') {
        allEntries.push({
          date: t.date,
          desc: `Material OUT - ${t.invoiceNo}`,
          debit: 0,
          credit: 0
        });
      } else {
        allEntries.push({
          date: t.date,
          desc: `Bill Generated - ${t.invoiceNo}`,
          debit: t.grandTotal || 0,
          credit: 0
        });
      }
    });

    // Add payments
    payments.filter(p => p.clientId == clientId).forEach(p => {
      allEntries.push({
        date: p.date,
        desc: `Payment Received - ${p.receiptNo} (${p.mode.toUpperCase()})`,
        debit: 0,
        credit: p.amount
      });
    });

    // Sort by date
    allEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    const html = allEntries.map(entry => {
      balance += (entry.debit - entry.credit);
      return `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.desc}</td>
          <td class="text-end text-danger">${entry.debit > 0 ? '₹' + entry.debit.toFixed(2) : '-'}</td>
          <td class="text-end text-success">${entry.credit > 0 ? '₹' + entry.credit.toFixed(2) : '-'}</td>
          <td class="text-end fw-bold ${balance > 0 ? 'text-danger' : 'text-success'}">₹${balance.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    document.getElementById('ledger-table').innerHTML = html || '<tr><td colspan="5" class="text-center text-muted">No transactions</td></tr>';
    document.getElementById('final-balance').innerText = '₹' + balance.toFixed(2);
    document.getElementById('final-balance').className = `text-end ${balance > 0 ? 'text-danger' : 'text-success'}`;
  },

  // ========== DASHBOARD ==========
  loadDashboard: () => {
    const clients = DB.get('gks_clients');
    const projects = DB.get('gks_projects');
    const transactions = DB.get('gks_transactions');
    const payments = DB.get('gks_payments');

    // Stats
    document.getElementById('stat-clients').innerText = clients.length;
    document.getElementById('stat-projects').innerText = projects.filter(p => p.status === 'active').length;

    // Today's revenue
    const today = new Date().toISOString().split('T')[0];
    const todayRevenue = payments
      .filter(p => p.date === today)
      .reduce((sum, p) => sum + p.amount, 0);
    document.getElementById('stat-revenue').innerText = '₹' + todayRevenue.toFixed(0);

    // Outstanding
    let totalOutstanding = 0;
    clients.forEach(client => {
      let due = 0;
      transactions.filter(t => t.clientId == client.id && t.type === 'IN').forEach(t => {
        due += t.grandTotal || 0;
      });
      payments.filter(p => p.clientId == client.id).forEach(p => {
        due -= p.amount || 0;
      });
      if (due > 0) totalOutstanding += due;
    });
    document.getElementById('stat-outstanding').innerText = '₹' + totalOutstanding.toFixed(0);

    // Recent Activity
    const recent = [...transactions, ...payments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    const html = recent.map(item => {
      const client = clients.find(c => c.id == item.clientId);
      const isPayment = item.receiptNo !== undefined;
      const type = isPayment ? 'Payment' : (item.type === 'OUT' ? 'Material OUT' : 'Billing');
      const badgeClass = isPayment ? 'badge-success' : (item.type === 'OUT' ? 'badge-primary' : 'badge-danger');
      const amount = isPayment ? item.amount : (item.grandTotal || 0);

      return `
        <tr>
          <td>${item.date || new Date(item.createdAt).toISOString().split('T')[0]}</td>
          <td>${client?.name || 'Unknown'}</td>
          <td><span class="badge-custom ${badgeClass}">${type}</span></td>
          <td class="text-end fw-bold">₹${amount.toFixed(2)}</td>
          <td><span class="badge-custom badge-success">Completed</span></td>
        </tr>
      `;
    }).join('');

    document.getElementById('recent-activity').innerHTML = html || '<tr><td colspan="5" class="text-center text-muted">No recent activity</td></tr>';
  },

  // ========== UTILITIES ==========
  loadDropdowns: () => {
    const clients = DB.get('gks_clients');
    const items = DB.get('gks_items');

    const clientOptions = '<option value="">Choose...</option>' +
      clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const itemOptions = '<option value="">Select Item...</option>' +
      items.map(i => `<option value="${i.id}" data-rate="${i.rate}" data-type="${i.rentalType}">${i.name} (Stock: ${i.stock}) - ₹${i.rate}/${i.rentalType}</option>`).join('');

    // Populate all client dropdowns
    ['out-client', 'in-client', 'pay-client', 'report-client', 'wa-client', 'booking-client', 'project-client', 'deposit-client', 'qr-client'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = clientOptions;
    });

    // Populate item dropdowns
    ['out-item', 'in-item'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = itemOptions;
        el.addEventListener('change', function() {
          const selected = this.options[this.selectedIndex];
          const rate = selected.getAttribute('data-rate');
          const type = selected.getAttribute('data-type');
          const displayEl = document.getElementById(`${id.split('-')[0]}-rate-display`);
          if (displayEl) {
            displayEl.value = `₹${rate} / ${type}`;
          }
        });
      }
    });

    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(el => {
      if (!el.value) el.value = today;
    });
  },

  loadClientProjects: (section) => {
    const clientId = document.getElementById(`${section}-client`).value;
    if (!clientId) return;

    const projects = DB.get('gks_projects').filter(p => p.clientId == clientId);

    const options = '<option value="">Choose...</option>' +
      projects.map(p => `<option value="${p.id}">${p.name} - ${p.location}</option>`).join('');

    const el = document.getElementById(`${section}-project`);
    if (el) el.innerHTML = options || '<option value="">No projects for this client</option>';
  },

  toggleForm: (formId) => {
    const form = document.getElementById(formId);
    if (form) {
      form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    }
  },

  toast: (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-item';

    const icons = {
      success: 'fa-check-circle text-success',
      danger: 'fa-exclamation-circle text-danger',
      warning: 'fa-exclamation-triangle text-warning',
      info: 'fa-info-circle text-info'
    };

    toast.innerHTML = `
      <i class="fas ${icons[type]}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // ========== SEARCH ==========
  openSearch: () => {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('search-input').focus();
  },

  closeSearch: () => {
    document.getElementById('search-modal').style.display = 'none';
  },

  performSearch: () => {
    const query = document.getElementById('search-input').value.toLowerCase();
    if (query.length < 2) {
      document.getElementById('search-results').innerHTML = '<p class="text-muted text-center">Type to search...</p>';
      return;
    }

    const clients = DB.get('gks_clients');
    const projects = DB.get('gks_projects');
    const transactions = DB.get('gks_transactions');

    const results = [];

    // Search clients
    clients.filter(c => c.name.toLowerCase().includes(query) || c.mobile.includes(query)).forEach(c => {
      results.push({
        type: 'Client',
        title: c.name,
        subtitle: c.mobile,
        action: () => AppPro.navigate('clients')
      });
    });

    // Search projects
    projects.filter(p => p.name.toLowerCase().includes(query)).forEach(p => {
      results.push({
        type: 'Project',
        title: p.name,
        subtitle: p.location,
        action: () => AppPro.navigate('projects')
      });
    });

    // Search invoices
    transactions.filter(t => t.invoiceNo.toLowerCase().includes(query)).forEach(t => {
      results.push({
        type: 'Invoice',
        title: t.invoiceNo,
        subtitle: `Type: ${t.type} | Date: ${t.date}`,
        action: () => AppPro.navigate('reports')
      });
    });

    if (results.length === 0) {
      document.getElementById('search-results').innerHTML = '<p class="text-muted text-center">No results found</p>';
      return;
    }

    const html = results.map(r => `
      <div class="search-item" onclick="this.dataset.action()">
        <div style="display: flex; justify-content: space-between;">
          <div>
            <strong>${r.title}</strong><br>
            <small class="text-muted">${r.subtitle}</small>
          </div>
          <span class="badge-custom badge-primary">${r.type}</span>
        </div>
      </div>
    `).join('');

    document.getElementById('search-results').innerHTML = html;
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
});
