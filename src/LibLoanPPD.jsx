import React, { useState, useEffect } from 'react';
import { Home, Search, Shield, Plus, Edit2, Check, X, ArrowLeft, Upload, Eye, Calendar, Mail, Phone, User, Building2, FileText, Package, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { EmailService, isEmailConfigured, calculateDaysUntilReturn } from './emailService';

// Komponen Utama
const LibLoanPPD = () => {
  const [page, setPage] = useState('landing');
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminTab, setAdminTab] = useState('applications');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Data States
  const [assets, setAssets] = useState([
    { id: 1, name: 'Meja banquet', quantity: 20, available: 20, active: true, image: '', notes: '', category: 'Meja' },
    { id: 2, name: 'Kerusi banquet (tiada armrest) – kuning', quantity: 42, available: 42, active: true, image: '', notes: '', category: 'Kerusi' },
    { id: 3, name: 'Kerusi banquet (armrest) – kuning', quantity: 24, available: 24, active: true, image: '', notes: '', category: 'Kerusi' },
    { id: 4, name: 'Kerusi banquet (tiada armrest) – biru', quantity: 40, available: 40, active: true, image: '', notes: '', category: 'Kerusi' },
    { id: 5, name: 'Kerusi VVIP', quantity: 5, available: 5, active: true, image: '', notes: '', category: 'Kerusi' },
    { id: 6, name: 'Kerusi VIP', quantity: 8, available: 8, active: true, image: '', notes: '', category: 'Kerusi' },
    { id: 7, name: 'Kerusi Undang (paling besar)', quantity: 2, available: 2, active: true, image: '', notes: '', category: 'Kerusi' },
    { id: 8, name: 'Meja bulat', quantity: 4, available: 4, active: true, image: '', notes: '', category: 'Meja' },
    { id: 9, name: 'Coffee table (side table)', quantity: 3, available: 3, active: true, image: '', notes: '', category: 'Meja' },
    { id: 10, name: 'Meja console', quantity: 2, available: 2, active: true, image: '', notes: '', category: 'Meja' },
    { id: 11, name: 'Karpet merah', quantity: 3, available: 3, active: true, image: '', notes: '', category: 'Karpet & Alas' },
    { id: 12, name: 'Karpet nipis', quantity: 1, available: 1, active: true, image: '', notes: '', category: 'Karpet & Alas' },
    { id: 13, name: 'Dulang', quantity: 1, available: 1, active: true, image: '', notes: '', category: 'Peralatan' },
    { id: 14, name: 'Alas meja plastik (hijau/kuning)', quantity: 8, available: 8, active: true, image: '', notes: '', category: 'Karpet & Alas' },
    { id: 15, name: 'Alas meja kain (biru muda)', quantity: 2, available: 2, active: true, image: '', notes: '', category: 'Karpet & Alas' },
    { id: 16, name: 'Alas meja kain (biru tua)', quantity: 4, available: 4, active: true, image: '', notes: '', category: 'Karpet & Alas' },
    { id: 17, name: 'Alas dulang (panjang & pendek)', quantity: 2, available: 2, active: true, image: '', notes: '', category: 'Karpet & Alas' },
    { id: 18, name: 'Partition besar', quantity: 10, available: 10, active: true, image: '', notes: '', category: 'Partition' },
    { id: 19, name: 'Partition merah', quantity: 16, available: 16, active: true, image: '', notes: '', category: 'Partition' },
    { id: 20, name: 'Partition biru', quantity: 2, available: 2, active: true, image: '', notes: '', category: 'Partition' },
  ]);

  const [applications, setApplications] = useState([]);
  const [returns, setReturns] = useState([]);

  // Form States
  const [loanForm, setLoanForm] = useState({
    borrowerName: '',
    department: '',
    email: '',
    phone: '',
    purpose: '',
    loanDate: '',
    returnDate: '',
    items: []
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [adminPassword, setAdminPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [newAsset, setNewAsset] = useState({ name: '', quantity: 1, category: 'Meja', notes: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editImageAssetId, setEditImageAssetId] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePad, setSignaturePad] = useState({});

  // Load data from localStorage
  useEffect(() => {
    const savedApplications = localStorage.getItem('applications');
    const savedReturns = localStorage.getItem('returns');
    const savedAssets = localStorage.getItem('assets');
    
    if (savedApplications) setApplications(JSON.parse(savedApplications));
    if (savedReturns) setReturns(JSON.parse(savedReturns));
    if (savedAssets) setAssets(JSON.parse(savedAssets));
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('returns', JSON.stringify(returns));
  }, [returns]);

  useEffect(() => {
    localStorage.setItem('assets', JSON.stringify(assets));
  }, [assets]);

  // Helper Functions
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('ms-MY', options);
  };

  const generateId = () => {
    return 'APP' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  };

  // Signature Pad Functions
  const startDrawing = (canvasId, e) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setSignaturePad({
      ...signaturePad,
      [canvasId]: { x, y }
    });
  };

  const draw = (canvasId, e) => {
    if (!isDrawing) return;
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const lastPos = signaturePad[canvasId];
    if (lastPos) {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    
    setSignaturePad({
      ...signaturePad,
      [canvasId]: { x, y }
    });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = (canvasId) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = (canvasId, appId = null, returnId = null) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const signatureData = canvas.toDataURL();
    
    if (appId) {
      // Save approval signature
      setApplications(applications.map(a => 
        a.id === appId ? { ...a, approvalSignature: signatureData } : a
      ));
    } else if (returnId) {
      // Save return signature
      setReturns(returns.map(r => 
        r.id === returnId ? { ...r, confirmationSignature: signatureData } : r
      ));
    }
    
    return signatureData;
  };

  // Loan Application Functions
  const addItemToLoan = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset || !asset.active) return;
    
    const existing = selectedItems.find(i => i.assetId === assetId);
    if (existing) {
      showMessage('error', 'Item ini sudah ditambah');
      return;
    }
    
    setSelectedItems([...selectedItems, {
      assetId: asset.id,
      name: asset.name,
      quantity: 1,
      maxAvailable: asset.available
    }]);
  };

  const updateItemQuantity = (assetId, quantity) => {
    const item = selectedItems.find(i => i.assetId === assetId);
    if (!item) return;
    
    const newQty = Math.max(1, Math.min(quantity, item.maxAvailable));
    setSelectedItems(selectedItems.map(i =>
      i.assetId === assetId ? { ...i, quantity: newQty } : i
    ));
  };

  const removeItemFromLoan = (assetId) => {
    setSelectedItems(selectedItems.filter(i => i.assetId !== assetId));
  };

  const submitLoanApplication = () => {
    if (!loanForm.borrowerName || !loanForm.department || !loanForm.email || 
        !loanForm.phone || !loanForm.loanDate || !loanForm.returnDate || 
        selectedItems.length === 0) {
      showMessage('error', 'Sila lengkapkan semua maklumat');
      return;
    }

    const loanDate = new Date(loanForm.loanDate);
    const returnDate = new Date(loanForm.returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (loanDate < today) {
      showMessage('error', 'Tarikh peminjaman tidak boleh di masa lepas');
      return;
    }

    if (returnDate <= loanDate) {
      showMessage('error', 'Tarikh pemulangan mesti selepas tarikh peminjaman');
      return;
    }

    setLoading(true);

    const newApplication = {
      id: generateId(),
      ...loanForm,
      items: selectedItems.map(item => ({
        assetId: item.assetId,
        name: item.name,
        borrowed: item.quantity,
        returned: 0,
        balance: item.quantity
      })),
      status: 'PENDING',
      submittedDate: new Date().toISOString(),
      approvedBy: null,
      approvedDate: null,
      rejectedReason: null
    };

    setApplications([...applications, newApplication]);

    // Reset form
    setLoanForm({
      borrowerName: '',
      department: '',
      email: '',
      phone: '',
      purpose: '',
      loanDate: '',
      returnDate: '',
      items: []
    });
    setSelectedItems([]);
    
    setLoading(false);
    showMessage('success', 'Permohonan berjaya dihantar! ID: ' + newApplication.id);
    setPage('landing');
  };

  // Admin Functions
  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setAdminAuth(true);
      setPage('admin');
      showMessage('success', 'Log masuk berjaya');
    } else {
      showMessage('error', 'Kata laluan salah');
    }
  };

  const handleApproveApplication = async (appId) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    // Check availability
    for (const item of app.items) {
      const asset = assets.find(a => a.id === item.assetId);
      if (!asset || asset.available < item.borrowed) {
        showMessage('error', `Aset "${item.name}" tidak mencukupi`);
        return;
      }
    }

    // Update application
    const updatedApplications = applications.map(a =>
      a.id === appId ? {
        ...a,
        status: 'APPROVED',
        approvedBy: 'Admin',
        approvedDate: new Date().toISOString()
      } : a
    );
    setApplications(updatedApplications);

    // Update asset availability
    const updatedAssets = assets.map(asset => {
      const loanItem = app.items.find(i => i.assetId === asset.id);
      if (loanItem) {
        return { ...asset, available: asset.available - loanItem.borrowed };
      }
      return asset;
    });
    setAssets(updatedAssets);

    // Send email notification
    if (isEmailConfigured()) {
      try {
        await EmailService.sendApprovalNotification(
          updatedApplications.find(a => a.id === appId),
          'Admin'
        );
        showMessage('success', 'Permohonan diluluskan & email dihantar');
      } catch (error) {
        showMessage('success', 'Permohonan diluluskan (email gagal dihantar)');
      }
    } else {
      showMessage('success', 'Permohonan diluluskan');
    }

    setShowConfirmModal(false);
  };

  const handleRejectApplication = (appId, reason) => {
    const updatedApplications = applications.map(a =>
      a.id === appId ? {
        ...a,
        status: 'REJECTED',
        rejectedReason: reason || 'Tiada sebab dinyatakan',
        rejectedDate: new Date().toISOString()
      } : a
    );
    setApplications(updatedApplications);
    showMessage('success', 'Permohonan ditolak');
    setShowConfirmModal(false);
  };

  const handleReturnItems = (appId, returnData) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    // Update application items
    const updatedItems = app.items.map(item => {
      const returned = returnData[item.assetId] || 0;
      return {
        ...item,
        returned: item.returned + returned,
        balance: item.borrowed - (item.returned + returned)
      };
    });

    const allReturned = updatedItems.every(item => item.balance === 0);

    const updatedApplications = applications.map(a =>
      a.id === appId ? {
        ...a,
        items: updatedItems,
        status: allReturned ? 'COMPLETED' : a.status
      } : a
    );
    setApplications(updatedApplications);

    // Update asset availability
    const updatedAssets = assets.map(asset => {
      const returnQty = returnData[asset.id] || 0;
      if (returnQty > 0) {
        return { ...asset, available: asset.available + returnQty };
      }
      return asset;
    });
    setAssets(updatedAssets);

    // Create return record
    const newReturn = {
      id: 'RET' + Date.now(),
      applicationId: appId,
      returnDate: new Date().toISOString(),
      items: Object.entries(returnData).map(([assetId, qty]) => {
        const asset = assets.find(a => a.id === parseInt(assetId));
        return {
          assetId: parseInt(assetId),
          name: asset ? asset.name : '',
          quantity: qty
        };
      }).filter(item => item.quantity > 0),
      confirmedBy: 'Admin'
    };
    setReturns([...returns, newReturn]);

    showMessage('success', allReturned ? 'Semua item dipulangkan' : 'Pemulangan sebahagian berjaya');
  };

  const handleAddAsset = () => {
    if (!newAsset.name || newAsset.quantity < 1) {
      showMessage('error', 'Sila lengkapkan maklumat aset');
      return;
    }

    const asset = {
      id: Math.max(...assets.map(a => a.id), 0) + 1,
      name: newAsset.name,
      quantity: parseInt(newAsset.quantity),
      available: parseInt(newAsset.quantity),
      category: newAsset.category || 'Lain-lain',
      notes: newAsset.notes,
      active: true,
      image: ''
    };

    setAssets([...assets, asset]);
    setNewAsset({ name: '', quantity: 1, category: 'Meja', notes: '' });
    showMessage('success', 'Aset berjaya ditambah');
  };

  const handleUpdateAsset = (assetId, updates) => {
    setAssets(assets.map(a =>
      a.id === assetId ? { ...a, ...updates } : a
    ));
    showMessage('success', 'Aset dikemaskini');
  };

  const handleImageUpload = (file, assetId) => {
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageData = e.target.result;
      setAssets(assets.map(a =>
        a.id === assetId ? { ...a, image: imageData } : a
      ));
      setUploadingImage(false);
      setEditImageAssetId(null);
      showMessage('success', 'Gambar berjaya dimuat naik');
    };

    reader.onerror = () => {
      setUploadingImage(false);
      showMessage('error', 'Gagal memuat naik gambar');
    };

    reader.readAsDataURL(file);
  };

  // Send reminder emails
  const sendReminders = async () => {
    if (!isEmailConfigured()) {
      showMessage('error', 'Email tidak dikonfigurasi');
      return;
    }

    const approvedApps = applications.filter(a => a.status === 'APPROVED');
    let sentCount = 0;

    for (const app of approvedApps) {
      const daysUntilReturn = calculateDaysUntilReturn(app.returnDate);
      
      // Send reminder if within 3 days or overdue
      if (daysUntilReturn <= 3) {
        try {
          await EmailService.sendReminderNotification(app, daysUntilReturn);
          sentCount++;
        } catch (error) {
          console.error('Failed to send reminder:', error);
        }
      }
    }

    if (sentCount > 0) {
      showMessage('success', `${sentCount} reminder email dihantar`);
    } else {
      showMessage('error', 'Tiada reminder perlu dihantar');
    }
  };

  // Pages Components
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="w-12 h-12 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">LibLoanPPD</h1>
          </div>
          <p className="text-gray-600 text-lg">Sistem Peminjaman Aset Perpustakaan</p>
          <p className="text-sm text-gray-500 mt-2">Politeknik Port Dickson</p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <button
            onClick={() => setPage('loan')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-1 text-left group"
          >
            <div className="bg-indigo-100 w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
              <Plus className="w-8 h-8 text-indigo-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Mohon Peminjaman</h3>
            <p className="text-gray-600">Buat permohonan peminjaman aset baru</p>
          </button>

          <button
            onClick={() => setPage('status')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-1 text-left group"
          >
            <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
              <Search className="w-8 h-8 text-green-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Semak Status</h3>
            <p className="text-gray-600">Lihat status permohonan anda</p>
          </button>

          <button
            onClick={() => setPage('adminLogin')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-1 text-left group"
          >
            <div className="bg-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
              <Shield className="w-8 h-8 text-purple-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Admin</h3>
            <p className="text-gray-600">Log masuk panel pentadbir</p>
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-16 max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Aset Tersedia</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {assets.filter(a => a.active).slice(0, 6).map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {asset.image ? (
                    <img src={asset.image} alt={asset.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <span className="font-medium text-gray-700">{asset.name}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  asset.available === 0 ? 'bg-red-100 text-red-800' :
                  asset.available < asset.quantity * 0.3 ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {asset.available}/{asset.quantity}
                </span>
              </div>
            ))}
          </div>
          {assets.filter(a => a.active).length > 6 && (
            <p className="text-center text-gray-500 mt-4 text-sm">
              +{assets.filter(a => a.active).length - 6} lagi aset tersedia
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600">
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              <span>perpustakaan@polipd.edu.my</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              <span>06-647 7000</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">© 2024 Perpustakaan Politeknik Port Dickson</p>
        </div>
      </div>
    </div>
  );

  const LoanApplicationPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setPage('landing')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Permohonan Peminjaman</h1>
          <p className="text-gray-600 mt-2">Lengkapkan maklumat di bawah untuk membuat permohonan</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Maklumat Peminjam</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nama Penuh
              </label>
              <input
                type="text"
                value={loanForm.borrowerName}
                onChange={(e) => setLoanForm({ ...loanForm, borrowerName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Nama peminjam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Jabatan/Unit
              </label>
              <input
                type="text"
                value={loanForm.department}
                onChange={(e) => setLoanForm({ ...loanForm, department: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Contoh: Jabatan Kejuruteraan Mekanikal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Emel
              </label>
              <input
                type="email"
                value={loanForm.email}
                onChange={(e) => setLoanForm({ ...loanForm, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="nama@polipd.edu.my"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                No. Telefon
              </label>
              <input
                type="tel"
                value={loanForm.phone}
                onChange={(e) => setLoanForm({ ...loanForm, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="012-3456789"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Tujuan Peminjaman
            </label>
            <textarea
              value={loanForm.purpose}
              onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows="3"
              placeholder="Nyatakan tujuan peminjaman..."
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Tarikh Peminjaman
              </label>
              <input
                type="date"
                value={loanForm.loanDate}
                onChange={(e) => setLoanForm({ ...loanForm, loanDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Tarikh Pemulangan
              </label>
              <input
                type="date"
                value={loanForm.returnDate}
                onChange={(e) => setLoanForm({ ...loanForm, returnDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Pilih Aset</h2>
          <div className="mb-4">
            <select
              onChange={(e) => addItemToLoan(parseInt(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">-- Pilih aset untuk dipinjam --</option>
              {assets.filter(a => a.active && a.available > 0).map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.available} tersedia)
                </option>
              ))}
            </select>
          </div>

          {selectedItems.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Aset</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Kuantiti</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map(item => (
                    <tr key={item.assetId} className="border-t">
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="1"
                          max={item.maxAvailable}
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.assetId, parseInt(e.target.value))}
                          className="w-20 px-2 py-1 border rounded text-center"
                        />
                        <span className="text-sm text-gray-500 ml-2">/ {item.maxAvailable}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => removeItemFromLoan(item.assetId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => setPage('landing')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Batal
          </button>
          <button
            onClick={submitLoanApplication}
            disabled={loading || selectedItems.length === 0}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Menghantar...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Hantar Permohonan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const StatusCheckPage = () => {
    const [searchId, setSearchId] = useState('');
    const [foundApp, setFoundApp] = useState(null);

    const handleSearch = () => {
      const app = applications.find(a => a.id.toLowerCase() === searchId.toLowerCase());
      if (app) {
        setFoundApp(app);
      } else {
        setFoundApp(null);
        showMessage('error', 'Permohonan tidak dijumpai');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <button
              onClick={() => setPage('landing')}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Semak Status Permohonan</h1>
            <p className="text-gray-600 mt-2">Masukkan ID permohonan anda</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Contoh: APP1234567890ABCDE"
                className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Cari
              </button>
            </div>
          </div>

          {foundApp && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{foundApp.id}</h2>
                  <p className="text-sm text-gray-500">Tarikh mohon: {formatDate(foundApp.submittedDate)}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  foundApp.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  foundApp.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  foundApp.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {foundApp.status === 'PENDING' ? 'Menunggu Kelulusan' :
                   foundApp.status === 'APPROVED' ? 'Diluluskan' :
                   foundApp.status === 'REJECTED' ? 'Ditolak' :
                   'Selesai'}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Maklumat Peminjam</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Nama:</span> <span className="font-medium">{foundApp.borrowerName}</span></p>
                    <p><span className="text-gray-600">Jabatan:</span> <span className="font-medium">{foundApp.department}</span></p>
                    <p><span className="text-gray-600">Emel:</span> <span className="font-medium">{foundApp.email}</span></p>
                    <p><span className="text-gray-600">Telefon:</span> <span className="font-medium">{foundApp.phone}</span></p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Tarikh Peminjaman</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Pinjam:</span> <span className="font-medium">{formatDate(foundApp.loanDate)}</span></p>
                    <p><span className="text-gray-600">Pulang:</span> <span className="font-medium">{formatDate(foundApp.returnDate)}</span></p>
                    {foundApp.approvedDate && (
                      <p><span className="text-gray-600">Diluluskan:</span> <span className="font-medium">{formatDate(foundApp.approvedDate)}</span></p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Aset Dipinjam</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-4 font-semibold">Nama Aset</th>
                        <th className="text-center py-2 px-4 font-semibold">Dipinjam</th>
                        <th className="text-center py-2 px-4 font-semibold">Dipulangkan</th>
                        <th className="text-center py-2 px-4 font-semibold">Baki</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foundApp.items.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="py-2 px-4">{item.name}</td>
                          <td className="py-2 px-4 text-center">{item.borrowed}</td>
                          <td className="py-2 px-4 text-center">{item.returned}</td>
                          <td className="py-2 px-4 text-center">
                            <span className={item.balance === 0 ? 'text-green-600 font-semibold' : ''}>
                              {item.balance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {foundApp.purpose && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Tujuan</h3>
                  <p className="text-sm text-gray-600">{foundApp.purpose}</p>
                </div>
              )}

              {foundApp.status === 'REJECTED' && foundApp.rejectedReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Sebab Ditolak</h3>
                  <p className="text-sm text-red-700">{foundApp.rejectedReason}</p>
                </div>
              )}

              {foundApp.status === 'APPROVED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">
                    <CheckCircle className="w-5 h-5 inline mr-1" />
                    Permohonan Diluluskan
                  </h3>
                  <p className="text-sm text-green-700">
                    Sila datang ke Perpustakaan pada tarikh peminjaman untuk mengambil aset.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const AdminLoginPage = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <button
          onClick={() => setPage('landing')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </button>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-gray-600 mt-2">Masukkan kata laluan untuk akses</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kata Laluan
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Masukkan kata laluan"
            />
          </div>

          <button
            onClick={handleAdminLogin}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
          >
            Log Masuk
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Default password: admin123
          </p>
        </div>
      </div>
    </div>
  );

  const AdminPanel = () => {
    const [selectedApp, setSelectedApp] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [returnData, setReturnData] = useState({});

    const filteredApplications = applications.filter(app => {
      const matchesSearch = app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           app.borrowerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === 'ALL' || app.status === statusFilter;
      return matchesSearch && matchesFilter;
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={sendReminders}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Hantar Reminder
                </button>
                <button
                  onClick={() => {
                    setAdminAuth(false);
                    setPage('landing');
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                >
                  Log Keluar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setAdminTab('applications')}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${
                adminTab === 'applications' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Permohonan ({applications.filter(a => a.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setAdminTab('approved')}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${
                adminTab === 'approved' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Diluluskan ({applications.filter(a => a.status === 'APPROVED').length})
            </button>
            <button
              onClick={() => setAdminTab('returns')}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${
                adminTab === 'returns' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pemulangan ({returns.length})
            </button>
            <button
              onClick={() => setAdminTab('assets')}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap ${
                adminTab === 'assets' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Aset ({assets.filter(a => a.active).length})
            </button>
          </div>

          {/* Applications Tab */}
          {adminTab === 'applications' && (
            <div>
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari ID atau nama peminjam..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="PENDING">Menunggu</option>
                    <option value="APPROVED">Diluluskan</option>
                    <option value="REJECTED">Ditolak</option>
                    <option value="COMPLETED">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredApplications.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Tiada permohonan dijumpai</p>
                  </div>
                ) : (
                  filteredApplications.map(app => (
                    <div key={app.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{app.id}</h3>
                          <p className="text-sm text-gray-600">{app.borrowerName} - {app.department}</p>
                          <p className="text-xs text-gray-500 mt-1">Tarikh mohon: {formatDate(app.submittedDate)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          app.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600">Emel:</span>
                          <p className="font-medium">{app.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Telefon:</span>
                          <p className="font-medium">{app.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Tarikh:</span>
                          <p className="font-medium">{formatDate(app.loanDate)} - {formatDate(app.returnDate)}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2 text-sm">Aset:</h4>
                        <div className="flex flex-wrap gap-2">
                          {app.items.map((item, idx) => (
                            <span key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-xs">
                              {item.name} × {item.borrowed}
                            </span>
                          ))}
                        </div>
                      </div>

                      {app.purpose && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-700 mb-1 text-sm">Tujuan:</h4>
                          <p className="text-sm text-gray-600">{app.purpose}</p>
                        </div>
                      )}

                      {app.status === 'PENDING' && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => {
                              setConfirmAction({ type: 'approve', id: app.id });
                              setShowConfirmModal(true);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                          >
                            <Check className="w-5 h-5" />
                            Luluskan
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setConfirmAction({ type: 'reject', id: app.id });
                              setShowConfirmModal(true);
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                          >
                            <X className="w-5 h-5" />
                            Tolak
                          </button>
                        </div>
                      )}

                      {app.status === 'APPROVED' && app.items.some(item => item.balance > 0) && (
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium mt-4"
                        >
                          Proses Pemulangan
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Approved Tab */}
          {adminTab === 'approved' && (
            <div className="space-y-4">
              {applications.filter(a => a.status === 'APPROVED').map(app => {
                const daysLeft = calculateDaysUntilReturn(app.returnDate);
                return (
                  <div key={app.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{app.id}</h3>
                        <p className="text-sm text-gray-600">{app.borrowerName}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          daysLeft < 0 ? 'bg-red-100 text-red-800' :
                          daysLeft === 0 ? 'bg-orange-100 text-orange-800' :
                          daysLeft <= 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {daysLeft < 0 ? `Lewat ${Math.abs(daysLeft)} hari` :
                           daysLeft === 0 ? 'Pulang hari ini' :
                           `${daysLeft} hari lagi`}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Pulang: {formatDate(app.returnDate)}</p>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden mb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-4">Aset</th>
                            <th className="text-center py-2 px-4">Pinjam</th>
                            <th className="text-center py-2 px-4">Pulang</th>
                            <th className="text-center py-2 px-4">Baki</th>
                          </tr>
                        </thead>
                        <tbody>
                          {app.items.map((item, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="py-2 px-4">{item.name}</td>
                              <td className="text-center py-2 px-4">{item.borrowed}</td>
                              <td className="text-center py-2 px-4">{item.returned}</td>
                              <td className="text-center py-2 px-4">
                                <span className={item.balance === 0 ? 'text-green-600 font-semibold' : ''}>
                                  {item.balance}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {app.items.some(item => item.balance > 0) && (
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium"
                      >
                        Proses Pemulangan
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Returns Tab */}
          {adminTab === 'returns' && (
            <div className="space-y-4">
              {returns.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tiada rekod pemulangan</p>
                </div>
              ) : (
                returns.map(ret => (
                  <div key={ret.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{ret.id}</h3>
                        <p className="text-sm text-gray-600">Permohonan: {ret.applicationId}</p>
                        <p className="text-xs text-gray-500 mt-1">Tarikh pulang: {formatDate(ret.returnDate)}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                        Selesai
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2 text-sm">Aset dipulangkan:</h4>
                      <div className="flex flex-wrap gap-2">
                        {ret.items.map((item, idx) => (
                          <span key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-xs">
                            {item.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {ret.confirmedBy && (
                      <p className="text-xs text-gray-500">Disahkan oleh: {ret.confirmedBy}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Assets Tab */}
          {adminTab === 'assets' && (
            <div>
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Aset Baru</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Aset</label>
                    <input
                      type="text"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Contoh: Meja pejabat"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kuantiti</label>
                    <input
                      type="number"
                      min="1"
                      value={newAsset.quantity}
                      onChange={(e) => setNewAsset({ ...newAsset, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                    <select
                      value={newAsset.category}
                      onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="Meja">Meja</option>
                      <option value="Kerusi">Kerusi</option>
                      <option value="Karpet & Alas">Karpet & Alas</option>
                      <option value="Partition">Partition</option>
                      <option value="Peralatan">Peralatan</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nota (pilihan)</label>
                    <input
                      type="text"
                      value={newAsset.notes}
                      onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Contoh: Warna biru"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleAddAsset}
                    disabled={uploadingImage}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Tambah Aset
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Senarai Aset</h3>
                
                {/* Group assets by category */}
                {(() => {
                  const categories = [...new Set(assets.map(a => a.category || 'Lain-lain'))].sort();
                  
                  return categories.map(category => {
                    const categoryAssets = assets.filter(a => (a.category || 'Lain-lain') === category);
                    
                    return (
                      <div key={category} className="mb-8 last:mb-0">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {category}
                          </div>
                          <div className="h-px flex-1 bg-gray-200"></div>
                          <span className="text-sm text-gray-500">{categoryAssets.length} item</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Gambar</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Jumlah</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Tersedia</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Tindakan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categoryAssets.map(asset => (
                                <tr key={asset.id} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                    <div className="relative group">
                                      {asset.image ? (
                                        <img 
                                          src={asset.image} 
                                          alt={asset.name}
                                          className="w-16 h-16 object-cover rounded-lg border cursor-pointer"
                                          onClick={() => window.open(asset.image, '_blank')}
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect width="64" height="64" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                                          <Package className="w-8 h-8 text-gray-400" />
                                        </div>
                                      )}
                                      <button
                                        onClick={() => setEditImageAssetId(asset.id)}
                                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                      >
                                        <Upload className="w-5 h-5 text-white" />
                                      </button>
                                    </div>
                                    {editImageAssetId === asset.id && (
                                      <div className="mt-2">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            if (e.target.files[0]) {
                                              handleImageUpload(e.target.files[0], asset.id);
                                            }
                                          }}
                                          className="text-xs"
                                        />
                                        <button
                                          onClick={() => setEditImageAssetId(null)}
                                          className="text-xs text-gray-600 hover:text-gray-800 ml-2"
                                        >
                                          Batal
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="text-gray-800 font-medium">{asset.name}</div>
                                    {asset.notes && (
                                      <div className="text-xs text-gray-500 mt-1">{asset.notes}</div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center font-semibold text-gray-800">{asset.quantity}</td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`font-semibold ${
                                      asset.available === 0 ? 'text-red-600' : 
                                      asset.available < asset.quantity * 0.3 ? 'text-orange-600' : 
                                      'text-green-600'
                                    }`}>
                                      {asset.available}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      asset.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {asset.active ? 'Aktif' : 'Tidak Aktif'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      onClick={() => handleUpdateAsset(asset.id, { active: !asset.active })}
                                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                    >
                                      {asset.active ? 'Nyahaktif' : 'Aktifkan'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Return Modal */}
        {selectedApp && !showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Proses Pemulangan</h2>
                <p className="text-gray-600 mb-6">ID: {selectedApp.id}</p>

                <div className="border rounded-lg overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Aset</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Pinjam</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Pulang</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Baki</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Terima</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedApp.items.filter(item => item.balance > 0).map(item => (
                        <tr key={item.assetId} className="border-t">
                          <td className="py-3 px-4">{item.name}</td>
                          <td className="text-center py-3 px-4">{item.borrowed}</td>
                          <td className="text-center py-3 px-4">{item.returned}</td>
                          <td className="text-center py-3 px-4 font-semibold">{item.balance}</td>
                          <td className="text-center py-3 px-4">
                            <input
                              type="number"
                              min="0"
                              max={item.balance}
                              value={returnData[item.assetId] || 0}
                              onChange={(e) => setReturnData({
                                ...returnData,
                                [item.assetId]: Math.min(parseInt(e.target.value) || 0, item.balance)
                              })}
                              className="w-20 px-2 py-1 border rounded text-center"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedApp(null);
                      setReturnData({});
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      handleReturnItems(selectedApp.id, returnData);
                      setSelectedApp(null);
                      setReturnData({});
                    }}
                    className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                  >
                    Sahkan Pemulangan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {showConfirmModal && confirmAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {confirmAction.type === 'approve' ? 'Luluskan Permohonan?' : 'Tolak Permohonan?'}
              </h2>
              
              {confirmAction.type === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sebab Penolakan
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows="3"
                    placeholder="Nyatakan sebab..."
                  />
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                    setRejectReason('');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (confirmAction.type === 'approve') {
                      handleApproveApplication(confirmAction.id);
                    } else {
                      handleRejectApplication(confirmAction.id, rejectReason);
                    }
                    setRejectReason('');
                  }}
                  className={`flex-1 px-6 py-3 text-white rounded-lg font-medium ${
                    confirmAction.type === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {confirmAction.type === 'approve' ? 'Ya, Luluskan' : 'Ya, Tolak'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="font-sans">
      {message.text && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {page === 'landing' && <LandingPage />}
      {page === 'loan' && <LoanApplicationPage />}
      {page === 'status' && <StatusCheckPage />}
      {page === 'adminLogin' && <AdminLoginPage />}
      {page === 'admin' && adminAuth && <AdminPanel />}
    </div>
  );
};

export default LibLoanPPD;
