# Contributing to Auto Wi-Fi Login - Seamless

Thank you for your interest in contributing to this project! We welcome contributions from the community.

## 🚀 Getting Started

### Prerequisites
- Google Chrome browser
- Basic knowledge of JavaScript and Chrome Extension APIs
- Familiarity with Git and GitHub

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/auto-login-college-wifi-extension.git
   ```
3. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

## 📝 How to Contribute

### Reporting Bugs
1. Check if the bug has already been reported in [Issues](https://github.com/krishnaguptta/auto-login-college-wifi-extension/issues)
2. If not, create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser version and OS
   - Console logs (if applicable)

### Suggesting Enhancements
1. Check existing issues for similar suggestions
2. Create a new issue with:
   - Clear description of the enhancement
   - Use case and benefits
   - Possible implementation approach

### Pull Requests
1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Commit with descriptive messages
6. Push to your fork: `git push origin feature/amazing-feature`
7. Create a Pull Request

## 🏗️ Project Structure

```
src/
├── scripts/           # Core functionality
│   ├── connectivity-check.js    # WiFi monitoring
│   ├── autologin.js            # Login automation
│   └── background-seamless.js  # Background service
└── ui/               # User interface
    ├── popup.html/js  # Extension popup
    └── options.html/js # Settings page
```

## 🧪 Testing

### Manual Testing
1. Test on different WiFi networks
2. Verify functionality on various websites (YouTube, Netflix, etc.)
3. Check HTTPS compatibility
4. Test edge cases (poor connectivity, timeout scenarios)

### Using the Test Interface
- Open `docs/test-functional.html`
- Run all test functions
- Verify service worker status
- Check console for errors

## 📋 Coding Standards

### JavaScript
- Use modern ES6+ syntax
- Add meaningful comments
- Handle errors gracefully
- Use descriptive variable names
- Follow existing code style

### Git Commits
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 50 characters
- Reference issues when applicable

## 🔒 Security Guidelines

- Never commit credentials or sensitive data
- Use Chrome's secure storage APIs
- Validate all user inputs
- Follow Chrome extension security best practices
- Test for XSS and other security vulnerabilities

## 📚 Resources

### Chrome Extension APIs
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Service Workers in Extensions](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

### WiFi/Network APIs
- [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## 🏷️ Release Process

1. Update version in `manifest.json`
2. Update `CHANGELOG.md` with new features/fixes
3. Create release notes
4. Tag the release: `git tag v2.x.x`
5. Push tags: `git push --tags`

## 📞 Getting Help

- Read the [README.md](README.md) first
- Check [existing issues](https://github.com/krishnaguptta/auto-login-college-wifi-extension/issues)
- Create a new issue for questions
- Be patient and respectful in all interactions

## 🎯 Good First Issues

Looking for a place to start? Check issues labeled with:
- `good first issue`
- `help wanted`
- `documentation`
- `enhancement`

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

All contributors will be recognized in the project documentation. Thank you for making this project better!

---

**Happy Coding! 🚀**
