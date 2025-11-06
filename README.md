# 🗺️ Nmap GUI — Professional Web Edition

A modern, professional web-based graphical interface for Nmap network scanning, built with Node.js, Express, and vanilla JavaScript with Tkinter-inspired design.

## ✨ Features

### Core Functionality
- **Multi-target scanning** - Support for IPv4, IPv6, and domain names (comma-separated)
- **6 Scan Modes:**
  - 📡 **Ping** - Simple host discovery
  - ⚡ **Quick** - Top 200 ports scan
  - 🔍 **Full TCP** - All 65535 ports scan
  - 🔧 **SvcDetect** - Service and version detection
  - 🖥️ **OS Detect** - Operating system fingerprinting
  - 🎯 **NSE** - NSE script scanning

### User Interface
- 🎨 **Theme Switching** - Light/Dark mode with persistent storage
- 📊 **Responsive Multi-Panel Layout:**
  - Control Panel with target input
  - Host Summary with status LED
  - Ports table with sorting and filtering
  - Scan History panel
  - Real-time logs and error reporting
- 🔍 **Port Filtering** - Search and filter results by protocol, port, service, or state
- 📈 **Sortable Ports Table** - Click column headers to sort

### Data Management
- 💾 **Save XML** - Export raw Nmap XML output
- 📊 **Export CSV** - Export ports to CSV format
- 📋 **Copy Results** - Quick copy ports to clipboard
- 📁 **Output Folder** - Access saved scan files
- 🔄 **Re-run Scans** - Execute previous scans again
- 📝 **Scan History** - View and reload previous scans (10 most recent)

### Advanced Features
- 🔐 **Root Detection** - Automatic privilege detection for advanced scans
- 📦 **XML Parsing** - Parses Nmap XML with IPv4/IPv6 support
- 🏷️ **MAC Address Resolution** - Shows vendor information
- 📍 **OS Detection** - Displays operating system guesses
- ⏱️ **Real-time Progress** - Visual feedback during scans
- 📜 **Comprehensive Logging** - Detailed error and status logs

### Cross-Platform Support
- ✅ Windows
- ✅ Linux
- ✅ macOS

## 📋 Requirements

### System Requirements
- **Node.js** ≥ 14.0.0
- **npm** or **yarn**
- **Nmap** installed and in system PATH

### Installation

#### Install Nmap
```bash
# Ubuntu/Debian
sudo apt-get install nmap

# macOS
brew install nmap

# Windows
# Download from https://nmap.org/download.html