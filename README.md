# 🖥️ VM Management System

A comprehensive web-based Virtual Machine management platform that enables users to create, manage, and access virtual machines through a browser-based interface with **concurrent multi-VM support** and **dynamic overlay creation**.

## ✨ Key Features

### 1. Dynamic Overlay Creation for Scalability

Our system implements **QEMU QCOW2 overlay technology** to prevent base image overload. Instead of cloning entire base images for each VM, we create lightweight overlay files that:

- Reference a single base image
- Provide instant VM provisioning (no copying large files)
- Automatically clean up when VMs are wiped

## Working Demo

[View Demo Video](https://drive.google.com/file/d/1O5OfT-3zplGQ-q--gIsKPz64evxhTRba/view?usp=sharing)

**How it works:**

```
Base Image (20GB) ──┬──→ VM1 Overlay (50MB)
                    ├──→ VM2 Overlay (120MB)
                    └──→ VM3 Overlay (80MB)
Total disk usage: ~20.25GB instead of 60GB
```

### 2. ISO Upload & Multi-OS Support

The platform features a **flexible ISO management system** that allows administrators to:

- Upload custom ISO files for any operating system (Ubuntu, Windows, Fedora, etc.)
- Create base images from uploaded ISOs
- Provide guests with multiple OS choices
- Support different OS versions simultaneously
- Enable easy addition of new operating systems without code changes

### 3. Concurrent Multi-VM Execution

Users can **run multiple virtual machines simultaneously** with:

- Independent VNC sessions for each VM
- Separate browser tabs for concurrent access
- No performance degradation with multiple VMs
- Real-time status monitoring for all running instances
- Automatic port allocation for VNC connections

## 👨‍💼 Admin Dashboard

The Admin Dashboard provides comprehensive system management capabilities:

### View & Monitor

- **System Overview**: Summary statistics showing total ISOs, base images, and active VMs
- **ISO Management**: View all uploaded ISO files with details (name, size, upload date)
- **Base Images**: Monitor all created QEMU base images and their storage usage
- **Node Tracking**: Real-time status of all VMs across all users
- **Log Viewer**: Access system logs with filtering capabilities for debugging

### Manage & Control

- **Upload ISOs**: Drag-and-drop interface for adding new operating system images
- **Create Base Images**: Generate QEMU images from uploaded ISOs with size configuration
- **Delete Resources**: Remove ISOs and base images (with dependency checks)
- **User Management**: View which users are running which VMs
- **System Monitoring**: Track resource usage and VM health status

## 👤 Guest Dashboard

The Guest Dashboard offers an intuitive, visual interface for VM management:

### Visual VM Management

- **ISO Sidebar**: Browse available operating systems with PC icons
- **Drag-and-Drop Creation**: Click PC icons to create VMs with custom names
- **Visual VM Cards**: Color-coded cards showing VM status:
  - 🟢 Green border: VM running
  - ⚪ Gray border: VM idle/stopped
  - 🔴 Red border: VM error state

### VM Operations

- **Create VMs**: Click any OS icon, name your VM, and deploy instantly
- **Start VMs**: Launch VMs with one click (or drag-and-drop to start zone)
- **Stop VMs**: Gracefully shut down running instances via context menu (⋮)
- **Wipe VMs**: Delete VMs and reclaim storage space
- **Connect**: Click running VMs to open VNC session in new tab
- **View Logs**: Access VM-specific logs for troubleshooting

### User Experience Features

- **Three-Dot Menu**: Right-click any VM card for quick actions
- **Multi-VM Support**: Open and manage multiple VMs simultaneously
- **Real-time Status**: Live updates on VM operational state
- **Hot Reload**: Changes reflect immediately without page refresh

## 🚀 Installation & Setup

### Prerequisites

- Docker (20.10+) and Docker Compose (v2+)
- Git

### Step-by-Step Setup

#### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/vm-management-system.git
cd vm-management-system
```

#### Step 2: Create Environment File

Create a `.env` file in the root directory:

```env
# PostgreSQL Configuration (Backend Database)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=pass123
POSTGRES_DB=Sandbox

# MySQL Configuration (Guacamole Database)
MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=guacamole_db
MYSQL_USER=guacamole_user
MYSQL_PASSWORD=guacpass

# Guacamole Settings
GUACD_HOSTNAME=guacd
MYSQL_HOSTNAME=mysql
```

#### Step 3: Initialize Guacamole Database (One-Time Setup)

**Important:** This step must be run **only once** before first startup:

```bash
docker run --rm guacamole/guacamole /opt/guacamole/bin/initdb.sh --mysql > initdb.sql
```

**What this does:**

- Pulls the Guacamole image
- Generates SQL schema for Guacamole's authentication database
- Creates `initdb.sql` file with table definitions and initial data
- This file is automatically loaded by MySQL on first startup

#### Step 4: Start All Services

```bash
docker-compose up --build
```

**First-time startup may take 5-10 minutes** as Docker:

- Builds backend and frontend images
- Downloads MySQL, PostgreSQL, Guacamole images
- Initializes databases with schemas
- Runs Prisma migrations
- Starts all services

#### Step 5: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Guacamole**: http://localhost:8080/guacamole (default: admin/admin)

## 🐳 Docker Compose Architecture

Our `docker-compose.yaml` orchestrates **five interconnected services**:

### Service Overview

```yaml
services:
  # 1. MySQL Database (Guacamole Backend)
  mysql:
    - Stores Guacamole authentication data
    - Manages VNC connection configurations
    - Initializes from initdb.sql on first run
    - Health checks ensure availability before Guacamole starts

  # 2. Guacd Daemon (VNC Proxy)
  guacd:
    - Proxies VNC connections from browser to VMs
    - Handles protocol translation (HTTP → VNC)
    - Enables browser-based VM access without plugins

  # 3. Guacamole Web App (VNC Gateway)
  guacamole:
    - Provides web interface for VNC sessions
    - Manages user authentication for VM access
    - Creates dynamic connections to running VMs
    - Depends on both MySQL and Guacd

  # 4. PostgreSQL Database (Application Backend)
  db:
    - Stores application data (users, VMs, ISOs, images)
    - Managed by Prisma ORM
    - Includes health checks for startup coordination

  # 5. Backend API (Node.js/Express)
  backend:
    - REST API for VM management
    - QEMU/KVM integration for VM provisioning
    - Prisma database migrations
```

## 📖 Usage

### Creating Your First VM (Guest)

1. **Login** as guest user
2. **Browse ISOs** in the left sidebar (Ubuntu, Windows, etc.)
3. **Click PC icon** of desired OS
4. **Name your VM** in the prompt
5. **Wait for creation** (~5 seconds for overlay creation)
6. **VM appears** as a card in the main area
7. **Click VM card** to see controls
8. **Click Start** button to launch
9. **Click running VM** to open VNC session in new tab

### Managing Multiple VMs Concurrently

```
# Guests can run multiple VMs simultaneously:
VM1 (Ubuntu)  → VNC Tab 1 (localhost:8080/guacamole/#/client/uuid1)
VM2 (Windows) → VNC Tab 2 (localhost:8080/guacamole/#/client/uuid2)
VM3 (Fedora)  → VNC Tab 3 (localhost:8080/guacamole/#/client/uuid3)

# All running in parallel with independent sessions
```

### Adding New Operating Systems (Admin)

1. **Login** as admin
2. **Navigate** to ISOs tab
3. **Upload ISO** file (drag-and-drop or file picker)
4. **Wait** for upload completion
5. **Create base image** from ISO
6. **ISO available** to all guest users immediately

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM
- **Frontend**: React, Vite
- **Databases**: PostgreSQL (app), MySQL (Guacamole)
- **Virtualization**: QEMU/KVM with QCOW2 overlays
- **Remote Access**: Apache Guacamole (VNC over HTTP)
- **Containerization**: Docker

## 🔮 Future Improvements

- Link Users to the Nodes table to improve analytics
- Wipe off nodes created by user, when they logout / close tab / session expires

---


**Contributors**: Welcome! Please submit pull requests or open issues for bugs and feature requests.
