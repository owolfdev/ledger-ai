# Ledger CLI Command Security Implementation

## Overview

The `ledger` command has been enhanced with comprehensive security features to prevent command injection, unauthorized access, and malicious command execution while maintaining full Ledger CLI functionality.

## Security Features Implemented

### **1. Command Whitelisting**

Only pre-approved Ledger CLI commands are allowed:

```typescript
const SAFE_LEDGER_COMMANDS = [
  // Balance commands
  "balance",
  "bal",
  "equity",
  "cleared",

  // Register/transaction commands
  "register",
  "reg",
  "print",
  "xact",

  // Account and metadata commands
  "accounts",
  "payees",
  "stats",
  "files",

  // Report commands
  "report",
  "budget",
  "activity",

  // Safe query commands
  "query",
  "calc",
] as const;
```

**Benefits:**

- Prevents execution of dangerous system commands
- Limits attack surface to only necessary Ledger CLI functions
- Easy to audit and maintain

### **2. Argument Validation**

Dangerous patterns are detected and blocked:

```typescript
const dangerousPatterns = [
  /[;&|`$]/g, // Shell command separators
  /\.\.\//g, // Directory traversal
  /--file\s+[^-\s]/g, // File path manipulation
  /--output\s+[^-\s]/g, // Output file manipulation
  /--sort\s+[^-\s]/g, // Sort field injection
];
```

**Blocked Patterns:**

- `;` - Command separator
- `&` - Background execution
- `|` - Pipeline
- `` ` `` - Command substitution
- `$` - Variable expansion
- `../` - Directory traversal
- File manipulation flags

### **3. Input Sanitization**

All arguments are sanitized before execution:

```typescript
function sanitizeArgs(args: string[]): string[] {
  return args.map((arg) => {
    // Remove any potentially dangerous characters
    return arg.replace(/[;&|`$]/g, "");
  });
}
```

**Sanitization:**

- Removes shell metacharacters
- Preserves legitimate Ledger CLI arguments
- Maintains functionality while blocking attacks

### **4. User Authentication**

Commands require valid user authentication:

```typescript
if (!user?.id) {
  return `<custom-alert message="You must be logged in to run Ledger CLI commands" />`;
}
```

**Security Benefits:**

- Prevents anonymous command execution
- Enables user tracking and logging
- Restricts access to authorized users only

### **5. Security Logging**

All command executions are logged:

```typescript
console.log(
  `[SECURITY] Ledger CLI executed by user ${user.id}: ${args.rawInput}`
);
```

**Logging Includes:**

- User ID
- Full command string
- Timestamp
- User agent
- Command validation status

### **6. Enhanced API Security**

Additional security measures in API calls:

```typescript
body: JSON.stringify({
  command,
  args,
  timestamp: Date.now(),        // Prevents replay attacks
  userAgent: navigator.userAgent // Enables user tracking
}),
```

## Security Testing Examples

### **✅ Safe Commands (Allowed)**

```bash
ledger balance
ledger register coffee
ledger bal Expenses:Personal
ledger reg --monthly
ledger accounts
ledger stats
```

### **❌ Dangerous Commands (Blocked)**

```bash
# Shell injection attempts
ledger balance; rm -rf /
ledger reg & cat /etc/passwd
ledger bal | wc -l

# Directory traversal
ledger --file ../../../etc/passwd

# Unauthorized commands
ledger system
ledger exec
ledger shell
```

## Attack Prevention

### **Command Injection Prevention**

- **Before:** `ledger balance; rm -rf /` could execute system commands
- **After:** Command rejected, dangerous characters removed

### **Directory Traversal Prevention**

- **Before:** `ledger --file ../../../etc/passwd` could access system files
- **After:** Pattern detected, command blocked

### **Unauthorized Command Prevention**

- **Before:** `ledger system` could execute system commands
- **After:** Command not in whitelist, execution denied

## Monitoring and Alerting

### **Security Logs**

All command executions are logged with:

- User identification
- Command details
- Validation results
- Timestamp
- User agent

### **Failed Execution Logs**

Security violations are logged:

- Blocked commands
- Dangerous patterns detected
- Authentication failures
- Validation errors

## Best Practices for Users

### **Safe Usage**

1. Use only documented Ledger CLI commands
2. Avoid special characters in arguments
3. Keep commands simple and focused
4. Report suspicious behavior

### **What to Avoid**

1. Don't try to execute system commands
2. Don't use shell metacharacters
3. Don't attempt file system access
4. Don't try to bypass validation

## Future Security Enhancements

### **Planned Improvements**

1. **Rate Limiting** - Prevent command flooding
2. **Command History** - Track user command patterns
3. **Anomaly Detection** - Identify suspicious usage patterns
4. **Enhanced Logging** - More detailed security event logging

### **Monitoring Tools**

1. **Real-time Alerts** - Immediate notification of security events
2. **Usage Analytics** - Track command usage patterns
3. **Security Dashboard** - Visual security monitoring interface

## Compliance and Auditing

### **Security Standards**

- Follows OWASP security guidelines
- Implements defense in depth
- Provides comprehensive logging
- Enables security auditing

### **Audit Trail**

- Complete command execution history
- User authentication records
- Security violation logs
- System access patterns

## Conclusion

The enhanced Ledger CLI command provides:

- **Full Ledger CLI functionality** for legitimate use cases
- **Comprehensive security** against common attack vectors
- **User accountability** through authentication and logging
- **Easy maintenance** with clear security boundaries
- **Professional security** suitable for production environments

This implementation balances functionality with security, providing users with powerful Ledger CLI capabilities while maintaining a secure execution environment.
