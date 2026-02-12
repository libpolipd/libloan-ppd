// emailService.js - SIMPLIFIED VERSION (1 Template Only)
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID; // Only 1 template!

// Email sending functions
export const EmailService = {
  
  // 1. Send approval notification
  sendApprovalNotification: async (application, approvedBy) => {
    try {
      const params = {
        to_email: application.email,
        to_name: application.borrowerName,
        
        // Email subject
        email_subject: `✅ Permohonan Diluluskan - ${application.id}`,
        
        // Email type for template
        notification_type: 'APPROVED',
        
        // Application details
        application_id: application.id,
        borrower_name: application.borrowerName,
        department: application.department,
        loan_date: new Date(application.loanDate).toLocaleDateString('ms-MY', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        return_date: new Date(application.returnDate).toLocaleDateString('ms-MY', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        
        // Items list
        items_list: application.items.map(item => 
          `• ${item.name} - ${item.borrowed} unit`
        ).join('\n'),
        
        // Approval details
        approved_by: approvedBy,
        approved_date: new Date().toLocaleDateString('ms-MY', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        
        // Status and instructions
        status_message: 'DILULUSKAN',
        status_color: 'green',
        
        main_message: `Tahniah! Permohonan peminjaman aset anda telah diluluskan oleh ${approvedBy}.`,
        
        instructions: `Langkah Seterusnya:
• Datang ke Perpustakaan pada tarikh peminjaman
• Bawa kad pengenalan untuk verifikasi
• Aset akan diserahkan selepas pengesahan
• Pastikan pulangkan aset pada tarikh yang ditetapkan`,
        
        // Contact info
        contact_email: 'perpustakaan@polipd.edu.my',
        contact_phone: '06-647 7000',
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
      console.log('✅ Approval email sent to:', application.email);
      return true;
    } catch (error) {
      console.error('❌ Email failed:', error);
      return false;
    }
  },

  // 2. Send reminder notification
  sendReminderNotification: async (application, daysUntilReturn) => {
    try {
      const params = {
        to_email: application.email,
        to_name: application.borrowerName,
        
        // Email subject
        email_subject: `⏰ Reminder: Pemulangan Aset - ${application.id}`,
        
        // Email type for template
        notification_type: 'REMINDER',
        
        // Application details
        application_id: application.id,
        borrower_name: application.borrowerName,
        department: application.department,
        loan_date: new Date(application.loanDate).toLocaleDateString('ms-MY', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        return_date: new Date(application.returnDate).toLocaleDateString('ms-MY', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        
        // Items list (only unreturned items)
        items_list: application.items
          .filter(item => item.balance > 0)
          .map(item => 
            `• ${item.name} - ${item.balance} unit (${item.returned}/${item.borrowed} dipulangkan)`
          ).join('\n'),
        
        // Reminder details
        days_until_return: daysUntilReturn,
        approved_by: application.approvedBy || 'Admin',
        approved_date: '', // Not needed for reminder
        
        // Status and instructions
        status_message: daysUntilReturn <= 0 ? 'LEWAT TARIKH' : `${daysUntilReturn} HARI LAGI`,
        status_color: daysUntilReturn <= 0 ? 'red' : daysUntilReturn <= 2 ? 'orange' : 'blue',
        
        main_message: daysUntilReturn <= 0 
          ? `Tarikh pemulangan aset anda telah tamat. Sila pulangkan aset secepat mungkin.`
          : `Tarikh pemulangan aset anda adalah ${daysUntilReturn} hari lagi. Sila ambil perhatian.`,
        
        instructions: `Untuk Pemulangan:
• Datang ke Perpustakaan sebelum tarikh pulang
• Pastikan semua aset dalam keadaan baik
• Serahkan kepada pegawai perpustakaan
• Dapatkan pengesahan pemulangan`,
        
        // Contact info
        contact_email: 'perpustakaan@polipd.edu.my',
        contact_phone: '06-647 7000',
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
      console.log('✅ Reminder email sent to:', application.email);
      return true;
    } catch (error) {
      console.error('❌ Email failed:', error);
      return false;
    }
  },
};

// Helper function to check if EmailJS is configured
export const isEmailConfigured = () => {
  return !!(
    import.meta.env.VITE_EMAILJS_SERVICE_ID &&
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY &&
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  );
};

// Helper function to calculate days until return
export const calculateDaysUntilReturn = (returnDateStr) => {
  const returnDate = new Date(returnDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  returnDate.setHours(0, 0, 0, 0);
  
  const diffTime = returnDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};
