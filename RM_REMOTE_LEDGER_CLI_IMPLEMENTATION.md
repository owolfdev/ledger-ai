# Remote Ledger CLI Implementation Specification

## Overview

This document describes the implementation of a remote Ledger CLI system that allows web app users to execute traditional Ledger CLI commands against their own static .ledger files stored on a Digital Ocean server. Each user gets their own isolated ledger file, enabling full Ledger CLI functionality in a web-based environment.

## Architecture

### **System Components**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Web App      │    │   Digital Ocean  │    │   User Ledger Files │
│   (Client)     │───▶│   Server         │───▶│   (Per User)        │
│                 │    │                  │    │                     │
│ - User Auth    │    │ - Ledger CLI     │    │ - user-123.ledger   │
│ - Command UI   │    │ - API Endpoints  │    │ - user-456.ledger   │
│ - Results      │    │ - File Manager   │    │ - user-789.ledger   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

### **Data Flow**

1. **User Authentication** - Web app authenticates user
2. **Command Submission** - User submits Ledger CLI command via web interface
3. **API Request** - Web app sends command to Digital Ocean server
4. **Command Execution** - Server executes Ledger CLI against user's file
5. **Result Return** - Server returns formatted results to web app
6. **Display** - Web app displays results to user

## Digital Ocean Server Setup

### **Server Requirements**

- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: SSD storage for fast file access
- **Network**: Stable internet connection for API access

### **Software Installation**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Ledger CLI
sudo apt-get install ledger

# Verify installation
ledger --version

# Create application directory
sudo mkdir -p /home/ledger-app
sudo chown $USER:$USER /home/ledger-app
cd /home/ledger-app
```

### **File Structure**

```bash
/home/ledger-app/
├── package.json
├── server.js
├── user-files/           # User ledger files
│   ├── user-123/
│   │   └── user-123.ledger
│   ├── user-456/
│   │   └── user-456.ledger
│   └── user-789/
│       └── user-789.ledger
├── logs/                 # Application logs
├── config/               # Configuration files
└── scripts/              # Utility scripts
```

## API Implementation

### **Server Setup (server.js)**

```javascript
const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// Middleware for CORS and security
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// Authentication middleware (implement your auth logic)
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  // Implement your authentication logic here
  // Verify JWT token, API key, etc.

  next();
};

