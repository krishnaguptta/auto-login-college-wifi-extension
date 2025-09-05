# 🚀 Auto Wi-Fi Login - Seamless

<div align="center">

![Version](https://img.shields.io/badge/version-2.3.0-blue.svg)
![Chrome Extension](https://img.shields.io/badge/platform-Chrome%20Extension-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

**Seamless auto-login for captive portals with instant detection and zero user interruption**

[Installation](#installation) • [Features](#features) • [Usage](#usage) • [Configuration](#configuration) • [Contributing](#contributing)

</div>

## ✨ Features

- **⚡ Instant Detection** - Detects WiFi sign-out in 1-3 seconds
- **🔄 Seamless Auto-Login** - Automatic form filling and submission
- **🎥 Video Continuity** - Saves and restores video positions during reconnection
- **🚫 Zero Interruption** - Background operation with hidden login tabs
- **🔒 HTTPS Safe** - No Mixed Content errors on secure sites
- **🌐 Universal Compatibility** - Works on YouTube, Netflix, Spotify, and all websites
- **📱 Instant Tab Closure** - Login tabs close immediately after success

## 🎯 How It Works

1. **Monitors Network** - Continuously checks connectivity using reliable endpoints
2. **Instant Detection** - Detects WiFi disconnection within 1-3 seconds
3. **Background Login** - Opens hidden login tab automatically
4. **Auto-Submission** - Fills and submits credentials without user interaction
5. **Seamless Return** - Closes login tab and restores user's browsing session
6. **Video Restoration** - Continues videos from exact same position

## 📦 Installation

### From Source
1. Clone this repository:
   ```bash
   git clone https://github.com/krishnaguptta/auto-login-college-wifi-extension.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select the extension folder
5. Configure your WiFi credentials in the extension popup

### Chrome Web Store
*Coming soon...*

## 🔧 Configuration

1. Click the extension icon in your browser toolbar
2. Enter your WiFi login credentials:
   - **Username**: Your WiFi username
   - **Password**: Your WiFi password
   - **Auto-Submit**: Enable for automatic submission (recommended)
3. Save settings and enjoy seamless WiFi connectivity!

## 🚀 Usage

### For Students
Perfect for college/university WiFi that requires frequent re-authentication:
- Watch YouTube videos without interruption
- Stream Netflix without buffering pauses
- Browse seamlessly during study sessions

### For Professionals
Ideal for office WiFi or public hotspots:
- Uninterrupted video conferences
- Seamless file uploads/downloads
- Continuous productivity

## 📁 Project Structure

```
auto-login-college-wifi-extension/
├── manifest.json                 # Extension configuration
├── src/
│   ├── scripts/
│   │   ├── connectivity-check.js # WiFi monitoring and detection
│   │   ├── autologin.js          # Automatic login form handling
│   │   └── background-seamless.js # Background service worker
│   └── ui/
│       ├── popup.html            # Extension popup interface
│       ├── popup.js              # Popup functionality
│       ├── options.html          # Settings page
│       └── options.js            # Settings functionality
├── icons/                        # Extension icons
├── docs/
│   └── test-functional.html      # Testing interface
└── README.md                     # This file
```

## 🛠️ Technical Details

### Architecture
- **Manifest V3** - Latest Chrome extension architecture
- **Service Worker** - Background processing for seamless operation
- **Content Scripts** - Monitors all web pages for connectivity issues
- **HTTPS Compatible** - No Mixed Content security issues

### Performance
- **Detection Speed**: 1-3 seconds (3x faster than typical solutions)
- **Login Speed**: 200-300ms page load and submission
- **Memory Usage**: Minimal footprint with efficient monitoring
- **Battery Impact**: Optimized intervals to preserve device battery

## 🔒 Privacy & Security

- **Local Storage Only** - Credentials stored locally on your device
- **No Data Collection** - Extension doesn't collect or transmit user data
- **Secure Requests** - All network requests use secure protocols when possible
- **Open Source** - Full transparency with public source code

## 🧪 Testing

Use the included test interface to verify functionality:

1. Open `docs/test-functional.html` in your browser
2. Run connectivity tests
3. Verify service worker status
4. Test background login functionality

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Setup
```bash
# Clone the repository
git clone https://github.com/krishnaguptta/auto-login-college-wifi-extension.git

# Load in Chrome for development
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select the project folder
```

## 📝 Changelog

### Version 2.3.0 (Latest)
- ⚡ **3x faster detection** - Reduced detection time to 1-3 seconds
- 🚀 **Instant form submission** - 200ms page load and submission
- 🔧 **Optimized timeouts** - Parallel endpoint testing for maximum speed
- 📁 **Better project structure** - Organized files for maintainability

### Version 2.2.0
- ✅ **Complete functionality restoration** - All features working
- 🔐 **Enhanced auto-submission** - Multiple submission methods
- 🚪 **Improved tab management** - Instant closure after success

### Version 2.1.0
- 🔒 **HTTPS compatibility** - No Mixed Content errors
- 🛡️ **Security compliance** - Follows all browser security policies

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for seamless WiFi connectivity in educational institutions
- Built with modern Chrome Extension APIs for maximum compatibility
- Optimized for performance and user experience

## 📞 Support

Having issues? Here's how to get help:

1. **Check the [Issues](https://github.com/krishnaguptta/auto-login-college-wifi-extension/issues)** page
2. **Read the [FAQ](#faq)** section below
3. **Create a new issue** with detailed information

## ❓ FAQ

**Q: Will this work with my college WiFi?**
A: The extension is designed for common captive portal systems. Configure your credentials and test the functionality.

**Q: Is it safe to store my WiFi password?**
A: Yes, credentials are stored locally on your device using Chrome's secure storage API.

**Q: Does it work on all websites?**
A: Yes, the extension monitors all websites and is compatible with HTTPS sites including YouTube, Netflix, and Spotify.

**Q: How fast is the detection?**
A: WiFi disconnection is detected within 1-3 seconds, making reconnection virtually instantaneous.

---

<div align="center">

**Made with ❤️ for seamless WiFi connectivity**

[⭐ Star this repository](https://github.com/krishnaguptta/auto-login-college-wifi-extension) if it helps you!

</div>
