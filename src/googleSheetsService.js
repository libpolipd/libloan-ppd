// googleSheetsService.js - Google Sheets Integration Service
// This service handles all Google Sheets operations for LibLoanPPD

const SHEET_CONFIG = {
  SPREADSHEET_ID: '1CWbZo55u-KuXl-LD_aTSvC1KxR909ZifqnGXhinvRC0',
  IMAGE_FOLDER_ID: '1o5ufUujMuvk5QHtwPLRDdMPlWuQ-3fW5',
  
  // Google Apps Script Web App URL
  // You need to deploy Apps Script as Web App and paste URL here
  APPS_SCRIPT_URL: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '',
  
  // Sheet names
  SHEETS: {
    APPLICATIONS: 'Applications',
    ASSETS: 'Assets',
    RETURNS: 'Returns',
    USERS: 'Users'
  }
};

// ==================== GOOGLE SHEETS OPERATIONS ====================

export const GoogleSheetsService = {
  
  // Fetch all applications from Google Sheets
  fetchApplications: async () => {
    try {
      const response = await fetch(`${SHEET_CONFIG.APPS_SCRIPT_URL}?action=getApplications`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      return data.applications || [];
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Fallback to localStorage if Google Sheets fails
      const localData = localStorage.getItem('libloan_applications');
      return localData ? JSON.parse(localData) : [];
    }
  },

  // Save new application to Google Sheets
  saveApplication: async (application) => {
    try {
      const response = await fetch(SHEET_CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveApplication',
          data: application
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save application');
      }
      
      const result = await response.json();
      
      // Also save to localStorage as backup
      const localApps = JSON.parse(localStorage.getItem('libloan_applications') || '[]');
      localApps.push(application);
      localStorage.setItem('libloan_applications', JSON.stringify(localApps));
      
      return result;
    } catch (error) {
      console.error('Error saving application:', error);
      // Fallback to localStorage only
      const localApps = JSON.parse(localStorage.getItem('libloan_applications') || '[]');
      localApps.push(application);
      localStorage.setItem('libloan_applications', JSON.stringify(localApps));
      return { success: true, id: application.id, source: 'local' };
    }
  },

  // Update application status (approve/reject)
  updateApplication: async (applicationId, updates) => {
    try {
      const response = await fetch(SHEET_CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateApplication',
          applicationId: applicationId,
          data: updates
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application');
      }
      
      const result = await response.json();
      
      // Update localStorage
      const localApps = JSON.parse(localStorage.getItem('libloan_applications') || '[]');
      const updatedApps = localApps.map(app => 
        app.id === applicationId ? { ...app, ...updates } : app
      );
      localStorage.setItem('libloan_applications', JSON.stringify(updatedApps));
      
      return result;
    } catch (error) {
      console.error('Error updating application:', error);
      // Fallback to localStorage
      const localApps = JSON.parse(localStorage.getItem('libloan_applications') || '[]');
      const updatedApps = localApps.map(app => 
        app.id === applicationId ? { ...app, ...updates } : app
      );
      localStorage.setItem('libloan_applications', JSON.stringify(updatedApps));
      return { success: true, source: 'local' };
    }
  },

  // Fetch assets from Google Sheets
  fetchAssets: async () => {
    try {
      const response = await fetch(`${SHEET_CONFIG.APPS_SCRIPT_URL}?action=getAssets`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      
      const data = await response.json();
      return data.assets || [];
    } catch (error) {
      console.error('Error fetching assets:', error);
      // Fallback to localStorage
      const localData = localStorage.getItem('libloan_assets');
      return localData ? JSON.parse(localData) : getDefaultAssets();
    }
  },

  // Update asset inventory
  updateAssets: async (assets) => {
    try {
      const response = await fetch(SHEET_CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateAssets',
          data: assets
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update assets');
      }
      
      const result = await response.json();
      
      // Update localStorage
      localStorage.setItem('libloan_assets', JSON.stringify(assets));
      
      return result;
    } catch (error) {
      console.error('Error updating assets:', error);
      // Fallback to localStorage
      localStorage.setItem('libloan_assets', JSON.stringify(assets));
      return { success: true, source: 'local' };
    }
  },

  // Save return record
  saveReturn: async (returnRecord) => {
    try {
      const response = await fetch(SHEET_CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveReturn',
          data: returnRecord
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save return record');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving return:', error);
      return { success: false, error: error.message };
    }
  },

  // Upload image to Google Drive
  uploadImage: async (file, applicationId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', applicationId);
      formData.append('folderId', SHEET_CONFIG.IMAGE_FOLDER_ID);
      
      const response = await fetch(`${SHEET_CONFIG.APPS_SCRIPT_URL}?action=uploadImage`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const result = await response.json();
      return result.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  },

  // Sync data between localStorage and Google Sheets
  syncData: async () => {
    try {
      // Fetch from Google Sheets
      const [applications, assets] = await Promise.all([
        GoogleSheetsService.fetchApplications(),
        GoogleSheetsService.fetchAssets()
      ]);
      
      // Update localStorage
      if (applications.length > 0) {
        localStorage.setItem('libloan_applications', JSON.stringify(applications));
      }
      if (assets.length > 0) {
        localStorage.setItem('libloan_assets', JSON.stringify(assets));
      }
      
      return { success: true, applications, assets };
    } catch (error) {
      console.error('Error syncing data:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if Google Sheets is configured
  isConfigured: () => {
    return !!SHEET_CONFIG.APPS_SCRIPT_URL && SHEET_CONFIG.APPS_SCRIPT_URL.length > 0;
  }
};

// Default assets if Google Sheets not available
const getDefaultAssets = () => [
  { id: 'A001', name: 'Projektor LCD', category: 'Elektronik', total: 5, available: 5 },
  { id: 'A002', name: 'Laptop Dell', category: 'Elektronik', total: 10, available: 10 },
  { id: 'A003', name: 'Kamera DSLR', category: 'Elektronik', total: 3, available: 3 },
  { id: 'A004', name: 'Tripod', category: 'Peralatan', total: 8, available: 8 },
  { id: 'A005', name: 'Mikropon Wireless', category: 'Audio', total: 6, available: 6 },
  { id: 'A006', name: 'Speaker Portable', category: 'Audio', total: 4, available: 4 },
  { id: 'A007', name: 'Whiteboard Portable', category: 'Peralatan', total: 3, available: 3 },
  { id: 'A008', name: 'Extension Cable 10m', category: 'Peralatan', total: 15, available: 15 },
];

// Export configuration for use in other files
export const GOOGLE_DRIVE_CONFIG = {
  IMAGE_FOLDER_ID: SHEET_CONFIG.IMAGE_FOLDER_ID,
  getImageUrl: (fileId) => `https://drive.google.com/uc?export=view&id=${fileId}`,
  getFolderUrl: () => `https://drive.google.com/drive/folders/${SHEET_CONFIG.IMAGE_FOLDER_ID}`
};
