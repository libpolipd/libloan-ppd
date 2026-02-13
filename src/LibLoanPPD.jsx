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
  Archive
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

  // Asset Inventory
  const [assets, setAssets] = useState([
    { id: 'A001', name: 'Projektor LCD', category: 'Elektronik', total: 5, available: 5 },
    { id: 'A002', name: 'Laptop Dell', category: 'Elektronik', total: 10, available: 10 },
    { id: 'A003', name: 'Kamera DSLR', category: 'Elektronik', total: 3, available: 3 },
    { id: 'A004', name: 'Tripod', category: 'Peralatan', total: 8, available: 8 },
    { id: 'A005', name: 'Mikropon Wireless', category: 'Audio', total: 6, available: 6 },
    { id: 'A006', name: 'Speaker Portable', category: 'Audio', total: 4, available: 4 },
    { id: 'A007', name: 'Whiteboard Portable', category: 'Peralatan', total: 3, available: 3 },
    { id: 'A008', name: 'Extension Cable 10m', category: 'Peralatan', total: 15, available: 15 },
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

    if (new Date(returnDate) <= new Date(loanDate)) {
      showNotificationMessage('Tarikh pemulangan mesti selepas tarikh peminjaman', 'error');
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
      
      // Send reminder 3 days before, 1 day before, and on overdue
      if (daysUntilReturn === 3 || daysUntilReturn === 1 || daysUntilReturn === 0 || daysUntilReturn < 0) {
        await EmailService.sendReminderNotification(app, daysUntilReturn);
      }
    }
  };

  // ==================== APPLICATION FUNCTIONS ====================

  const handleItemSelection = (asset, quantity) => {
    const existingIndex = borrowerForm.selectedItems.findIndex(item => item.assetId === asset.id);
    
    if (quantity === 0) {
      // Remove item
      setBorrowerForm({
        ...borrowerForm,
        selectedItems: borrowerForm.selectedItems.filter(item => item.assetId !== asset.id)
      });
    } else if (existingIndex >= 0) {
      // Update quantity
      const updatedItems = [...borrowerForm.selectedItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: quantity
      };
      setBorrowerForm({
        ...borrowerForm,
        selectedItems: updatedItems
      });
    } else {
      // Add new item
      setBorrowerForm({
        ...borrowerForm,
        selectedItems: [...borrowerForm.selectedItems, {
          assetId: asset.id,
          name: asset.name,
          category: asset.category,
          quantity: quantity,
          borrowed: quantity,
          returned: 0,
          balance: quantity
        }]
      });
    }
  };

  const submitApplication = async () => {
    if (!validateForm()) return;

    // Check availability
    const availabilityCheck = checkAssetAvailability(borrowerForm.selectedItems);
    if (!availabilityCheck.available) {
      showNotificationMessage(availabilityCheck.message, 'error');
      return;
    }

    const newApplication = {
      id: generateApplicationId(),
      ...borrowerForm,
      items: borrowerForm.selectedItems,
      status: 'pending',
      submittedDate: new Date().toISOString(),
      approvedDate: null,
      approvedBy: null,
      rejectedDate: null,
      rejectedReason: null,
      fullyReturned: false,
      returnHistory: []
    };

    // Save to Google Sheets
    if (GoogleSheetsService.isConfigured()) {
      try {
        await GoogleSheetsService.saveApplication(newApplication);
        console.log('✅ Application saved to Google Sheets');
      } catch (error) {
        console.error('Error saving to Google Sheets:', error);
        showNotificationMessage('Application saved locally only', 'warning');
      }
    }

    // Update local state
    setApplications([...applications, newApplication]);
    
    showNotificationMessage(
      `Permohonan berjaya dihantar! ID Permohonan: ${newApplication.id}`,
      'success'
    );

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

    // Navigate to status view
    setTimeout(() => {
      setCurrentView('status');
    }, 2000);
  };

  const approveApplication = async (applicationId) => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    // Check availability again
    const availabilityCheck = checkAssetAvailability(app.selectedItems);
    if (!availabilityCheck.available) {
      showNotificationMessage(availabilityCheck.message, 'error');
      return;
    }

    // Update asset inventory
    const updatedAssets = assets.map(asset => {
      const borrowedItem = app.selectedItems.find(item => item.assetId === asset.id);
      if (borrowedItem) {
        return {
          ...asset,
          available: asset.available - borrowedItem.quantity
        };
      }
      return asset;
    });
    setAssets(updatedAssets);

    // Prepare update data
    const updates = {
      status: 'approved',
      approvedDate: new Date().toISOString(),
      approvedBy: 'Admin'
    };

    // Update Google Sheets
    if (GoogleSheetsService.isConfigured()) {
      try {
        await GoogleSheetsService.updateApplication(applicationId, updates);
        await GoogleSheetsService.updateAssets(updatedAssets);
        console.log('✅ Updated Google Sheets');
      } catch (error) {
        console.error('Error updating Google Sheets:', error);
      }
    }

    // Update local state
    const updatedApplications = applications.map(a => {
      if (a.id === applicationId) {
        return { ...a, ...updates };
      }
      return a;
    });
    setApplications(updatedApplications);

    // Send approval email
    const approvedApp = updatedApplications.find(a => a.id === applicationId);
    if (isEmailConfigured()) {
      const emailSent = await EmailService.sendApprovalNotification(approvedApp, 'Admin');
      if (emailSent) {
        showNotificationMessage('Permohonan diluluskan dan email dihantar!', 'success');
      } else {
        showNotificationMessage('Permohonan diluluskan tetapi email gagal dihantar', 'warning');
      }
    } else {
      showNotificationMessage('Permohonan diluluskan!', 'success');
    }

    setSelectedApplication(null);
  };

  const rejectApplication = (applicationId, reason) => {
    const updatedApplications = applications.map(app => {
      if (app.id === applicationId) {
        return {
          ...app,
          status: 'rejected',
          rejectedDate: new Date().toISOString(),
          rejectedReason: reason
        };
      }
      return app;
    });
    setApplications(updatedApplications);
    
    // Update Google Sheets
    if (GoogleSheetsService.isConfigured()) {
      GoogleSheetsService.updateApplication(applicationId, {
        status: 'rejected',
        rejectedDate: new Date().toISOString(),
        rejectedReason: reason
      }).catch(err => console.error('Error updating Google Sheets:', err));
    }
    
    showNotificationMessage('Permohonan ditolak', 'info');
    setSelectedApplication(null);
  };

  const processReturn = async (applicationId, returnedItems) => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    // Update application items
    const updatedItems = app.items.map(item => {
      const returnedItem = returnedItems.find(r => r.assetId === item.assetId);
      if (returnedItem) {
        return {
          ...item,
          returned: item.returned + returnedItem.quantity,
          balance: item.balance - returnedItem.quantity
        };
      }
      return item;
    });

    // Check if fully returned
    const fullyReturned = updatedItems.every(item => item.balance === 0);

    // Update asset inventory
    const updatedAssets = assets.map(asset => {
      const returnedItem = returnedItems.find(r => r.assetId === asset.id);
      if (returnedItem) {
        return {
          ...asset,
          available: asset.available + returnedItem.quantity
        };
      }
      return asset;
    });
    setAssets(updatedAssets);

    // Prepare return record
    const returnRecord = {
      applicationId: applicationId,
      borrowerName: app.borrowerName,
      items: returnedItems,
      processedBy: 'Admin',
      notes: fullyReturned ? 'Full return' : 'Partial return'
    };

    // Update Google Sheets
    if (GoogleSheetsService.isConfigured()) {
      try {
        await GoogleSheetsService.updateApplication(applicationId, {
          items: updatedItems,
          fullyReturned: fullyReturned,
          returnHistory: [...app.returnHistory, {
            date: new Date().toISOString(),
            items: returnedItems,
            processedBy: 'Admin'
          }]
        });
        await GoogleSheetsService.updateAssets(updatedAssets);
        await GoogleSheetsService.saveReturn(returnRecord);
        console.log('✅ Return recorded in Google Sheets');
      } catch (error) {
        console.error('Error saving return to Google Sheets:', error);
      }
    }

    // Update local state
    const updatedApplications = applications.map(a => {
      if (a.id === applicationId) {
        return {
          ...a,
          items: updatedItems,
          fullyReturned: fullyReturned,
          returnHistory: [...a.returnHistory, {
            date: new Date().toISOString(),
            items: returnedItems,
            processedBy: 'Admin'
          }]
        };
      }
      return a;
    });
    setApplications(updatedApplications);

    showNotificationMessage(
      fullyReturned ? 'Semua aset telah dipulangkan' : 'Pemulangan sebahagian berjaya direkod',
      'success'
    );
    setSelectedApplication(null);
  };

  // ==================== ADMIN FUNCTIONS ====================

  const handleAdminLogin = () => {
    // Simple password check - in production, use proper authentication
    if (adminPassword === 'admin123') {
      setIsAdminLoggedIn(true);
      setShowPasswordInput(false);
      setAdminPassword('');
      localStorage.setItem('libloan_admin_session', 'true');
      setCurrentView('admin');
      showNotificationMessage('Log masuk berjaya', 'success');
    } else {
      showNotificationMessage('Kata laluan salah', 'error');
      setAdminPassword('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('libloan_admin_session');
    setCurrentView('home');
    showNotificationMessage('Log keluar berjaya', 'info');
  };

  // ==================== FILTERING & SEARCH ====================

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
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(app => {
        const appDate = new Date(app.submittedDate);
        const daysDiff = Math.floor((now - appDate) / (1000 * 60 * 60 * 24));
        
        if (dateFilter === 'today') return daysDiff === 0;
        if (dateFilter === 'week') return daysDiff <= 7;
        if (dateFilter === 'month') return daysDiff <= 30;
        return true;
      });
    }

    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.id.toLowerCase().includes(term) ||
        app.borrowerName.toLowerCase().includes(term) ||
        app.staffId.toLowerCase().includes(term) ||
        app.department.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  // ==================== STATISTICS ====================

  const getStatistics = () => {
    const pending = applications.filter(app => app.status === 'pending').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    const fullyReturned = applications.filter(app => app.fullyReturned).length;
    const overdueCount = applications.filter(app => {
      if (app.status !== 'approved' || app.fullyReturned) return false;
      const daysUntil = calculateDaysUntilReturn(app.returnDate);
      return daysUntil < 0;
    }).length;

    const totalAssets = assets.reduce((sum, asset) => sum + asset.total, 0);
    const availableAssets = assets.reduce((sum, asset) => sum + asset.available, 0);
    const borrowedAssets = totalAssets - availableAssets;

    return {
      pending,
      approved,
      rejected,
      fullyReturned,
      overdueCount,
      totalAssets,
      availableAssets,
      borrowedAssets,
      utilizationRate: totalAssets > 0 ? ((borrowedAssets / totalAssets) * 100).toFixed(1) : 0
    };
  };

  // ==================== RENDER COMPONENTS ====================

  const renderNotification = () => {
    if (!showNotification) return null;

    const bgColors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    const icons = {
      success: CheckCircle,
      error: XCircle,
      warning: AlertCircle,
      info: AlertCircle
    };

    const Icon = icons[notificationType];

    return (
      <div className="fixed top-4 right-4 z-50 animate-slide-in">
        <div className={`${bgColors[notificationType]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md`}>
          <Icon className="w-6 h-6 flex-shrink-0" />
          <p className="font-medium">{notificationMessage}</p>
          <button
            onClick={() => setShowNotification(false)}
            className="ml-auto hover:bg-white/20 rounded p-1"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderHeader = () => (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold">LibLoanPPD</h1>
              <p className="text-blue-100 text-sm">Sistem Peminjaman Aset - Perpustakaan PPD</p>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            {!isAdminLoggedIn ? (
              <>
                <button
                  onClick={() => setCurrentView('home')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'home' ? 'bg-white text-blue-600' : 'hover:bg-blue-700'
                  }`}
                >
                  Utama
                </button>
                <button
                  onClick={() => setCurrentView('application')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'application' ? 'bg-white text-blue-600' : 'hover:bg-blue-700'
                  }`}
                >
                  Mohon Peminjaman
                </button>
                <button
                  onClick={() => setCurrentView('status')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'status' ? 'bg-white text-blue-600' : 'hover:bg-blue-700'
                  }`}
                >
                  Semak Status
                </button>
                <button
                  onClick={() => setShowPasswordInput(true)}
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-950 transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Admin
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'admin' ? 'bg-white text-blue-600' : 'hover:bg-blue-700'
                  }`}
                >
                  Dashboard Admin
                </button>
                
                {/* Sync Button */}
                {GoogleSheetsService.isConfigured() && (
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={lastSyncTime ? `Last sync: ${lastSyncTime.toLocaleTimeString()}` : 'Sync with Google Sheets'}
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync'}
                  </button>
                )}
                
                <button
                  onClick={handleAdminLogout}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log Keluar
                </button>
              </>
            )}
          </nav>
        </div>
        
        {/* Sync Status Indicator */}
        {GoogleSheetsService.isConfigured() && lastSyncTime && (
          <div className="mt-2 text-xs text-blue-200">
            Last synced: {lastSyncTime.toLocaleTimeString()} | 
            <span className="ml-1">Google Sheets Connected ✓</span>
          </div>
        )}
      </div>
    </header>
  );

  const renderHome = () => {
    const stats = getStatistics();

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Selamat Datang ke LibLoanPPD</h2>
          <p className="text-xl mb-6 text-blue-100">
            Sistem peminjaman aset perpustakaan yang mudah dan cekap untuk warga Politeknik Port Dickson
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView('application')}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Mohon Sekarang
            </button>
            <button
              onClick={() => setCurrentView('status')}
              className="bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors"
            >
              Semak Status
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800">{stats.totalAssets}</span>
            </div>
            <p className="text-gray-600 font-medium">Jumlah Aset</p>
            <p className="text-sm text-gray-500 mt-1">{stats.availableAssets} tersedia</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-800">{stats.utilizationRate}%</span>
            </div>
            <p className="text-gray-600 font-medium">Kadar Penggunaan</p>
            <p className="text-sm text-gray-500 mt-1">{stats.borrowedAssets} dipinjam</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <span className="text-2xl font-bold text-gray-800">{stats.pending}</span>
            </div>
            <p className="text-gray-600 font-medium">Menunggu Kelulusan</p>
            <p className="text-sm text-gray-500 mt-1">{stats.approved} diluluskan</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-800">{stats.overdueCount}</span>
            </div>
            <p className="text-gray-600 font-medium">Lewat Tarikh</p>
            <p className="text-sm text-gray-500 mt-1">{stats.fullyReturned} dipulangkan</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Proses Mudah</h3>
            <p className="text-gray-600">
              Mohon peminjaman aset dalam beberapa langkah mudah. Borang yang ringkas dan jelas.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <Mail className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Notifikasi Email</h3>
            <p className="text-gray-600">
              Terima notifikasi automatik untuk kelulusan, penolakan, dan reminder pemulangan.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <FileText className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Tracking Lengkap</h3>
            <p className="text-gray-600">
              Jejak status permohonan dan sejarah peminjaman anda dengan mudah.
            </p>
          </div>
        </div>

        {/* Available Assets */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-2xl font-bold mb-6">Aset Tersedia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {assets.map(asset => (
              <div key={asset.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{asset.name}</p>
                    <p className="text-sm text-gray-500">{asset.category}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    asset.available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {asset.available > 0 ? 'Tersedia' : 'Habis'}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Tersedia:</span>
                    <span className="font-semibold">{asset.available}/{asset.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        asset.available > asset.total * 0.5 ? 'bg-green-500' :
                        asset.available > 0 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(asset.available / asset.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderApplicationForm = () => {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold">Borang Permohonan Peminjaman</h2>
          </div>

          {/* Borrower Information */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Maklumat Peminjam
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Penuh *
                </label>
                <input
                  type="text"
                  value={borrowerForm.borrowerName}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, borrowerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama penuh anda"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Staf/Pelajar *
                </label>
                <input
                  type="text"
                  value={borrowerForm.staffId}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, staffId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: 2024123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={borrowerForm.email}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@polipd.edu.my"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Telefon *
                </label>
                <input
                  type="tel"
                  value={borrowerForm.phone}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jabatan *
                </label>
                <select
                  value={borrowerForm.department}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih Jabatan</option>
                  <option value="Jabatan Teknologi Maklumat">Jabatan Teknologi Maklumat</option>
                  <option value="Jabatan Kejuruteraan Awam">Jabatan Kejuruteraan Awam</option>
                  <option value="Jabatan Kejuruteraan Elektrik">Jabatan Kejuruteraan Elektrik</option>
                  <option value="Jabatan Kejuruteraan Mekanikal">Jabatan Kejuruteraan Mekanikal</option>
                  <option value="Jabatan Perdagangan">Jabatan Perdagangan</option>
                  <option value="Jabatan Pelancongan">Jabatan Pelancongan</option>
                  <option value="Unit Hal Ehwal Pelajar">Unit Hal Ehwal Pelajar</option>
                  <option value="Unit Kokurikulum">Unit Kokurikulum</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tujuan Peminjaman *
                </label>
                <input
                  type="text"
                  value={borrowerForm.purpose}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, purpose: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Persembahan projek"
                />
              </div>
            </div>
          </div>

          {/* Loan Period */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Tempoh Peminjaman
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarikh Peminjaman *
                </label>
                <input
                  type="date"
                  value={borrowerForm.loanDate}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, loanDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarikh Pemulangan *
                </label>
                <input
                  type="date"
                  value={borrowerForm.returnDate}
                  onChange={(e) => setBorrowerForm({ ...borrowerForm, returnDate: e.target.value })}
                  min={borrowerForm.loanDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Asset Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Pilih Aset
            </h3>
            <div className="space-y-3">
              {assets.map(asset => {
                const selectedItem = borrowerForm.selectedItems.find(item => item.assetId === asset.id);
                const selectedQuantity = selectedItem ? selectedItem.quantity : 0;

                return (
                  <div key={asset.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-gray-800">{asset.name}</h4>
                          <span className="text-sm text-gray-500">({asset.category})</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            asset.available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {asset.available} tersedia
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Kuantiti:</label>
                        <select
                          value={selectedQuantity}
                          onChange={(e) => handleItemSelection(asset, parseInt(e.target.value))}
                          disabled={asset.available === 0}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="0">0</option>
                          {[...Array(Math.min(asset.available, 10))].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {borrowerForm.selectedItems.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Ringkasan Pilihan ({borrowerForm.selectedItems.length} item):
                </h4>
                <ul className="space-y-1">
                  {borrowerForm.selectedItems.map((item, index) => (
                    <li key={index} className="text-blue-800">
                      • {item.name} - {item.quantity} unit
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              onClick={submitApplication}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Hantar Permohonan
            </button>
            <button
              onClick={() => {
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
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStatusCheck = () => {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Search className="w-8 h-8 text-blue-600" />
              <h2 className="text-3xl font-bold">Semak Status Permohonan</h2>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari mengikut ID permohonan, nama, no. staf, atau jabatan..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Semua</option>
                <option value="pending">Menunggu</option>
                <option value="approved">Diluluskan</option>
                <option value="rejected">Ditolak</option>
                <option value="returned">Dipulangkan</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Tarikh:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Semua</option>
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Lepas</option>
                <option value="month">30 Hari Lepas</option>
              </select>
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {getFilteredApplications().length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Tiada permohonan dijumpai</p>
                <p className="text-gray-400 mt-2">
                  {applications.length === 0 
                    ? 'Belum ada permohonan. Cuba mohon peminjaman dahulu.'
                    : 'Cuba ubah kriteria carian atau penapis anda.'}
                </p>
              </div>
            ) : (
              getFilteredApplications().map(app => {
                const daysUntilReturn = app.status === 'approved' && !app.fullyReturned 
                  ? calculateDaysUntilReturn(app.returnDate)
                  : null;

                return (
                  <div key={app.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{app.id}</h3>
                        <p className="text-gray-600">{app.borrowerName} - {app.department}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {app.status === 'pending' ? 'Menunggu' :
                           app.status === 'approved' ? 'Diluluskan' :
                           app.status === 'rejected' ? 'Ditolak' : app.status}
                        </span>
                        {app.fullyReturned && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            Dipulangkan
                          </span>
                        )}
                        {daysUntilReturn !== null && daysUntilReturn < 0 && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            Lewat {Math.abs(daysUntilReturn)} hari
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Tarikh Mohon</p>
                        <p className="font-medium">{formatDate(app.submittedDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tarikh Pinjam</p>
                        <p className="font-medium">{formatDate(app.loanDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tarikh Pulang</p>
                        <p className="font-medium">{formatDate(app.returnDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tujuan</p>
                        <p className="font-medium">{app.purpose}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Aset Dipinjam:</p>
                      <div className="flex flex-wrap gap-2">
                        {app.items.map((item, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                            {item.name} - {item.borrowed} unit
                            {app.status === 'approved' && !app.fullyReturned && (
                              <span className="ml-2 text-gray-500">
                                ({item.returned}/{item.borrowed} pulang)
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {app.approvedBy && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          ✓ Diluluskan oleh {app.approvedBy} pada {formatDate(app.approvedDate)}
                        </p>
                      </div>
                    )}

                    {app.rejectedReason && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-800">
                          ✗ Ditolak: {app.rejectedReason}
                        </p>
                      </div>
                    )}

                    {daysUntilReturn !== null && daysUntilReturn >= 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          ⏰ {daysUntilReturn} hari lagi sebelum tarikh pulang
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAdminPanel = () => {
    if (!isAdminLoggedIn) {
      return (
        <div className="max-w-md mx-auto px-4 py-20">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <LogIn className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-6">Admin Login Required</h2>
            <p className="text-gray-600 mb-4">Sila log masuk untuk mengakses panel admin</p>
            <button
              onClick={() => setCurrentView('home')}
              className="text-blue-600 hover:underline"
            >
              Kembali ke Halaman Utama
            </button>
          </div>
        </div>
      );
    }

    const stats = getStatistics();
    const pendingApps = applications.filter(app => app.status === 'pending');
    const approvedApps = applications.filter(app => app.status === 'approved' && !app.fullyReturned);
    const overdueApps = approvedApps.filter(app => calculateDaysUntilReturn(app.returnDate) < 0);

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Dashboard Admin</h2>
              <p className="text-blue-100">Pengurusan permohonan dan aset perpustakaan</p>
            </div>
            
            {/* Google Sheets Status */}
            {GoogleSheetsService.isConfigured() && (
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-200 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Google Sheets Connected</span>
                </div>
                {lastSyncTime && (
                  <p className="text-xs text-blue-200">
                    Last sync: {lastSyncTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Menunggu Kelulusan</p>
                <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Diluluskan (Aktif)</p>
                <p className="text-3xl font-bold text-gray-800">{stats.approved - stats.fullyReturned}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Lewat Tarikh</p>
                <p className="text-3xl font-bold text-gray-800">{stats.overdueCount}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Aset Dipinjam</p>
                <p className="text-3xl font-bold text-gray-800">{stats.borrowedAssets}</p>
              </div>
              <Package className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Pending Applications */}
        {pendingApps.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              Permohonan Menunggu Kelulusan ({pendingApps.length})
            </h3>
            <div className="space-y-4">
              {pendingApps.map(app => (
                <div key={app.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-1">{app.id}</h4>
                      <p className="text-gray-600">{app.borrowerName} - {app.staffId}</p>
                      <p className="text-sm text-gray-500">{app.department}</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      Menunggu
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-sm">{app.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <p className="font-medium">{app.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tarikh Pinjam</p>
                      <p className="font-medium">{formatDate(app.loanDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tarikh Pulang</p>
                      <p className="font-medium">{formatDate(app.returnDate)}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Tujuan: {app.purpose}</p>
                    <p className="text-sm font-medium text-gray-700 mb-2">Aset Dipohon:</p>
                    <div className="flex flex-wrap gap-2">
                      {app.items.map((item, index) => {
                        const asset = assets.find(a => a.id === item.assetId);
                        const available = asset ? asset.available >= item.quantity : false;
                        return (
                          <span 
                            key={index} 
                            className={`px-3 py-1 rounded-full text-sm ${
                              available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.name} - {item.quantity} unit
                            {!available && ' (Tidak mencukupi!)'}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => approveApplication(app.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Luluskan
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Nyatakan sebab penolakan:');
                        if (reason) rejectApplication(app.id, reason);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Applications */}
        {approvedApps.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Peminjaman Aktif ({approvedApps.length})
            </h3>
            <div className="space-y-4">
              {approvedApps.map(app => {
                const daysUntilReturn = calculateDaysUntilReturn(app.returnDate);
                const isOverdue = daysUntilReturn < 0;
                const hasUnreturned = app.items.some(item => item.balance > 0);

                return (
                  <div key={app.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 mb-1">{app.id}</h4>
                        <p className="text-gray-600">{app.borrowerName} - {app.department}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Diluluskan
                        </span>
                        {isOverdue && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            Lewat {Math.abs(daysUntilReturn)} hari
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Tarikh Pinjam</p>
                        <p className="font-medium">{formatDate(app.loanDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tarikh Pulang</p>
                        <p className="font-medium">{formatDate(app.returnDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Hari Lagi</p>
                        <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                          {daysUntilReturn >= 0 ? daysUntilReturn : `Lewat ${Math.abs(daysUntilReturn)}`}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Status Aset:</p>
                      <div className="space-y-2">
                        {app.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">
                                Dipinjam: {item.borrowed} | Dipulang: {item.returned} | Baki: {item.balance}
                              </p>
                            </div>
                            {item.balance > 0 && (
                              <button
                                onClick={() => {
                                  const qty = parseInt(prompt(`Pulang berapa unit ${item.name}? (Max: ${item.balance})`));
                                  if (qty > 0 && qty <= item.balance) {
                                    processReturn(app.id, [{ assetId: item.assetId, quantity: qty }]);
                                  }
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                Pulang
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {hasUnreturned && (
                      <button
                        onClick={() => {
                          const returnItems = app.items
                            .filter(item => item.balance > 0)
                            .map(item => ({ assetId: item.assetId, quantity: item.balance }));
                          if (confirm('Pulangkan semua aset untuk permohonan ini?')) {
                            processReturn(app.id, returnItems);
                          }
                        }}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckSquare className="w-5 h-5" />
                        Pulangkan Semua
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Asset Inventory */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Inventori Aset
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map(asset => {
              const utilizationRate = ((asset.total - asset.available) / asset.total * 100).toFixed(0);
              return (
                <div key={asset.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-gray-800">{asset.name}</h4>
                      <p className="text-sm text-gray-500">{asset.category}</p>
                      <p className="text-xs text-gray-400 mt-1">ID: {asset.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      asset.available > asset.total * 0.5 ? 'bg-green-100 text-green-800' :
                      asset.available > 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {asset.available}/{asset.total}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tersedia:</span>
                      <span className="font-semibold">{asset.available} unit</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Dipinjam:</span>
                      <span className="font-semibold">{asset.total - asset.available} unit</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Penggunaan:</span>
                      <span className="font-semibold">{utilizationRate}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          asset.available > asset.total * 0.5 ? 'bg-green-500' :
                          asset.available > 0 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(asset.available / asset.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderPasswordModal = () => {
    if (!showPasswordInput) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <LogIn className="w-8 h-8 text-blue-600" />
            <h3 className="text-2xl font-bold">Admin Login</h3>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kata Laluan Admin
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              placeholder="Masukkan kata laluan"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              Default password: admin123
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAdminLogin}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Log Masuk
            </button>
            <button
              onClick={() => {
                setShowPasswordInput(false);
                setAdminPassword('');
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNotification()}
      {renderHeader()}
      {renderPasswordModal()}

      <main>
        {currentView === 'home' && renderHome()}
        {currentView === 'application' && renderApplicationForm()}
        {currentView === 'status' && renderStatusCheck()}
        {currentView === 'admin' && renderAdminPanel()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">LibLoanPPD</h3>
              <p className="text-gray-400 text-sm">
                Sistem Peminjaman Aset Perpustakaan<br />
                Politeknik Port Dickson
              </p>
              {GoogleSheetsService.isConfigured() && (
                <p className="text-xs text-green-400 mt-2">
                  ✓ Powered by Google Sheets
                </p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Hubungi Kami</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  perpustakaan@polipd.edu.my
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  06-647 7000
                </p>
                <p className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Politeknik Port Dickson
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Waktu Operasi</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Isnin - Khamis: 8:00 AM - 4:30 PM</p>
                <p>Jumaat: 8:00 AM - 12:15 PM, 2:45 PM - 4:30 PM</p>
                <p>Hujung Minggu: Tutup</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 Perpustakaan Politeknik Port Dickson. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LibLoanPPD;
