import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Building2,
  Package,
  ArrowLeft,
  LogIn,
  LogOut,
  Search,
  Filter,
  Download,
  Upload,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Send,
  RefreshCw,
  CheckSquare,
  Square,
  Bell,
  FileText,
  TrendingUp,
  Archive,
  Plus,
  Image as ImageIcon,
  Save,
  X
} from 'lucide-react';
import { EmailService, isEmailConfigured, calculateDaysUntilReturn } from './emailService';
import { GoogleSheetsService } from './googleSheetsService';

const LibLoanPPD = () => {
  // ==================== STATE MANAGEMENT ====================
  
  // Navigation & Auth
  const [currentView, setCurrentView] = useState('home'); // home, application, status, admin
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Asset Inventory - WITH THUMBNAILS & ACTIVE STATUS
  const [assets, setAssets] = useState([
    { 
      id: 'A001', 
      name: 'Projektor LCD', 
      category: 'Elektronik', 
      total: 5, 
      available: 5,
      thumbnail: 'https://via.placeholder.com/150?text=Projektor',
      isActive: true
    },
    { 
      id: 'A002', 
      name: 'Laptop Dell', 
      category: 'Elektronik', 
      total: 10, 
      available: 10,
      thumbnail: 'https://via.placeholder.com/150?text=Laptop',
      isActive: true
    },
    { 
      id: 'A003', 
      name: 'Kamera DSLR', 
      category: 'Elektronik', 
      total: 3, 
      available: 3,
      thumbnail: 'https://via.placeholder.com/150?text=Kamera',
      isActive: true
    },
    { 
      id: 'A004', 
      name: 'Tripod', 
      category: 'Peralatan', 
      total: 8, 
      available: 8,
      thumbnail: 'https://via.placeholder.com/150?text=Tripod',
      isActive: true
    },
    { 
      id: 'A005', 
      name: 'Mikropon Wireless', 
      category: 'Audio', 
      total: 6, 
      available: 6,
      thumbnail: 'https://via.placeholder.com/150?text=Mikropon',
      isActive: true
    },
    { 
      id: 'A006', 
      name: 'Speaker Portable', 
      category: 'Audio', 
      total: 4, 
      available: 4,
      thumbnail: 'https://via.placeholder.com/150?text=Speaker',
      isActive: true
    },
    { 
      id: 'A007', 
      name: 'Whiteboard Portable', 
      category: 'Peralatan', 
      total: 3, 
      available: 3,
      thumbnail: 'https://via.placeholder.com/150?text=Whiteboard',
      isActive: true
    },
    { 
      id: 'A008', 
      name: 'Extension Cable 10m', 
      category: 'Peralatan', 
      total: 15, 
      available: 15,
      thumbnail: 'https://via.placeholder.com/150?text=Cable',
      isActive: true
    },
  ]);

  // Applications
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Form States
  const [borrowerForm, setBorrowerForm] = useState({
    borrowerName: '',
    staffId: '',
    email: '',
    phone: '',
    department: '',
    purpose: '',
    loanDate: '',
    returnDate: '',
    selectedItems: []
  });

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected, returned
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  // UI States
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // success, error, warning, info

  // NEW: Asset Management Modal
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({
    id: '',
    name: '',
    category: '',
    total: 0,
    thumbnail: '',
    isActive: true
  });

  // NEW: Approval Form State (for verifier name and editable quantities)
  const [approvalForm, setApprovalForm] = useState({
    verifierName: '',
    editedItems: []
  });

  // NEW: Recipient tracking
  const [recipientForm, setRecipientForm] = useState({
    recipientName: '',
    recipientId: ''
  });

  // ==================== EFFECTS ====================

  // Load data from localStorage on mount
  useEffect(() => {
    const savedApplications = localStorage.getItem('libloan_applications');
    const savedAssets = localStorage.getItem('libloan_assets');
    const savedAdminSession = localStorage.getItem('libloan_admin_session');

    if (savedApplications) {
      setApplications(JSON.parse(savedApplications));
    }
    if (savedAssets) {
      setAssets(JSON.parse(savedAssets));
    }
    if (savedAdminSession === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // ==================== GOOGLE SHEETS SYNC ====================

  // Sync data from Google Sheets on component mount
  useEffect(() => {
    const syncData = async () => {
      if (GoogleSheetsService.isConfigured()) {
        console.log('🔄 Syncing data from Google Sheets...');
        setIsSyncing(true);
        
        try {
          const result = await GoogleSheetsService.syncData();
          
          if (result.success) {
            console.log('✅ Data synced successfully!');
            console.log('Applications:', result.applications.length);
            console.log('Assets:', result.assets.length);
            
            if (result.applications.length > 0) {
              setApplications(result.applications);
            }
            if (result.assets.length > 0) {
              setAssets(result.assets);
            }
            
            setLastSyncTime(new Date());
            showNotificationMessage('Data synced from Google Sheets', 'success');
          } else {
            console.log('⚠️ Sync failed, using localStorage');
            showNotificationMessage('Using offline data', 'info');
          }
        } catch (error) {
          console.error('Error syncing:', error);
          showNotificationMessage('Using offline data', 'info');
        } finally {
          setIsSyncing(false);
        }
      } else {
        console.log('ℹ️ Google Sheets not configured, using localStorage only');
      }
    };

    syncData();
  }, []); // Run once on mount

  // Manual sync function
  const handleManualSync = async () => {
    if (!GoogleSheetsService.isConfigured()) {
      showNotificationMessage('Google Sheets not configured', 'warning');
      return;
    }

    setIsSyncing(true);
    showNotificationMessage('Syncing data...', 'info');
    
    try {
      const result = await GoogleSheetsService.syncData();
      
      if (result.success) {
        setApplications(result.applications);
        setAssets(result.assets);
        setLastSyncTime(new Date());
        showNotificationMessage('Data synced successfully!', 'success');
      } else {
        showNotificationMessage('Sync failed', 'error');
      }
    } catch (error) {
      console.error('Sync error:', error);
      showNotificationMessage('Sync error: ' + error.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Save applications to localStorage whenever they change
  useEffect(() => {
    if (applications.length > 0) {
      localStorage.setItem('libloan_applications', JSON.stringify(applications));
    }
  }, [applications]);

  // Save assets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('libloan_assets', JSON.stringify(assets));
  }, [assets]);

  // Check for reminders daily
  useEffect(() => {
    const checkReminders = () => {
      const today = new Date().toDateString();
      const lastCheck = localStorage.getItem('libloan_last_reminder_check');
      
      if (lastCheck !== today) {
        sendDailyReminders();
        localStorage.setItem('libloan_last_reminder_check', today);
      }
    };

    checkReminders();
    // Check every hour
    const interval = setInterval(checkReminders, 3600000);
    return () => clearInterval(interval);
  }, [applications]);

  // ==================== UTILITY FUNCTIONS ====================

  const generateApplicationId = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LIB${year}${month}${random}`;
  };

  const showNotificationMessage = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // UPDATED: Allow same day loan/return
  const validateForm = () => {
    const { borrowerName, staffId, email, phone, department, purpose, loanDate, returnDate, selectedItems } = borrowerForm;
    
    if (!borrowerName || !staffId || !email || !phone || !department || !purpose) {
      showNotificationMessage('Sila lengkapkan semua maklumat peminjam', 'error');
      return false;
    }

    if (!loanDate || !returnDate) {
      showNotificationMessage('Sila pilih tarikh peminjaman dan pemulangan', 'error');
      return false;
    }

    // CHANGED: Allow same day - return date must be >= loan date
    if (new Date(returnDate) < new Date(loanDate)) {
      showNotificationMessage('Tarikh pemulangan tidak boleh sebelum tarikh peminjaman', 'error');
      return false;
    }

    if (selectedItems.length === 0) {
      showNotificationMessage('Sila pilih sekurang-kurangnya satu aset', 'error');
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotificationMessage('Format email tidak sah', 'error');
      return false;
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone.replace(/[-\s]/g, ''))) {
      showNotificationMessage('Format nombor telefon tidak sah', 'error');
      return false;
    }

    return true;
  };

  const checkAssetAvailability = (selectedItems) => {
    for (const item of selectedItems) {
      const asset = assets.find(a => a.id === item.assetId);
      if (!asset || asset.available < item.quantity) {
        return {
          available: false,
          message: `${item.name} tidak mencukupi. Hanya ${asset?.available || 0} unit tersedia.`
        };
      }
    }
    return { available: true };
  };

  // ==================== EMAIL FUNCTIONS ====================

  const sendDailyReminders = async () => {
    if (!isEmailConfigured()) return;

    const approvedApplications = applications.filter(app => 
      app.status === 'approved' && !app.fullyReturned
    );

    for (const app of approvedApplications) {
      const daysUntilReturn = calculateDaysUntilReturn(app.returnDate);
      
      // Send reminder 3 days before, 1 day before, and on the day
      if (daysUntilReturn === 3 || daysUntilReturn === 1 || daysUntilReturn === 0) {
        await EmailService.sendReminderNotification(app, daysUntilReturn);
      }
      
      // Send overdue reminder
      if (daysUntilReturn < 0 && daysUntilReturn % 7 === 0) {
        await EmailService.sendReminderNotification(app, daysUntilReturn);
      }
    }
  };

  // ==================== APPLICATION FUNCTIONS ====================

  const handleSubmitApplication = async () => {
    if (!validateForm()) return;

    const availability = checkAssetAvailability(borrowerForm.selectedItems);
    if (!availability.available) {
      showNotificationMessage(availability.message, 'error');
      return;
    }

    const newApplication = {
      id: generateApplicationId(),
      ...borrowerForm,
      items: borrowerForm.selectedItems.map(item => ({
        ...item,
        borrowed: item.quantity,
        returned: 0,
        balance: item.quantity
      })),
      status: 'pending',
      appliedDate: new Date().toISOString(),
      approvedDate: null,
      approvedBy: null,
      verifiedBy: null, // NEW: Track verifier
      recipientName: null, // NEW: Track recipient
      recipientId: null,
      fullyReturned: false,
      returnHistory: []
    };

    // Update asset availability
    const updatedAssets = assets.map(asset => {
      const borrowedItem = borrowerForm.selectedItems.find(item => item.assetId === asset.id);
      if (borrowedItem) {
        return {
          ...asset,
          available: asset.available - borrowedItem.quantity
        };
      }
      return asset;
    });

    setAssets(updatedAssets);
    setApplications([...applications, newApplication]);

    // Try to save to Google Sheets
    if (GoogleSheetsService.isConfigured()) {
      try {
        await GoogleSheetsService.saveApplication(newApplication);
        await GoogleSheetsService.saveAssets(updatedAssets);
      } catch (error) {
        console.error('Failed to save to Google Sheets:', error);
      }
    }

    showNotificationMessage('Permohonan berjaya dihantar!', 'success');
    
    // Reset form
    setBorrowerForm({
      borrowerName: '',
      staffId: '',
      email: '',
      phone: '',
      department: '',
      purpose: '',
      loanDate: '',
      returnDate: '',
      selectedItems: []
    });
    
    setCurrentView('status');
  };

  const handleSelectAsset = (asset, quantity) => {
    const existingIndex = borrowerForm.selectedItems.findIndex(item => item.assetId === asset.id);
    
    if (quantity === 0) {
      // Remove item
      setBorrowerForm({
        ...borrowerForm,
        selectedItems: borrowerForm.selectedItems.filter(item => item.assetId !== asset.id)
      });
    } else if (existingIndex >= 0) {
      // Update quantity
      const updated = [...borrowerForm.selectedItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: quantity
      };
      setBorrowerForm({
        ...borrowerForm,
        selectedItems: updated
      });
    } else {
      // Add new item
      setBorrowerForm({
        ...borrowerForm,
        selectedItems: [
          ...borrowerForm.selectedItems,
          {
            assetId: asset.id,
            name: asset.name,
            category: asset.category,
            quantity: quantity
          }
        ]
      });
    }
  };

  // ==================== ADMIN FUNCTIONS ====================

  const handleAdminLogin = () => {
    // Simple password check - In production, use proper authentication
    if (adminPassword === 'admin123') {
      setIsAdminLoggedIn(true);
      localStorage.setItem('libloan_admin_session', 'true');
      setShowPasswordInput(false);
      setAdminPassword('');
      setCurrentView('admin');
      showNotificationMessage('Login berjaya', 'success');
    } else {
      showNotificationMessage('Password salah', 'error');
      setAdminPassword('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('libloan_admin_session');
    setCurrentView('home');
    showNotificationMessage('Logout berjaya', 'success');
  };

  // NEW: Enhanced approval with verifier name and editable quantities
  const handleApproveApplication = async (application) => {
    if (!approvalForm.verifierName.trim()) {
      showNotificationMessage('Sila masukkan nama pegawai pengesah', 'error');
      return;
    }

    // Use edited items if available, otherwise use original
    const itemsToApprove = approvalForm.editedItems.length > 0 
      ? approvalForm.editedItems 
      : application.items;

    // Validate quantities
    for (const item of itemsToApprove) {
      if (item.borrowed <= 0) {
        showNotificationMessage('Kuantiti mesti lebih dari 0', 'error');
        return;
      }
      const asset = assets.find(a => a.id === item.assetId);
      if (asset && item.borrowed > asset.available + (application.items.find(i => i.assetId === item.assetId)?.borrowed || 0)) {
        showNotificationMessage(`${item.name}: Kuantiti melebihi stok tersedia`, 'error');
        return;
      }
    }

    const updatedApplications = applications.map(app => {
      if (app.id === application.id) {
        return {
          ...app,
          items: itemsToApprove.map(item => ({
            ...item,
            balance: item.borrowed - (item.returned || 0)
          })),
          status: 'approved',
          approvedDate: new Date().toISOString(),
          approvedBy: 'Admin',
          verifiedBy: approvalForm.verifierName // NEW: Store verifier
        };
      }
      return app;
    });

    // Update asset availability if quantities changed
    if (approvalForm.editedItems.length > 0) {
      const updatedAssets = assets.map(asset => {
        const originalItem = application.items.find(i => i.assetId === asset.id);
        const newItem = itemsToApprove.find(i => i.assetId === asset.id);
        
        if (originalItem && newItem) {
          const difference = newItem.borrowed - originalItem.borrowed;
          return {
            ...asset,
            available: asset.available - difference
          };
        }
        return asset;
      });
      setAssets(updatedAssets);
    }

    setApplications(updatedApplications);

    // Send approval email
    const approvedApp = updatedApplications.find(app => app.id === application.id);
    if (isEmailConfigured()) {
      await EmailService.sendApprovalNotification(approvedApp, approvalForm.verifierName);
    }

    // Save to Google Sheets
    if (GoogleSheetsService.isConfigured()) {
      try {
        await GoogleSheetsService.updateApplication(approvedApp);
      } catch (error) {
        console.error('Failed to update Google Sheets:', error);
      }
    }

    showNotificationMessage('Permohonan telah diluluskan', 'success');
    setSelectedApplication(null);
    setApprovalForm({ verifierName: '', editedItems: [] });
  };

  const handleRejectApplication = (application) => {
    const updatedApplications = applications.map(app => {
      if (app.id === application.id) {
        return {
          ...app,
          status: 'rejected',
          approvedDate: new Date().toISOString(),
          approvedBy: 'Admin'
        };
      }
      return app;
    });

    // Restore asset availability
    const updatedAssets = assets.map(asset => {
      const rejectedItem = application.items.find(item => item.assetId === asset.id);
      if (rejectedItem) {
        return {
          ...asset,
          available: asset.available + rejectedItem.borrowed
        };
      }
      return asset;
    });

    setAssets(updatedAssets);
    setApplications(updatedApplications);

    // Save to Google Sheets
    if (GoogleSheetsService.isConfigured()) {
      const rejectedApp = updatedApplications.find(app => app.id === application.id);
      GoogleSheetsService.updateApplication(rejectedApp).catch(console.error);
    }

    showNotificationMessage('Permohonan telah ditolak', 'success');
    setSelectedApplication(null);
  };

  // NEW: Handle asset handover with recipient tracking
  const handleAssetHandover = (applicationId) => {
    if (!recipientForm.recipientName.trim() || !recipientForm.recipientId.trim()) {
      showNotificationMessage('Sila masukkan maklumat penerima aset', 'error');
      return;
    }

    const updatedApplications = applications.map(app => {
      if (app.id === applicationId) {
        return {
          ...app,
          recipientName: recipientForm.recipientName,
          recipientId: recipientForm.recipientId,
          handoverDate: new Date().toISOString()
        };
      }
      return app;
    });

    setApplications(updatedApplications);

    // Save to Google Sheets
    if (GoogleSheetsService.isConfigured()) {
      const updatedApp = updatedApplications.find(app => app.id === applicationId);
      GoogleSheetsService.updateApplication(updatedApp).catch(console.error);
    }

    showNotificationMessage('Rekod penerima aset berjaya disimpan', 'success');
    setRecipientForm({ recipientName: '', recipientId: '' });
  };

  const handleReturnItem = (applicationId, itemAssetId, returnQuantity) => {
    const updatedApplications = applications.map(app => {
      if (app.id === applicationId) {
        const updatedItems = app.items.map(item => {
          if (item.assetId === itemAssetId) {
            const newReturned = item.returned + returnQuantity;
            return {
              ...item,
              returned: newReturned,
              balance: item.borrowed - newReturned
            };
          }
          return item;
        });

        const allReturned = updatedItems.every(item => item.balance === 0);

        return {
          ...app,
          items: updatedItems,
          fullyReturned: allReturned,
          returnHistory: [
            ...app.returnHistory,
            {
              itemAssetId,
              quantity: returnQuantity,
              date: new Date().toISOString()
            }
          ]
        };
      }
      return app;
    });

    // Update asset availability
    const updatedAssets = assets.map(asset => {
      if (asset.id === itemAssetId) {
        return {
          ...asset,
          available: asset.available + returnQuantity
        };
      }
      return asset;
    });

    setAssets(updatedAssets);
    setApplications(updatedApplications);

    // Save to Google Sheets
    if (GoogleSheetsService.isConfigured()) {
      const updatedApp = updatedApplications.find(app => app.id === applicationId);
      GoogleSheetsService.updateApplication(updatedApp).catch(console.error);
      GoogleSheetsService.saveAssets(updatedAssets).catch(console.error);
    }

    showNotificationMessage('Pemulangan berjaya direkod', 'success');
  };

  // ==================== NEW: ASSET MANAGEMENT FUNCTIONS ====================

  const handleOpenAssetModal = (asset = null) => {
    if (asset) {
      // Edit mode
      setEditingAsset(asset);
      setAssetForm({
        id: asset.id,
        name: asset.name,
        category: asset.category,
        total: asset.total,
        thumbnail: asset.thumbnail || '',
        isActive: asset.isActive !== false
      });
    } else {
      // Add mode
      setEditingAsset(null);
      setAssetForm({
        id: '',
        name: '',
        category: '',
        total: 0,
        thumbnail: '',
        isActive: true
      });
    }
    setShowAssetModal(true);
  };

  const handleSaveAsset = () => {
    if (!assetForm.name.trim() || !assetForm.category.trim()) {
      showNotificationMessage('Sila lengkapkan maklumat aset', 'error');
      return;
    }

    if (assetForm.total < 1) {
      showNotificationMessage('Jumlah aset mesti lebih dari 0', 'error');
      return;
    }

    if (editingAsset) {
      // Update existing asset
      const updatedAssets = assets.map(asset => {
        if (asset.id === editingAsset.id) {
          const availableDiff = assetForm.total - asset.total;
          return {
            ...asset,
            name: assetForm.name,
            category: assetForm.category,
            total: assetForm.total,
            available: asset.available + availableDiff,
            thumbnail: assetForm.thumbnail,
            isActive: assetForm.isActive
          };
        }
        return asset;
      });
      setAssets(updatedAssets);
      showNotificationMessage('Aset berjaya dikemaskini', 'success');
    } else {
      // Add new asset
      const newAssetId = `A${String(assets.length + 1).padStart(3, '0')}`;
      const newAsset = {
        id: newAssetId,
        name: assetForm.name,
        category: assetForm.category,
        total: assetForm.total,
        available: assetForm.total,
        thumbnail: assetForm.thumbnail || 'https://via.placeholder.com/150?text=Asset',
        isActive: assetForm.isActive
      };
      setAssets([...assets, newAsset]);
      showNotificationMessage('Aset baru berjaya ditambah', 'success');
    }

    setShowAssetModal(false);
    setEditingAsset(null);
  };

  const handleDeleteAsset = (assetId) => {
    // Check if asset is being used in any active application
    const isInUse = applications.some(app => 
      app.status === 'approved' && 
      !app.fullyReturned &&
      app.items.some(item => item.assetId === assetId && item.balance > 0)
    );

    if (isInUse) {
      showNotificationMessage('Aset ini sedang dipinjam dan tidak boleh dipadam', 'error');
      return;
    }

    if (window.confirm('Adakah anda pasti ingin memadam aset ini?')) {
      const updatedAssets = assets.filter(asset => asset.id !== assetId);
      setAssets(updatedAssets);
      showNotificationMessage('Aset berjaya dipadam', 'success');
    }
  };

  const handleToggleAssetStatus = (assetId) => {
    const updatedAssets = assets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          isActive: !asset.isActive
        };
      }
      return asset;
    });
    setAssets(updatedAssets);
    showNotificationMessage('Status aset dikemaskini', 'success');
  };

  // ==================== FILTER & SEARCH ====================

  const getFilteredApplications = () => {
    let filtered = applications;

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'returned') {
        filtered = filtered.filter(app => app.fullyReturned);
      } else {
        filtered = filtered.filter(app => app.status === statusFilter);
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(app => {
        const appDate = new Date(app.appliedDate);
        switch (dateFilter) {
          case 'today':
            return appDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return appDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return appDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // ==================== STATISTICS ====================

  const getStatistics = () => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'pending').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    const returned = applications.filter(app => app.fullyReturned).length;
    const active = applications.filter(app => app.status === 'approved' && !app.fullyReturned).length;

    const totalAssets = assets.reduce((sum, asset) => sum + asset.total, 0);
    const availableAssets = assets.reduce((sum, asset) => sum + asset.available, 0);
    const borrowedAssets = totalAssets - availableAssets;

    return {
      total,
      pending,
      approved,
      rejected,
      returned,
      active,
      totalAssets,
      availableAssets,
      borrowedAssets
    };
  };

  // ==================== RENDER COMPONENTS ====================

  // Notification Component
  const renderNotification = () => {
    if (!showNotification) return null;

    const bgColors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    return (
      <div className="fixed top-4 right-4 z-50 animate-slide-in">
        <div className={`${bgColors[notificationType]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md`}>
          {notificationType === 'success' && <CheckCircle className="w-5 h-5" />}
          {notificationType === 'error' && <XCircle className="w-5 h-5" />}
          {notificationType === 'warning' && <AlertCircle className="w-5 h-5" />}
          {notificationType === 'info' && <Bell className="w-5 h-5" />}
          <span>{notificationMessage}</span>
        </div>
      </div>
    );
  };

  // NEW: Asset Management Modal
  const renderAssetModal = () => {
    if (!showAssetModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              {editingAsset ? 'Edit Aset' : 'Tambah Aset Baru'}
            </h3>
            <button
              onClick={() => setShowAssetModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Asset ID - auto generated for new */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ID Aset
              </label>
              <input
                type="text"
                value={editingAsset ? assetForm.id : 'Auto-generated'}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            {/* Asset Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Aset *
              </label>
              <input
                type="text"
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Projektor LCD"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kategori *
              </label>
              <select
                value={assetForm.category}
                onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Kategori</option>
                <option value="Elektronik">Elektronik</option>
                <option value="Audio">Audio</option>
                <option value="Peralatan">Peralatan</option>
                <option value="Furniture">Furniture</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>

            {/* Total Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jumlah Unit *
              </label>
              <input
                type="number"
                min="1"
                value={assetForm.total}
                onChange={(e) => setAssetForm({ ...assetForm, total: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL Gambar Thumbnail
              </label>
              <input
                type="text"
                value={assetForm.thumbnail}
                onChange={(e) => setAssetForm({ ...assetForm, thumbnail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Kosongkan untuk menggunakan gambar placeholder
              </p>
            </div>

            {/* Thumbnail Preview */}
            {assetForm.thumbnail && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preview Thumbnail
                </label>
                <img
                  src={assetForm.thumbnail}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150?text=Error';
                  }}
                />
              </div>
            )}

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="assetActive"
                checked={assetForm.isActive}
                onChange={(e) => setAssetForm({ ...assetForm, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="assetActive" className="text-sm font-semibold text-gray-700">
                Aset Aktif (Boleh Dipinjam)
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveAsset}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold"
              >
                <Save className="w-5 h-5" />
                Simpan
              </button>
              <button
                onClick={() => setShowAssetModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Home View
  const renderHomeView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">LibLoanPPD</h1>
                <p className="text-sm text-gray-600">Sistem Peminjaman Aset Perpustakaan</p>
              </div>
            </div>
            {!isAdminLoggedIn ? (
              <button
                onClick={() => setShowPasswordInput(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <LogIn className="w-5 h-5" />
                Admin Login
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </button>
                <button
                  onClick={() => setCurrentView('admin')}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  <User className="w-5 h-5" />
                  Dashboard Admin
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Password Input Modal */}
      {showPasswordInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Admin Login</h3>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              placeholder="Masukkan password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleAdminLogin}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setShowPasswordInput(false);
                  setAdminPassword('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Selamat Datang ke Sistem Peminjaman Aset
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Politeknik Port Dickson - Perpustakaan
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Apply for Loan Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition transform hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Mohon Peminjaman</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Isi borang permohonan untuk meminjam aset perpustakaan. Proses mudah dan cepat!
            </p>
            <button
              onClick={() => setCurrentView('application')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
            >
              Mohon Sekarang
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>

          {/* Check Status Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition transform hover:-translate-y-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <Search className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Semak Status</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Lihat status permohonan anda dan sejarah peminjaman aset yang telah dibuat.
            </p>
            <button
              onClick={() => setCurrentView('status')}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
            >
              Semak Status
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Statistik Ringkas</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{assets.reduce((sum, a) => sum + a.total, 0)}</p>
              <p className="text-gray-600">Jumlah Aset</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{assets.reduce((sum, a) => sum + a.available, 0)}</p>
              <p className="text-gray-600">Tersedia</p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{applications.filter(a => a.status === 'pending').length}</p>
              <p className="text-gray-600">Menunggu</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{applications.filter(a => a.status === 'approved' && !a.fullyReturned).length}</p>
              <p className="text-gray-600">Aktif</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">
            © 2025 Perpustakaan Politeknik Port Dickson. Hak Cipta Terpelihara.
          </p>
          {lastSyncTime && (
            <p className="text-sm text-gray-500 mt-2">
              Last synced: {lastSyncTime.toLocaleString('ms-MY')}
            </p>
          )}
        </div>
      </footer>
    </div>
  );

  // Application Form View - WITH THUMBNAILS
  const renderApplicationView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
          <h2 className="text-3xl font-bold text-gray-800">Borang Permohonan Peminjaman</h2>
          <p className="text-gray-600 mt-2">Sila lengkapkan maklumat di bawah</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Borrower Information */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Maklumat Peminjam
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Penuh *
                </label>
                <input
                  type="text"
                  value={borrowerForm.borrowerName}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, borrowerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama penuh anda"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  No. Kakitangan/Pelajar *
                </label>
                <input
                  type="text"
                  value={borrowerForm.staffId}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, staffId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: S12345"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={borrowerForm.email}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="email@polipd.edu.my"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  No. Telefon *
                </label>
                <input
                  type="tel"
                  value={borrowerForm.phone}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jabatan/Kursus *
                </label>
                <input
                  type="text"
                  value={borrowerForm.department}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Jabatan IT"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tujuan Peminjaman *
                </label>
                <input
                  type="text"
                  value={borrowerForm.purpose}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, purpose: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Persembahan projek"
                />
              </div>
            </div>
          </div>

          {/* Loan Period */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Tempoh Peminjaman
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tarikh Peminjaman *
                </label>
                <input
                  type="date"
                  value={borrowerForm.loanDate}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, loanDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tarikh Pemulangan *
                </label>
                <input
                  type="date"
                  value={borrowerForm.returnDate}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, returnDate: e.target.value })}
                  min={borrowerForm.loanDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  * Boleh dipinjam dan dipulang pada hari yang sama
                </p>
              </div>
            </div>
          </div>

          {/* Asset Selection - WITH THUMBNAILS */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Pilih Aset
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.filter(asset => asset.isActive !== false).map(asset => {
                const selectedItem = borrowerForm.selectedItems.find(item => item.assetId === asset.id);
                const selectedQty = selectedItem ? selectedItem.quantity : 0;

                return (
                  <div
                    key={asset.id}
                    className={`border-2 rounded-lg p-4 transition ${
                      selectedQty > 0
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="mb-3">
                      <img
                        src={asset.thumbnail || 'https://via.placeholder.com/150?text=Asset'}
                        alt={asset.name}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150?text=Error';
                        }}
                      />
                    </div>

                    <h4 className="font-semibold text-gray-800 mb-1">{asset.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{asset.category}</p>
                    <p className="text-sm text-gray-600 mb-3">
                      Tersedia: <span className="font-bold text-green-600">{asset.available}</span> / {asset.total}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectAsset(asset, Math.max(0, selectedQty - 1))}
                        disabled={selectedQty === 0}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={asset.available}
                        value={selectedQty}
                        onChange={(e) => {
                          const qty = Math.min(asset.available, Math.max(0, parseInt(e.target.value) || 0));
                          handleSelectAsset(asset, qty);
                        }}
                        className="w-16 text-center border border-gray-300 rounded py-1"
                      />
                      <button
                        onClick={() => handleSelectAsset(asset, Math.min(asset.available, selectedQty + 1))}
                        disabled={selectedQty >= asset.available}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Items Summary */}
          {borrowerForm.selectedItems.length > 0 && (
            <div className="mb-8 bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Aset Dipilih:</h4>
              <ul className="space-y-1">
                {borrowerForm.selectedItems.map(item => (
                  <li key={item.assetId} className="text-sm text-gray-700">
                    • {item.name} - <span className="font-bold">{item.quantity} unit</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitApplication}
            className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition font-semibold text-lg flex items-center justify-center gap-2"
          >
            <Send className="w-6 h-6" />
            Hantar Permohonan
          </button>
        </div>
      </div>
    </div>
  );

  // Status Check View
  const renderStatusView = () => {
    const filteredApps = getFilteredApplications();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
            <h2 className="text-3xl font-bold text-gray-800">Status Permohonan</h2>
            <p className="text-gray-600 mt-2">Lihat status permohonan peminjaman anda</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cari
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ID, nama, atau jabatan..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua</option>
                  <option value="pending">Menunggu</option>
                  <option value="approved">Diluluskan</option>
                  <option value="rejected">Ditolak</option>
                  <option value="returned">Dipulangkan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tarikh
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua</option>
                  <option value="today">Hari Ini</option>
                  <option value="week">7 Hari Lepas</option>
                  <option value="month">30 Hari Lepas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApps.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tiada permohonan dijumpai</p>
              </div>
            ) : (
              filteredApps.map(app => (
                <div key={app.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{app.id}</h3>
                      <p className="text-gray-600">{app.borrowerName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          app.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : app.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {app.status === 'pending' && 'Menunggu Kelulusan'}
                        {app.status === 'approved' && 'Diluluskan'}
                        {app.status === 'rejected' && 'Ditolak'}
                      </span>
                      {app.fullyReturned && (
                        <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                          Telah Dipulangkan
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Jabatan: <span className="font-semibold text-gray-800">{app.department}</span></p>
                      <p className="text-gray-600">Email: <span className="font-semibold text-gray-800">{app.email}</span></p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tarikh Pinjam: <span className="font-semibold text-gray-800">{formatDate(app.loanDate)}</span></p>
                      <p className="text-gray-600">Tarikh Pulang: <span className="font-semibold text-gray-800">{formatDate(app.returnDate)}</span></p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Aset Dipinjam:</h4>
                    <div className="space-y-1">
                      {app.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-semibold text-gray-800">
                            {item.returned}/{item.borrowed} dipulangkan
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Admin View - WITH ENHANCED FEATURES
  const renderAdminView = () => {
    const stats = getStatistics();
    const pendingApps = applications.filter(app => app.status === 'pending');
    const activeLoans = applications.filter(app => app.status === 'approved' && !app.fullyReturned);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Dashboard Admin</h2>
                <p className="text-gray-600 mt-2">Pengurusan permohonan dan aset</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </button>
                <button
                  onClick={() => setCurrentView('home')}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Kembali
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Menunggu</h3>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Aktif</h3>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.active}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Dipulangkan</h3>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.returned}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Aset Tersedia</h3>
                <Package className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{stats.availableAssets}/{stats.totalAssets}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-lg mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setCurrentView('admin')}
                className="flex-1 py-4 px-6 text-center font-semibold border-b-2 border-blue-600 text-blue-600"
              >
                Permohonan ({pendingApps.length})
              </button>
              <button
                onClick={() => setCurrentView('admin-active')}
                className="flex-1 py-4 px-6 text-center font-semibold text-gray-600 hover:text-gray-800"
              >
                Pinjaman Aktif ({activeLoans.length})
              </button>
              <button
                onClick={() => setCurrentView('admin-assets')}
                className="flex-1 py-4 px-6 text-center font-semibold text-gray-600 hover:text-gray-800"
              >
                Inventori Aset ({assets.length})
              </button>
            </div>
          </div>

          {/* Pending Applications */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Permohonan Menunggu Kelulusan</h3>
            {pendingApps.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tiada permohonan menunggu kelulusan</p>
              </div>
            ) : (
              pendingApps.map(app => (
                <div key={app.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">{app.id}</h4>
                      <p className="text-gray-600">{app.borrowerName} - {app.department}</p>
                      <p className="text-sm text-gray-500">Dipohon: {formatDate(app.appliedDate)}</p>
                    </div>
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                      Menunggu
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Email: <span className="font-semibold">{app.email}</span></p>
                      <p className="text-gray-600">Telefon: <span className="font-semibold">{app.phone}</span></p>
                      <p className="text-gray-600">Tujuan: <span className="font-semibold">{app.purpose}</span></p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tarikh Pinjam: <span className="font-semibold">{formatDate(app.loanDate)}</span></p>
                      <p className="text-gray-600">Tarikh Pulang: <span className="font-semibold">{formatDate(app.returnDate)}</span></p>
                    </div>
                  </div>

                  {/* Items with Editable Quantities */}
                  <div className="border-t pt-4 mb-4">
                    <h5 className="font-semibold text-gray-800 mb-3">Aset Dipohon (Boleh Edit Kuantiti):</h5>
                    <div className="space-y-2">
                      {(approvalForm.editedItems.length > 0 && selectedApplication?.id === app.id
                        ? approvalForm.editedItems
                        : app.items
                      ).map((item, idx) => {
                        const isEditing = selectedApplication?.id === app.id;
                        return (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex-1">
                              <span className="font-semibold text-gray-800">{item.name}</span>
                              <span className="text-sm text-gray-600 ml-2">({item.category})</span>
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const updated = [...approvalForm.editedItems];
                                    updated[idx] = { ...updated[idx], borrowed: Math.max(0, updated[idx].borrowed - 1) };
                                    setApprovalForm({ ...approvalForm, editedItems: updated });
                                  }}
                                  className="bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.borrowed}
                                  onChange={(e) => {
                                    const updated = [...approvalForm.editedItems];
                                    updated[idx] = { ...updated[idx], borrowed: parseInt(e.target.value) || 0 };
                                    setApprovalForm({ ...approvalForm, editedItems: updated });
                                  }}
                                  className="w-16 text-center border border-gray-300 rounded py-1"
                                />
                                <button
                                  onClick={() => {
                                    const updated = [...approvalForm.editedItems];
                                    updated[idx] = { ...updated[idx], borrowed: updated[idx].borrowed + 1 };
                                    setApprovalForm({ ...approvalForm, editedItems: updated });
                                  }}
                                  className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                >
                                  +
                                </button>
                                <span className="text-sm text-gray-600 ml-2">unit</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-blue-600">{item.borrowed} unit</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Verifier Name Input & Actions */}
                  {selectedApplication?.id === app.id ? (
                    <div className="border-t pt-4">
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nama Pegawai Pengesah *
                        </label>
                        <input
                          type="text"
                          value={approvalForm.verifierName}
                          onChange={(e) => setApprovalForm({ ...approvalForm, verifierName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Nama pegawai yang mengesahkan"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApproveApplication(app)}
                          className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Luluskan
                        </button>
                        <button
                          onClick={() => handleRejectApplication(app)}
                          className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Tolak
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApplication(null);
                            setApprovalForm({ verifierName: '', editedItems: [] });
                          }}
                          className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedApplication(app);
                        setApprovalForm({
                          verifierName: '',
                          editedItems: JSON.parse(JSON.stringify(app.items)) // Deep copy
                        });
                      }}
                      className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      Semak & Proses
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // NEW: Admin Active Loans View with Recipient Tracking
  const renderAdminActiveLoansView = () => {
    const activeLoans = applications.filter(app => app.status === 'approved' && !app.fullyReturned);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Pinjaman Aktif</h2>
                <p className="text-gray-600 mt-2">Pengurusan pemulangan aset</p>
              </div>
              <button
                onClick={() => setCurrentView('admin')}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Kembali
              </button>
            </div>
          </div>

          {/* Active Loans List */}
          <div className="space-y-4">
            {activeLoans.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tiada pinjaman aktif</p>
              </div>
            ) : (
              activeLoans.map(app => {
                const daysUntilReturn = calculateDaysUntilReturn(app.returnDate);
                const isOverdue = daysUntilReturn < 0;

                return (
                  <div key={app.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-800">{app.id}</h4>
                        <p className="text-gray-600">{app.borrowerName} - {app.department}</p>
                        {app.verifiedBy && (
                          <p className="text-sm text-gray-500">Disahkan oleh: {app.verifiedBy}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {isOverdue ? `Lewat ${Math.abs(daysUntilReturn)} hari` : `${daysUntilReturn} hari lagi`}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600">Email: <span className="font-semibold">{app.email}</span></p>
                        <p className="text-gray-600">Telefon: <span className="font-semibold">{app.phone}</span></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tarikh Pinjam: <span className="font-semibold">{formatDate(app.loanDate)}</span></p>
                        <p className="text-gray-600">Tarikh Pulang: <span className="font-semibold">{formatDate(app.returnDate)}</span></p>
                      </div>
                    </div>

                    {/* Recipient Information */}
                    {app.recipientName ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <h5 className="font-semibold text-blue-800 mb-1">Maklumat Penerima Aset:</h5>
                        <p className="text-sm text-blue-700">Nama: {app.recipientName}</p>
                        <p className="text-sm text-blue-700">No. Pengenalan: {app.recipientId}</p>
                        <p className="text-xs text-blue-600 mt-1">Diserah pada: {new Date(app.handoverDate).toLocaleString('ms-MY')}</p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <h5 className="font-semibold text-yellow-800 mb-2">Rekod Penyerahan Aset</h5>
                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-semibold text-yellow-700 mb-1">
                              Nama Penerima *
                            </label>
                            <input
                              type="text"
                              value={recipientForm.recipientName}
                              onChange={(e) => setRecipientForm({ ...recipientForm, recipientName: e.target.value })}
                              className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                              placeholder="Nama penuh penerima"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-yellow-700 mb-1">
                              No. Kad Pengenalan *
                            </label>
                            <input
                              type="text"
                              value={recipientForm.recipientId}
                              onChange={(e) => setRecipientForm({ ...recipientForm, recipientId: e.target.value })}
                              className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 text-sm"
                              placeholder="XXXXXX-XX-XXXX"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssetHandover(app.id)}
                          className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm font-semibold"
                        >
                          Simpan Rekod Penerima
                        </button>
                      </div>
                    )}

                    {/* Items & Return Management */}
                    <div className="border-t pt-4">
                      <h5 className="font-semibold text-gray-800 mb-3">Status Aset:</h5>
                      <div className="space-y-3">
                        {app.items.map((item, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-semibold text-gray-800">{item.name}</span>
                                <p className="text-sm text-gray-600">
                                  Dipinjam: {item.borrowed} | Dipulang: {item.returned} | Baki: {item.balance}
                                </p>
                              </div>
                              {item.balance > 0 && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max={item.balance}
                                    defaultValue="1"
                                    id={`return-${app.id}-${item.assetId}`}
                                    className="w-16 text-center border border-gray-300 rounded py-1"
                                  />
                                  <button
                                    onClick={() => {
                                      const qty = parseInt(document.getElementById(`return-${app.id}-${item.assetId}`).value) || 1;
                                      handleReturnItem(app.id, item.assetId, Math.min(qty, item.balance));
                                    }}
                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition text-sm font-semibold"
                                  >
                                    Pulang
                                  </button>
                                </div>
                              )}
                            </div>
                            {item.balance === 0 && (
                              <span className="text-xs text-green-600 font-semibold">✓ Lengkap dipulangkan</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // NEW: Admin Assets Inventory View with CRUD
  const renderAdminAssetsView = () => {
    const activeAssets = assets.filter(a => a.isActive !== false);
    const inactiveAssets = assets.filter(a => a.isActive === false);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Inventori Aset</h2>
                <p className="text-gray-600 mt-2">Pengurusan aset perpustakaan</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleOpenAssetModal()}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Aset
                </button>
                <button
                  onClick={() => setCurrentView('admin')}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Kembali
                </button>
              </div>
            </div>
          </div>

          {/* Active Assets */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Aset Aktif ({activeAssets.length})</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeAssets.map(asset => (
                <div key={asset.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative">
                    <img
                      src={asset.thumbnail || 'https://via.placeholder.com/300x200?text=Asset'}
                      alt={asset.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=Error';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Aktif
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <h4 className="font-bold text-gray-800 mb-1">{asset.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{asset.category}</p>
                    <p className="text-sm text-gray-600 mb-3">
                      ID: <span className="font-semibold">{asset.id}</span>
                    </p>

                    <div className="flex justify-between items-center mb-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Jumlah</p>
                        <p className="text-lg font-bold text-gray-800">{asset.total}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Tersedia</p>
                        <p className="text-lg font-bold text-green-600">{asset.available}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Dipinjam</p>
                        <p className="text-lg font-bold text-blue-600">{asset.total - asset.available}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenAssetModal(asset)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center justify-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleAssetStatus(asset.id)}
                        className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition text-sm font-semibold"
                      >
                        Nonaktif
                      </button>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inactive Assets */}
          {inactiveAssets.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Aset Tidak Aktif ({inactiveAssets.length})</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {inactiveAssets.map(asset => (
                  <div key={asset.id} className="bg-white rounded-xl shadow-lg overflow-hidden opacity-75">
                    {/* Thumbnail */}
                    <div className="relative">
                      <img
                        src={asset.thumbnail || 'https://via.placeholder.com/300x200?text=Asset'}
                        alt={asset.name}
                        className="w-full h-48 object-cover grayscale"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Error';
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Tidak Aktif
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4">
                      <h4 className="font-bold text-gray-800 mb-1">{asset.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{asset.category}</p>
                      <p className="text-sm text-gray-600 mb-3">
                        ID: <span className="font-semibold">{asset.id}</span>
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenAssetModal(asset)}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center justify-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleAssetStatus(asset.id)}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                        >
                          Aktifkan
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className="min-h-screen">
      {renderNotification()}
      {renderAssetModal()}
      
      {currentView === 'home' && renderHomeView()}
      {currentView === 'application' && renderApplicationView()}
      {currentView === 'status' && renderStatusView()}
      {currentView === 'admin' && renderAdminView()}
      {currentView === 'admin-active' && renderAdminActiveLoansView()}
      {currentView === 'admin-assets' && renderAdminAssetsView()}
    </div>
  );
};

export default LibLoanPPD;
