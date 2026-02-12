# 📚 LibLoanPPD - Sistem Peminjaman Aset

Sistem Peminjaman Aset untuk Perpustakaan Politeknik Port Dickson

## 🚀 Features

- ✅ Permohonan peminjaman online
- ✅ Semak status permohonan
- ✅ Admin panel untuk kelulusan
- ✅ Email notifications automatic
- ✅ Pengurusan pemulangan aset
- ✅ Tracking sejarah peminjaman
- ✅ Mobile responsive

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Email:** EmailJS
- **Hosting:** Vercel

## 📦 Installation (Local Development)

```bash
# Clone repository
git clone https://github.com/yourusername/libloan-ppd.git

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your EmailJS credentials

# Run development server
npm run dev
```

## 🌐 Deployment (Vercel)

1. Push code to GitHub
2. Import project to Vercel
3. Set Framework Preset to "Vite"
4. Add environment variables
5. Deploy!

## 🔐 Default Admin Login

- **Password:** `admin123`
- ⚠️ **IMPORTANT:** Change this password after first login!

## 📧 Email Configuration

Setup EmailJS:
1. Create account at [emailjs.com](https://emailjs.com)
2. Add Gmail service
3. Create 6 email templates (see EMAIL-TEMPLATES.md)
4. Copy Service ID and Template IDs to .env

## 📝 Environment Variables

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_TEMPLATE_APPLICATION_RECEIVED_USER=template_id
VITE_TEMPLATE_APPLICATION_RECEIVED_ADMIN=template_id
VITE_TEMPLATE_APPLICATION_APPROVED=template_id
VITE_TEMPLATE_APPLICATION_REJECTED=template_id
VITE_TEMPLATE_RETURN_REQUESTED=template_id
VITE_TEMPLATE_RETURN_CONFIRMED=template_id
```

## 📖 Usage

### For Users:
1. Click "Mohon Peminjaman"
2. Fill in borrower details
3. Select items to borrow
4. Submit application
5. Receive email confirmation
6. Wait for admin approval

### For Admin:
1. Login with password
2. View pending applications
3. Review and approve/reject
4. Manage returns
5. View asset inventory

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this for your institution

## 👥 Credits

Developed for Perpustakaan Politeknik Port Dickson

## 📞 Support

For issues or questions:
- Email: perpustakaan@polipd.edu.my
- Phone: 06-647 7000

---

Made with ❤️ for PoliPD
