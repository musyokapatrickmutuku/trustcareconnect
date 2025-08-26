# 🚀 TrustCareConnect - 5-Minute Quick Start

## Get Started in 3 Commands

```bash
git clone https://github.com/musyokapatrickmutuku/trustcareconnect.git
cd trustcareconnect
./setup.sh
```

**Windows Users:** Use `setup.bat` instead of `./setup.sh`

## What Happens Automatically

The setup script does everything for you:
- ✅ Checks prerequisites (Node.js, npm, DFX)
- ✅ Installs dependencies  
- ✅ Starts local blockchain (DFX)
- ✅ Deploys smart contracts
- ✅ Loads test patient data
- ✅ Starts web application

## Instant Login Credentials

### 👥 Patient Accounts
| Name | Email | Password | Condition |
|------|-------|----------|-----------|
| Sarah Johnson | sarah.johnson@email.com | SarahDiabetes2024! | Type 2 Diabetes |
| Michael Rodriguez | mike.rodriguez@student.edu | MikeType1Diabetes! | Type 1 Diabetes |
| Carlos Mendoza | carlos.mendoza@gmail.com | CarlosType2_2024! | Type 2 + Heart |

### 👨‍⚕️ Doctor Accounts
| Name | Email | Password | Specialty |
|------|-------|----------|-----------|
| Dr. Maria Rodriguez | dr.rodriguez@trustcare.com | DrMaria2024Endo! | Endocrinology |
| Dr. James Thompson | dr.thompson@trustcare.com | DrJames2024Endo! | Endocrinology |

## Test the Application

1. **Wait 2-3 minutes** for setup to complete
2. **Open** http://localhost:3000 in your browser
3. **Login** with any credentials above
4. **Submit medical queries** as a patient
5. **Review AI responses** as a doctor

## What You'll See

- **Real AI responses** to medical questions
- **Patient medical histories** with comprehensive data
- **Doctor workflow** for reviewing and approving AI responses
- **Healthcare communication platform** in action

## Need Help?

- **Full Documentation**: README.md  
- **Detailed Setup**: SETUP-GUIDE.md
- **All Credentials**: TEST-CREDENTIALS.md
- **Manual Setup & Troubleshooting**: MANUAL-STARTUP-GUIDE.md 🔧

### 🚨 If Setup Script Fails

**Quick fixes for common issues:**
```bash
# NPM dependency issues
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# DFX replica issues  
dfx stop && dfx start --background --clean

# Frontend startup issues
cd packages/frontend && npm install react-dev-utils@12.0.1 --save-dev
```

👉 **For detailed troubleshooting**: [MANUAL-STARTUP-GUIDE.md](./MANUAL-STARTUP-GUIDE.md)

## Prerequisites (Auto-Checked)

The setup script checks these for you:
- Node.js ≥ 16.0.0
- npm ≥ 8.0.0  
- DFX (Internet Computer SDK)

If any are missing, the script tells you exactly how to install them.

---

**🎉 That's it! TrustCareConnect will be running with full test data in under 5 minutes.**