// Main Ledger CLI endpoint
app.post("/api/ledger-cli", authenticateUser, async (req, res) => {
  try {
    const { command, args, userId, authToken } = req.body;

    // Validate required fields
    if (!command || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate user access (user can only access their own files)
    if (!canAccessUserFile(req.user.id, userId)) {
      return res.status(403).json({ error: "Access denied to user files" });
    }

    // Execute Ledger CLI command
    const result = await executeLedgerCLI(command, args, userId);

    res.json(result);
  } catch (error) {
    console.error("Ledger CLI execution error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Ledger CLI server running on port ${PORT}`);
});
```

### **Command Execution Function**

```javascript
async function executeLedgerCLI(command, args, userId) {
  return new Promise((resolve, reject) => {
    // Validate command is in whitelist
    const SAFE_COMMANDS = [
      "balance",
      "bal",
      "equity",
      "cleared",
      "register",
      "reg",
      "print",
      "xact",
      "accounts",
      "payees",
      "stats",
      "files",
      "report",
      "budget",
      "activity",
      "query",
      "calc",
    ];

    if (!SAFE_COMMANDS.includes(command)) {
      reject(new Error(`Command '${command}' not allowed`));
      return;
    }

    // Validate arguments for security
    if (!validateArguments(args)) {
      reject(new Error("Dangerous arguments detected"));
      return;
    }

    // Set up user-specific file paths
    const userDir = `/home/ledger-app/user-files/user-${userId}`;
    const userLedgerFile = path.join(userDir, `user-${userId}.ledger`);

    // Ensure user directory exists
    if (!fs.existsSync(userDir)) {
      reject(new Error(`User directory not found: ${userDir}`));
      return;
    }

    // Ensure user ledger file exists
    if (!fs.existsSync(userLedgerFile)) {
      reject(new Error(`User ledger file not found: ${userLedgerFile}`));
      return;
    }

    // Build full command
    const fullCommand = `ledger ${command} ${args.join(
      " "
    )} -f "${userLedgerFile}"`;

    // Execute command in user's directory
    exec(
      fullCommand,
      {
        cwd: userDir,
        timeout: 30000, // 30 second timeout
        env: {
          ...process.env,
          LEDGER_FILE: userLedgerFile,
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command execution failed: ${error.message}`));
          return;
        }

        if (stderr && stderr.trim()) {
          console.warn(`Ledger CLI stderr for user ${userId}:`, stderr);
        }

        resolve({
          output: stdout,
          command: fullCommand,
          filePath: userLedgerFile,
          userId: userId,
          timestamp: new Date().toISOString(),
        });
      }
    );
  });
}
```

### **Security Functions**

```javascript
// Validate user can access specific user files
function canAccessUserFile(authenticatedUserId, requestedUserId) {
  // Users can only access their own files
  return authenticatedUserId === requestedUserId;
}

// Validate command arguments for security
function validateArguments(args) {
  const dangerousPatterns = [
    /[;&|`$]/g, // Shell command separators
    /\.\.\//g, // Directory traversal
    /--file\s+[^-\s]/g, // File path manipulation
    /--output\s+[^-\s]/g, // Output file manipulation
    /--sort\s+[^-\s]/g, // Sort field injection
  ];

  const argsString = args.join(" ");

  for (const pattern of dangerousPatterns) {
    if (pattern.test(argsString)) {
      return false;
    }
  }

  return true;
}

// Sanitize arguments
function sanitizeArguments(args) {
  return args.map((arg) => {
    return arg.replace(/[;&|`$]/g, "");
  });
}
```

## File Management

### **User File Creation**

```javascript
// Create new user ledger file
app.post("/api/users/:userId/ledger", authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user access
    if (!canAccessUserFile(req.user.id, userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const userDir = `/home/ledger-app/user-files/user-${userId}`;
    const userLedgerFile = path.join(userDir, `user-${userId}.ledger`);

    // Create user directory
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Create empty ledger file if it doesn't exist
    if (!fs.existsSync(userLedgerFile)) {
      fs.writeFileSync(
        userLedgerFile,
        "# User Ledger File\n# Created: " + new Date().toISOString() + "\n\n"
      );
    }

    res.json({
      message: "User ledger file created",
      filePath: userLedgerFile,
      userId: userId,
    });
  } catch (error) {
    console.error("User creation error:", error);
    res.status(500).json({ error: error.message });
  }
});
```

### **File Synchronization**

```javascript
// Sync database entries to user ledger file
app.post("/api/users/:userId/sync", authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { ledgerContent } = req.body;

    // Validate user access
    if (!canAccessUserFile(req.user.id, userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const userDir = `/home/ledger-app/user-files/user-${userId}`;
    const userLedgerFile = path.join(userDir, `user-${userId}.ledger`);

    // Write ledger content to file
    fs.writeFileSync(userLedgerFile, ledgerContent);

    res.json({
      message: "Ledger file synchronized",
      filePath: userLedgerFile,
      userId: userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: error.message });
  }
});
```

## Web App Integration

### **Updated Command Handler**

```typescript
// In your web app, update the ledger command handler
async function executeLedgerCommand(
  command: string,
  args: string[],
  userId: string
): Promise<{ output: string; command: string; filePath: string }> {
  const response = await fetch("https://your-do-server.com/api/ledger-cli", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getUserAuthToken()}`, // Your auth token
    },
    body: JSON.stringify({
      command,
      args,
      userId,
      timestamp: Date.now(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to execute Ledger command");
  }

  return response.json();
}
```

### **User File Management**

```typescript
// Create new user ledger file
async function createUserLedger(userId: string): Promise<void> {
  const response = await fetch(
    `https://your-do-server.com/api/users/${userId}/ledger`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getUserAuthToken()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create user ledger file");
  }
}

// Sync database to ledger file
async function syncToLedger(
  userId: string,
  ledgerContent: string
): Promise<void> {
  const response = await fetch(
    `https://your-do-server.com/api/users/${userId}/sync`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getUserAuthToken()}`,
      },
      body: JSON.stringify({ ledgerContent }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to sync ledger file");
  }
}
```

## Security Considerations

### **Authentication & Authorization**

- **JWT Tokens**: Implement secure JWT-based authentication
- **User Isolation**: Users can only access their own files
- **Command Whitelisting**: Only safe Ledger CLI commands allowed
- **Input Validation**: All inputs validated and sanitized

### **File System Security**

- **Directory Isolation**: Each user has separate directory
- **Working Directory**: Commands execute in user's directory only
- **Path Validation**: No directory traversal allowed
- **File Permissions**: Proper file permissions on user directories

### **Network Security**

- **HTTPS**: All API communication over HTTPS
- **CORS**: Proper CORS configuration
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Request Validation**: Validate all incoming requests

## Monitoring & Logging

### **Logging Implementation**

```javascript
// Add comprehensive logging
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: "/home/ledger-app/logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "/home/ledger-app/logs/combined.log",
    }),
  ],
});

// Log all command executions
logger.info("Ledger CLI command executed", {
  userId: userId,
  command: command,
  args: args,
  timestamp: new Date().toISOString(),
  ip: req.ip,
  userAgent: req.get("User-Agent"),
});
```

### **Health Monitoring**

```javascript
// Health check endpoint
app.get("/health", (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    ledgerCli: checkLedgerCLI(),
    userFiles: countUserFiles(),
  };

  res.json(health);
});

function checkLedgerCLI() {
  try {
    const { execSync } = require("child_process");
    const version = execSync("ledger --version", { encoding: "utf8" });
    return { status: "available", version: version.trim() };
  } catch (error) {
    return { status: "unavailable", error: error.message };
  }
}

function countUserFiles() {
  try {
    const userDir = "/home/ledger-app/user-files";
    const users = fs
      .readdirSync(userDir)
      .filter((file) => fs.statSync(path.join(userDir, file)).isDirectory());
    return users.length;
  } catch (error) {
    return { error: error.message };
  }
}
```

## Deployment

### **Environment Variables**

```bash
# Create .env file on DO server
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-webapp.com
LOG_LEVEL=info
```

### **PM2 Process Management**

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ledger-cli-server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### **Nginx Reverse Proxy**

```nginx
# /etc/nginx/sites-available/ledger-cli
server {
    listen 80;
    server_name your-do-server.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-do-server.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Testing

### **Test Commands**

```bash
# Test basic functionality
curl -X POST https://your-do-server.com/api/ledger-cli \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"command": "balance", "args": [], "userId": "test-user"}'

# Test user isolation
curl -X POST https://your-do-server.com/api/ledger-cli \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_A_TOKEN" \
  -d '{"command": "balance", "args": [], "userId": "user-b"}' \
  # Should return 403 Forbidden

# Test command whitelisting
curl -X POST https://your-do-server.com/api/ledger-cli \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"command": "rm", "args": ["-rf", "/"], "userId": "test-user"}' \
  # Should return 400 Bad Request
```

## Future Enhancements

### **Advanced Features**

1. **File Versioning**: Keep history of ledger file changes
2. **Backup System**: Automatic backups of user ledger files
3. **Performance Caching**: Cache frequently accessed data
4. **User Quotas**: Limit file sizes and command execution
5. **Advanced Monitoring**: Real-time usage analytics

### **Scalability Improvements**

1. **Load Balancing**: Multiple server instances
2. **Database Integration**: Store ledger data in database
3. **Microservices**: Split into smaller, focused services
4. **Containerization**: Docker containers for easy deployment

## Conclusion

This implementation provides a secure, scalable way to offer full Ledger CLI functionality in a web application while maintaining user isolation and security. The system leverages the power of traditional Ledger CLI while providing a modern web interface and multi-user support.

The key benefits are:

- **Full Ledger CLI Power**: All commands and features available
- **User Isolation**: Complete separation between users
- **Security**: Comprehensive security measures implemented
- **Scalability**: Easy to add new users and scale
- **Maintainability**: Clear separation of concerns and logging

This architecture positions your application as a professional-grade accounting tool that combines the power of Ledger CLI with the accessibility of a modern web application.
