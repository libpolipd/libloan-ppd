// googleSheetsService.js - Smart Bi-Directional Sync with Google Sheets

const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
const IMAGE_FOLDER_ID = import.meta.env.VITE_GOOGLE_IMAGE_FOLDER_ID;

export const GoogleSheetsService = {
  
  // Check if Google Sheets is configured
  isConfigured: () => {
    return !!(GOOGLE_APPS_SCRIPT_URL && SPREADSHEET_ID);
  },

  // ==================== SMART SYNC STRATEGY ====================
  // Instead of overwriting, we merge data intelligently:
  // 1. Local data is the source of truth (what user just edited)
  // 2. Only sync TO Google Sheets (save local to cloud)
  // 3. Only pull FROM Google Sheets on first load or explicit "Download from Cloud"
  
  /**
   * SYNC TO GOOGLE SHEETS (Upload local data to cloud)
   * This preserves local changes and saves them to Google Sheets
   */
  syncToCloud: async (localApplications, localAssets) => {
    if (!GoogleSheetsService.isConfigured()) {
      console.log('⚠️ Google Sheets not configured');
      return { success: false, message: 'Not configured' };
    }

    try {
      console.log('📤 Uploading local data to Google Sheets...');

      // Save applications
      const appResult = await GoogleSheetsService.saveAllApplications(localApplications);
      
      // Save assets
      const assetResult = await GoogleSheetsService.saveAssets(localAssets);

      if (appResult.success && assetResult.success) {
        console.log('✅ Successfully synced to Google Sheets');
        return {
          success: true,
          message: 'Data uploaded to Google Sheets',
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Sync failed');
      }

    } catch (error) {
      console.error('❌ Sync to cloud failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  /**
   * SYNC FROM GOOGLE SHEETS (Download cloud data to local)
   * This REPLACES local data with cloud data - use carefully!
   */
  syncFromCloud: async () => {
    if (!GoogleSheetsService.isConfigured()) {
      console.log('⚠️ Google Sheets not configured');
      return { success: false, message: 'Not configured' };
    }

    try {
      console.log('📥 Downloading data from Google Sheets...');

      const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=getData`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Successfully downloaded from Google Sheets');
        return {
          success: true,
          applications: result.applications || [],
          assets: result.assets || [],
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(result.message || 'Download failed');
      }

    } catch (error) {
      console.error('❌ Sync from cloud failed:', error);
      return {
        success: false,
        applications: [],
        assets: [],
        message: error.message
      };
    }
  },

  /**
   * DEPRECATED: Old syncData method - kept for backward compatibility
   * Renamed to avoid confusion - use syncFromCloud instead
   */
  syncData: async () => {
    console.warn('⚠️ syncData() is deprecated. Use syncFromCloud() or syncToCloud() instead.');
    return await GoogleSheetsService.syncFromCloud();
  },

  // ==================== SAVE FUNCTIONS ====================

  /**
   * Save a single application to Google Sheets
   */
  saveApplication: async (application) => {
    if (!GoogleSheetsService.isConfigured()) {
      return { success: false };
    }

    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Important for Google Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveApplication',
          data: application
        })
      });

      // Note: no-cors mode doesn't allow reading response, so we assume success
      console.log('✅ Application saved to Google Sheets:', application.id);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to save application:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Save all applications to Google Sheets (batch update)
   */
  saveAllApplications: async (applications) => {
    if (!GoogleSheetsService.isConfigured()) {
      return { success: false };
    }

    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveAllApplications',
          data: applications
        })
      });

      console.log(`✅ ${applications.length} applications saved to Google Sheets`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to save applications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update an existing application in Google Sheets
   */
  updateApplication: async (application) => {
    if (!GoogleSheetsService.isConfigured()) {
      return { success: false };
    }

    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateApplication',
          data: application
        })
      });

      console.log('✅ Application updated in Google Sheets:', application.id);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to update application:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Save assets to Google Sheets
   */
  saveAssets: async (assets) => {
    if (!GoogleSheetsService.isConfigured()) {
      return { success: false };
    }

    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveAssets',
          data: assets
        })
      });

      console.log(`✅ ${assets.length} assets saved to Google Sheets`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to save assets:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete an application from Google Sheets
   */
  deleteApplication: async (applicationId) => {
    if (!GoogleSheetsService.isConfigured()) {
      return { success: false };
    }

    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteApplication',
          id: applicationId
        })
      });

      console.log('✅ Application deleted from Google Sheets:', applicationId);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to delete application:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== IMAGE UPLOAD (Optional) ====================

  /**
   * Upload image to Google Drive and get public URL
   */
  uploadImage: async (imageFile, assetId) => {
    if (!IMAGE_FOLDER_ID) {
      console.warn('⚠️ Image folder not configured');
      return { success: false, url: null };
    }

    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('folderId', IMAGE_FOLDER_ID);
      formData.append('assetId', assetId);

      const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?action=uploadImage`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Image uploaded:', result.url);
        return {
          success: true,
          url: result.url
        };
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error('❌ Image upload failed:', error);
      return {
        success: false,
        url: null,
        error: error.message
      };
    }
  }
};

// ==================== AUTO-SYNC HELPER ====================

/**
 * Auto-save helper that can be used after any data modification
 * Saves to localStorage AND Google Sheets automatically
 */
export const autoSave = async (applications, assets) => {
  // Always save to localStorage first (instant, reliable)
  localStorage.setItem('libloan_applications', JSON.stringify(applications));
  localStorage.setItem('libloan_assets', JSON.stringify(assets));

  // Then try to save to Google Sheets (background, may fail)
  if (GoogleSheetsService.isConfigured()) {
    try {
      await GoogleSheetsService.syncToCloud(applications, assets);
    } catch (error) {
      console.warn('⚠️ Auto-save to Google Sheets failed, but localStorage saved:', error);
    }
  }
};

export default GoogleSheetsService;
