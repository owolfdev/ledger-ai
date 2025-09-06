# 📟 Ledger AI — Smart Terminal Accounting System

**Current Implementation — Updated September 2025**

---

## **1. Overview**

Ledger AI is a **web-based terminal interface** for creating and managing financial ledger entries. It combines a modern React terminal with Supabase backend storage and optional Ledger CLI integration for development workflows.

**Current Status**: Single-user application with basic ledger entry management, AI-assisted natural language processing, and Ledger CLI compatibility.

## **2. Current Features**

### **✅ Implemented Features**

- **Smart Terminal Interface**

  - Modern React-based terminal with command history
  - Auto-completion and command suggestions
  - Keyboard shortcuts and navigation
  - Responsive design with dark/light themes

- **Ledger Entry Management**

  - Create entries via `new` command with natural language
  - View and edit individual entries with full details
  - Image upload for receipt storage
  - Real-time validation ensuring double-entry balance

- **AI-Assisted Processing**

  - Natural language command parsing
  - AI fallback for complex queries
  - Automatic account mapping and categorization
  - Receipt OCR and analysis

- **Database Integration**

  - Supabase backend with PostgreSQL
  - User authentication and session management
  - Business separation with `business_id` field
  - Automatic ledger file synchronization

- **Ledger CLI Compatibility**

  - Direct Ledger CLI command execution
  - Standard .ledger file format support
  - Remote file synchronization
  - Professional accounting tool compatibility

- **Modern UI/UX**
  - shadcn/ui component library
  - Tailwind CSS styling
  - Progressive Web App capabilities
  - Mobile-responsive design

## **3. Current Command System**

### **Available Commands**

```bash
# Entry Management
new <description> <amount> <vendor>     # Create new ledger entry
entries [options]                       # List ledger entries
edit-entry <id> [options]              # Edit specific entry

# Ledger CLI Integration
ledger <command> [args...]              # Execute Ledger CLI commands
ledger balance                          # Show account balances
ledger register                         # Show transaction register
ledger accounts                         # List all accounts

# Navigation & Utility
go <page>                               # Navigate to page
back                                    # Go back in history
clear                                   # Clear terminal
help                                    # Show help information
```

### **Natural Language Examples**

```bash
# These work with the current AI system
new coffee $5 Starbucks                 # Creates expense entry
new laptop $2000 credit card           # Creates asset entry
new salary $5000 bank                  # Creates income entry
```

## **4. Current Architecture**

### **Technology Stack**

**Frontend**

- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui for components
- React hooks for state management

**Backend**

- Supabase for database and authentication
- Server Actions for data mutations
- PostgreSQL for data storage
- Row-level security for data protection

**AI Integration**

- OpenAI GPT-4 for natural language processing
- Custom command parsing algorithms
- Receipt OCR and analysis
- Account mapping and categorization

**Development Tools**

- Ledger CLI for accounting operations
- File synchronization for .ledger compatibility
- Hot reloading and development server
- TypeScript compilation and linting

### **Database Schema**

```sql
-- Current single-tenant schema
CREATE TABLE ledger_entries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  business_id INTEGER REFERENCES businesses(id),
  entry_date DATE,
  description TEXT,
  entry_text TEXT,
  entry_raw JSONB,
  amount DECIMAL,
  currency TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ledger_postings (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER REFERENCES ledger_entries(id),
  account TEXT,
  amount DECIMAL,
  currency TEXT,
  sort_order INTEGER
);

CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## **5. Getting Started**

### **Prerequisites**

- Node.js 18+ and npm/pnpm
- Supabase account and project
- OpenAI API key (for AI features)

### **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd ledger-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and OpenAI credentials

# Run development server
npm run dev
```

### **Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Optional: Local Ledger CLI
LEDGER_FILE_PATH=/path/to/your/ledger/file
```

## **6. Usage Guide**

### **Creating Entries**

1. **Natural Language**: Type `new coffee $5 Starbucks` in the terminal
2. **Structured Format**: Use `new` command with specific parameters
3. **AI Assistance**: Let the AI parse complex descriptions automatically

### **Managing Entries**

1. **View Entries**: Use `entries` command to list all entries
2. **Edit Entries**: Use `edit-entry <id>` to modify specific entries
3. **Ledger CLI**: Use `ledger` commands for advanced operations

### **Account Management**

- Accounts are automatically created based on transaction patterns
- Use `ledger accounts` to see all available accounts
- Account hierarchy follows standard accounting practices

## **7. Development**

### **Project Structure**

```
src/
├── app/                    # Next.js app router pages
│   ├── actions/           # Server actions for data operations
│   ├── auth/              # Authentication pages
│   └── ledger/            # Ledger-specific pages
├── commands/              # Terminal command system
│   └── smart/            # Command handlers and registry
├── components/            # React components
│   ├── terminal/         # Terminal interface components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   └── ledger/           # Ledger-specific utilities
└── types/                # TypeScript type definitions
```

### **Key Components**

- **Terminal**: Main interface component (`src/components/terminal/`)
- **Command System**: Command parsing and execution (`src/commands/smart/`)
- **Ledger Actions**: Database operations (`src/app/actions/ledger/`)
- **AI Integration**: Natural language processing (`src/lib/ledger/`)

### **Adding New Commands**

1. Create command handler in `src/commands/smart/`
2. Register command in `src/commands/smart/registry.ts`
3. Add help documentation and usage examples
4. Test with various input formats

## **8. Current Limitations**

### **Known Issues**

- **Single-User**: No multi-tenant support (planned for future)
- **Basic AI**: Limited natural language processing compared to goals
- **No Subscriptions**: No payment or subscription management
- **Limited Reporting**: Basic entry listing, no advanced reports
- **No API**: No REST API for external integrations

### **Planned Improvements**

- Type-specific commands (`ex`, `in`, `as`, `li`, `tr`)
- Multi-tenant architecture with proper isolation
- Enhanced AI processing with intent detection
- Advanced reporting and analytics
- REST API for integrations
- Mobile app optimization

## **9. Contributing**

### **Development Setup**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Code Style**

- Use TypeScript for all new code
- Follow existing component patterns
- Add proper error handling
- Include JSDoc comments for complex functions

### **Testing**

- Test commands with various input formats
- Verify database operations work correctly
- Check AI integration with different languages
- Ensure Ledger CLI compatibility

## **10. Roadmap**

For detailed development goals and future plans, see [DEVELOPMENT_GOALS.md](./DEVELOPMENT_GOALS.md).

### **Immediate Priorities**

1. **Enhanced Command System**: Implement type-specific commands
2. **Better AI Processing**: Improve natural language understanding
3. **Account Learning**: Smart account mapping and suggestions
4. **Multi-User Support**: Basic multi-tenant architecture

### **Long-term Vision**

- Production-ready multi-tenant SaaS
- Advanced AI-powered features
- Comprehensive reporting and analytics
- Mobile applications and API access

## **11. License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## **12. Support**

- **Documentation**: Check this README and [DEVELOPMENT_GOALS.md](./DEVELOPMENT_GOALS.md)
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions for questions and ideas

---

_This README reflects the current state of the application. For future development goals and vision, see [DEVELOPMENT_GOALS.md](./DEVELOPMENT_GOALS.md)._

test
