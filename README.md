# 📟 Ledger AI — Smart Terminal Accounting System

possible rename: TerminalEx

**Production-Ready Multi-Tenant SaaS — Updated January 2025**

---

## **1. Overview**

Ledger AI is a **smart terminal-based double-entry accounting system** that combines the power of Ledger CLI with modern web technology. It allows users to quickly record financial transactions through natural language commands with AI assistance for categorization and account mapping. The system learns from user patterns to automatically suggest correct accounts, supports multiple businesses and currencies, and syncs data to standard .ledger files for compatibility with professional accounting tools.

**Target Market**: Developers, freelancers, and small business owners who want the precision of double-entry accounting with the speed and convenience of a modern terminal interface.

### **🎯 Production Roadmap (2025)**

**Phase 1: Enhanced Command System (Weeks 1-4)**

- ✅ **Type-specific commands** - `ex` (expense), `in` (income), `as` (asset), `li` (liability), `tr` (transfer)
- ✅ **Account normalization** - Smart learning system for consistent account mapping
- ✅ **Enhanced AI integration** - Two-tier natural language processing
- ✅ **Ledger CLI compatibility** - Remote server hosting with full CLI functionality

**Phase 2: Multi-Tenant Architecture (Weeks 5-8)**

- 🔄 **Tenant isolation** - Secure multi-user database architecture
- 🔄 **Subscription management** - Stripe integration with tiered pricing
- 🔄 **User management** - Role-based access control and permissions
- 🔄 **Data portability** - Standard .ledger file export and import

**Phase 3: Production Infrastructure (Weeks 9-12)**

- 🔄 **Cloud deployment** - Kubernetes, auto-scaling, monitoring
- 🔄 **Performance optimization** - Redis caching, query optimization
- 🔄 **Security hardening** - Audit logging, rate limiting, compliance
- 🔄 **Testing suite** - Comprehensive unit, integration, and E2E tests

**Phase 4: Business Features & Launch (Weeks 13-16)**

- 🔄 **Marketing website** - Landing page, pricing, SEO (http://myapp.com)
- 🔄 **Payment integration** - Stripe subscriptions, billing management
- 🔄 **Advanced reporting** - P&L, balance sheets, custom reports
- 🔄 **API access** - RESTful API for integrations
- 🔄 **Mobile optimization** - Progressive Web App features
- 🔄 **Launch preparation** - Documentation, testing, user onboarding

**Examples of new command system:**

```bash
# Type-specific commands for clarity
ex -i coffee 100 -v Starbucks          # Expense
in -i consultancy 5000 -c "Acme Corp"  # Income
as -i laptop 2000 -p credit-card       # Asset
li -i credit-card 500 -p bank          # Liability
tr -f checking -t savings 1000         # Transfer
```

---

## **2. Core Features**

- **Two-Tier Natural Language System**

  - **Tier 1: Intent Detection** - AI processes natural language and generates structured commands
  - **Tier 2: Command Processing** - Structured commands create proper database entries
  - **Seamless Integration** - Commands auto-populate in terminal for user review
  - **Learning System** - AI learns user patterns for better account suggestions

- **Type-Specific Command System**

  - **`ex`** - Expenses (money going out): `ex -i coffee 100 -v Starbucks`
  - **`in`** - Income (money coming in): `in -i consultancy 5000 -c "Acme Corp"`
  - **`as`** - Assets (purchasing valuable items): `as -i laptop 2000 -p credit-card`
  - **`li`** - Liabilities (paying off debt): `li -i credit-card 500 -p bank`
  - **`tr`** - Transfers (moving money between accounts): `tr -f checking -t savings 1000`

- **Smart Account Learning**

  - **Account Normalization** - Consistent account mapping regardless of input variations
  - **User Pattern Learning** - System learns from corrections and preferences
  - **Context-Aware Suggestions** - Business-specific account recommendations
  - **Effortless User Experience** - Minimal confirmation prompts after learning

- **Entry Management System**

  - **Individual entry pages** with full details and editing capabilities
  - **In-place editing** with basic and advanced modes:
    - Basic: Description, date, memo, cleared status, receipt images
    - Advanced: Individual posting modification with balance validation
  - **Image upload & management** for receipt storage
  - **Real-time validation** ensuring double-entry balance

- **AI Fallback System**

  - **Two-tier AI processing**: Natural language processing (IntentDetector + CommandGenerator) for structured inputs, and general AI fallback for complex queries
  - **Intent detection**: Recognizes noun phrases with amounts (`coffee starbucks 100`), expense patterns, and command keywords
  - **Command generation**: AI generates canonical Ledger CLI entries using new flag-based syntax
  - **Command population**: Generated commands automatically appear in terminal input field for easy execution
  - **Brief feedback**: Clean one-line responses like `✓ Generated: \`new -i coffee 100 --vendor Starbucks\``

- **Multi-Tenant Database Architecture**

  - **Tenant Isolation** - Secure data separation with proper access controls
  - **Scalable Schema** - Optimized for multi-user, multi-business scenarios
  - **Account Management** - Dynamic account discovery from transaction data
  - **Data Portability** - Standard .ledger file export for professional compatibility

- **Remote Ledger CLI Integration**

  - **Cloud-Hosted CLI** - Ledger CLI commands available through web interface
  - **Standard Format** - Data stored in industry-standard .ledger format
  - **Professional Compatibility** - Works with any Ledger CLI-compatible software
  - **No Vendor Lock-in** - Export data anytime in standard format

- **Production-Ready Infrastructure**

  - **Progressive Web App** - Works offline, installable on any device
  - **Cloud Deployment** - Kubernetes, auto-scaling, monitoring
  - **Performance Optimization** - Redis caching, query optimization
  - **Security Hardening** - Audit logging, rate limiting, compliance

---

## **3. Natural Language Processing**

The system provides a seamless two-tier natural language processing pipeline:

### **Tier 1: Intent Detection & Command Generation**

```
User: "I just bought a coffee from Starbucks for $5"
    ↓
AI processes natural language
    ↓
System: ✓ Generated: ex -i coffee 5 -v Starbucks
    ↓
Command is injected into terminal input
```

### **Tier 2: Command Processing & Database Entry**

```
Terminal: ex -i coffee 5 -v Starbucks
    ↓
Command parser processes structured input
    ↓
System creates database entry:
- date: 2025-01-15
- memo: "Coffee at Starbucks"
- postings: [
    { account: "Expenses:Personal:Food:Coffee", amount: 5.00 },
    { account: "Assets:Bank:Kasikorn:Personal", amount: -5.00 }
  ]
    ↓
Syncs to remote .ledger file
```

### **Smart Account Learning Flow**

```
First time: "ex -i coffee 5 -v bkk bank"
    ↓
System: "I don't know 'bkk bank' yet"
    ↓
System: "I created account 'Assets:Bank:BangkokBank:Personal' for 'bkk bank'"
    ↓
User: "y" (accepts)
    ↓
System: "✓ Learned! 'bkk bank' → Assets:Bank:BangkokBank:Personal"

Next time: "ex -i coffee 5 -v bangkok bank"
    ↓
System: "I think you mean 'Assets:Bank:BangkokBank:Personal' (used for 'bkk bank')"
    ↓
User: "y" (accepts)
    ↓
System: "✓ Learned! 'bangkok bank' → Assets:Bank:BangkokBank:Personal"

Future: "ex -i coffee 5 -v bkk bank" or "ex -i coffee 5 -v bangkok bank"
    ↓
No confirmation needed - system knows the mapping
```

**Key Architecture Benefit:** All input methods converge on the same validation, categorization, and storage logic, ensuring consistency and enabling the learning system to work across all entry types.

---

## **4. Multi-Tenant Architecture**

The system is designed for production-scale multi-tenant SaaS deployment:

### **Database Schema**

```sql
-- Core multi-tenant tables
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  subscription_tier TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ledger_entries (
  id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  entry_date DATE,
  description TEXT,
  entry_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ledger_postings (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER REFERENCES ledger_entries(id),
  account TEXT,     -- This IS your account data
  amount DECIMAL,
  currency TEXT,
  sort_order INTEGER
);

-- Account learning system
CREATE TABLE account_mappings (
  id SERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_input TEXT,
  account_name TEXT,
  confidence_score DECIMAL,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Tenant Isolation**

- **Row-Level Security** - All queries automatically filtered by tenant_id
- **Secure API** - JWT tokens include tenant context
- **Data Portability** - Each tenant can export their complete .ledger file
- **Scalable Architecture** - Supports thousands of concurrent users

---

## **5. Production Deployment Architecture**

### **Cloud Infrastructure**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Marketing     │    │   Web App        │    │   Database      │
│   (http://myapp.com) │◄──►│   (http://app.myapp.com) │◄──►│   (Supabase)    │
│   (Vercel)      │    │   (Next.js PWA)  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CDN           │    │   Ledger CLI     │    │   Redis Cache   │
│   (Vercel)      │    │   (DO Droplet)   │    │   (Upstash)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Stripe        │    │   API Gateway    │    │   Monitoring    │
│   (Payments)    │    │   (Kubernetes)   │    │   (Logging)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Subscription Tiers**

**Starter ($9/month)**

- Up to 100 transactions/month
- Basic reporting
- Standard .ledger export
- Email support

**Professional ($29/month)**

- Unlimited transactions
- Advanced reporting (P&L, Balance Sheet)
- API access
- Priority support
- Multi-business support

**Enterprise ($99/month)**

- White-label deployment
- Custom integrations
- Dedicated support
- Advanced security features
- Custom reporting

### **Data Flow Example**

```
User: "I bought a laptop for $2000 with my credit card"
    ↓
AI: ✓ Generated: as -i laptop 2000 -p credit-card
    ↓
Command Parser: Validates and processes
    ↓
Database: Creates entry with tenant isolation
    ↓
Ledger CLI: Syncs to remote .ledger file
    ↓
User: Can run "ledger balance" through web interface
```

### **Two-Product Architecture**

**Marketing Site (http://myapp.com)**

- Landing page with value propositions
- Pricing and subscription management
- Documentation and blog
- SEO-optimized content
- Static site (Vercel/Netlify)

**Application (http://app.myapp.com)**

- Progressive Web App (PWA)
- Terminal interface and command system
- Multi-tenant database access
- Real-time AI processing
- Dynamic Next.js application

---

## **6. Production Implementation Plan**

### **Phase 1: Enhanced Command System (Weeks 1-4)**

**Week 1-2: Type-Specific Commands**

- Implement `ex`, `in`, `as`, `li`, `tr` command handlers
- Create enhanced command parser with transaction type detection
- Build account normalization system
- Add smart account learning database schema

**Week 3-4: AI Integration Enhancement**

- Implement two-tier natural language processing
- Create intent detection system
- Build command generation pipeline
- Add user pattern learning algorithms

### **Phase 2: Multi-Tenant Architecture (Weeks 5-8)**

**Week 5-6: Database Migration**

- Implement tenant isolation with Row-Level Security
- Create user management system
- Build subscription management with Stripe
- Add account mapping learning tables

**Week 7-8: Security & Access Control**

- Implement JWT-based authentication
- Add role-based permissions
- Create secure API endpoints
- Build data export functionality

### **Phase 3: Production Infrastructure (Weeks 9-12)**

**Week 9-10: Cloud Deployment**

- Set up Kubernetes cluster
- Implement auto-scaling
- Add monitoring and logging
- Create CI/CD pipeline

**Week 11-12: Performance & Security**

- Implement Redis caching
- Add rate limiting
- Create audit logging
- Build comprehensive test suite

### **Phase 4: Business Features & Launch (Weeks 13-16)**

**Week 13-14: Marketing Site & Payment Integration**

- Build marketing website (http://myapp.com)
- Implement Stripe subscription management
- Create pricing and billing pages
- Add payment failure handling
- Build landing page with value propositions
- Implement SEO optimization

**Week 15-16: Advanced Features & Launch Preparation**

- Build P&L and Balance Sheet reports
- Create RESTful API and webhook system
- Implement mobile optimization
- Launch preparation and testing
- Documentation and user onboarding

---

## **7. Marketing & Positioning**

### **Target Market**

**Primary: Developers & Tech Professionals**

- Love terminal interfaces and CLI tools
- Need proper accounting for freelance work
- Value data portability and open standards
- Appreciate automation and AI assistance

**Secondary: Small Business Owners**

- Frustrated with complex accounting software
- Want professional-grade double-entry books
- Need multi-business support
- Value the .ledger file standard

**Tertiary: Accounting Professionals**

- Want modern tools for clients
- Appreciate Ledger CLI compatibility
- Need efficient data entry methods
- Value audit trails and data integrity

### **Value Propositions**

**"The Developer's Accounting System"**

- Terminal-first interface for developers
- Natural language processing for speed
- Standard .ledger file format for portability
- AI-powered categorization and learning

**"Natural Language Meets Professional Accounting"**

- Type "I bought coffee for $5" → proper double-entry books
- AI learns your patterns for consistent accounts
- Export to any Ledger CLI-compatible software
- No vendor lock-in, your data is always portable

**"Accounting That Doesn't Suck"**

- Modern web interface with terminal power
- AI assistance for categorization
- Multi-business support
- Professional reporting and compliance

---

## **8. Technical Architecture**

### **Core Technologies**

**Frontend**

- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui for components
- Progressive Web App capabilities

**Backend**

- Supabase for database and authentication
- Server Actions for data mutations
- Redis for caching and session management
- Ledger CLI for accounting operations

**AI Integration**

- OpenAI GPT-4 for natural language processing
- Custom intent detection algorithms
- Pattern learning for account mapping
- Command generation and validation

**Infrastructure**

- Kubernetes for container orchestration
- DigitalOcean for cloud hosting
- Vercel for CDN and edge functions
- Stripe for subscription management

### **Data Flow Architecture**

```
User Input → AI Processing → Command Generation → Database → Ledger CLI → .ledger File
     ↓              ↓              ↓              ↓           ↓           ↓
Natural Language → Intent Detection → Structured Command → Supabase → Remote CLI → Standard Format
```

### **Security Model**

- **Tenant Isolation** - Row-level security in database
- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - API protection against abuse
- **Audit Logging** - Complete transaction history
- **Data Encryption** - At rest and in transit

---

## **9. Competitive Analysis**

### **Current Market Landscape**

**Traditional Accounting Software**

- QuickBooks: Complex, expensive, vendor lock-in
- Xero: Good but lacks developer-friendly features
- FreshBooks: Simple but limited accounting features

**Developer Tools**

- Beancount: Command-line only, no web interface
- Ledger CLI: Powerful but requires technical expertise
- GnuCash: Desktop-only, complex interface

### **Our Competitive Advantages**

**1. Best of Both Worlds**

- Modern web interface + terminal power
- Professional accounting + developer-friendly
- AI assistance + manual control
- Cloud convenience + data portability

**2. Unique Value Propositions**

- Natural language processing for accounting
- AI-powered account learning
- Standard .ledger file format
- Multi-tenant SaaS architecture
- Progressive Web App capabilities

**3. Market Positioning**

- "The Developer's Accounting System"
- "Natural Language Meets Professional Accounting"
- "Accounting That Doesn't Suck"
- "No Vendor Lock-in, Ever"

### **Go-to-Market Strategy**

**Phase 1: Developer Community**

- Launch on Hacker News, Reddit, GitHub
- Target freelance developers and consultants
- Build community around terminal-based accounting
- Create educational content about double-entry accounting

**Phase 2: Small Business Expansion**

- Partner with accounting professionals
- Create business-focused features
- Build integrations with popular tools
- Develop white-label solutions

**Phase 3: Enterprise Features**

- Advanced reporting and analytics
- Custom integrations and APIs
- Dedicated support and training
- Compliance and audit features

---

## **10. Success Metrics & KPIs**

### **Product Metrics**

**User Engagement**

- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session duration and frequency
- Command usage patterns
- AI interaction rates

**Feature Adoption**

- Natural language processing usage
- Account learning system effectiveness
- Multi-business feature adoption
- Export functionality usage
- Mobile app usage

**Quality Metrics**

- Command accuracy rate
- AI suggestion acceptance rate
- User error rates
- System uptime and performance
- Customer satisfaction scores

### **Business Metrics**

**Revenue**

- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Customer Lifetime Value (CLV)
- Average Revenue Per User (ARPU)
- Churn rate and retention

**Growth**

- User acquisition cost (CAC)
- Organic vs. paid acquisition
- Viral coefficient
- Market penetration
- Geographic expansion

**Operational**

- Support ticket volume
- System performance metrics
- Security incident rate
- Compliance audit results
- Team productivity metrics

## **11. Risk Assessment & Mitigation**

### **Technical Risks**

**AI Dependency Risk**

- **Risk**: Over-reliance on AI for critical accounting functions
- **Mitigation**: Always provide manual override options, maintain rule-based fallbacks
- **Monitoring**: Track AI accuracy rates, user correction patterns

**Data Integrity Risk**

- **Risk**: Accounting errors due to system bugs or AI mistakes
- **Mitigation**: Comprehensive testing, audit trails, user review workflows
- **Monitoring**: Error rates, user feedback, automated validation

**Scalability Risk**

- **Risk**: System performance degradation with user growth
- **Mitigation**: Cloud-native architecture, auto-scaling, performance monitoring
- **Monitoring**: Response times, resource utilization, user experience metrics

### **Business Risks**

**Market Competition Risk**

- **Risk**: Large players (QuickBooks, Xero) copying our approach
- **Mitigation**: Focus on developer community, build strong moats
- **Monitoring**: Competitive analysis, feature differentiation

**Regulatory Risk**

- **Risk**: Accounting compliance requirements changing
- **Mitigation**: Stay updated on regulations, build compliance features
- **Monitoring**: Regulatory updates, audit requirements

**Customer Acquisition Risk**

- **Risk**: High customer acquisition costs in competitive market
- **Mitigation**: Focus on organic growth, developer community, content marketing
- **Monitoring**: CAC trends, organic vs. paid acquisition ratios

## **12. Conclusion**

Ledger AI represents a unique opportunity to revolutionize accounting software by combining the power of Ledger CLI with modern web technology and AI assistance. Our approach addresses the fundamental pain points in current accounting software while maintaining the precision and portability that professionals demand.

### **Key Success Factors**

1. **Developer-First Approach** - Terminal interface and CLI compatibility
2. **AI-Powered Learning** - Natural language processing with account normalization
3. **Data Portability** - Standard .ledger file format ensures no vendor lock-in
4. **Multi-Tenant Architecture** - Scalable SaaS platform for growth
5. **Professional Grade** - Double-entry accounting with audit trails

### **Next Steps**

1. **Phase 1 Implementation** - Enhanced command system and AI integration
2. **Phase 2 Development** - Multi-tenant architecture and security
3. **Phase 3 Deployment** - Production infrastructure and performance
4. **Phase 4 Growth** - Business features and market expansion

### **Vision**

To become the leading accounting platform for developers, freelancers, and small businesses who value precision, portability, and modern user experience. We believe that accounting software should be as powerful as the tools developers use every day, while remaining accessible to non-technical users through AI assistance.

**"The Developer's Accounting System"** - Where natural language meets professional accounting, and your data is never trapped in proprietary formats.

---

## **Project Structure**

The current codebase provides a solid foundation for the production-ready implementation. Key areas for enhancement include:

### **Current Strengths**

- ✅ **Modern Next.js 15 architecture** with App Router
- ✅ **Comprehensive terminal system** with command parsing
- ✅ **AI integration** for natural language processing
- ✅ **Supabase integration** for database and authentication
- ✅ **Ledger CLI compatibility** with file sync
- ✅ **TypeScript throughout** with proper type safety

### **Areas for Production Enhancement**

- 🔄 **Multi-tenant architecture** - Add tenant isolation and user management
- 🔄 **Enhanced command system** - Implement type-specific commands (ex, in, as, li, tr)
- 🔄 **Account learning system** - Build smart account normalization
- 🔄 **Production infrastructure** - Kubernetes, monitoring, security
- 🔄 **Business features** - Reporting, API access, mobile optimization

### **Implementation Priority**

1. **Phase 1** - Enhanced command system and AI integration
2. **Phase 2** - Multi-tenant architecture and security
3. **Phase 3** - Production infrastructure and performance
4. **Phase 4** - Business features and market expansion

The foundation is solid and ready for the production transformation outlined in this roadmap.

### **UI Component Integration Strategy**

The current codebase includes a **professional shadcn/ui component system** that can be directly integrated into the rebuild, saving significant development time.

#### **Reusable UI Components (100% Compatible)**

```typescript
// These components can be copied directly to the new app
src/components/ui/
├── button.tsx          // ✅ Perfect for actions and commands
├── input.tsx           // ✅ Great for command input and forms
├── card.tsx            // ✅ Perfect for displaying ledger entries
├── command.tsx         // ✅ Excellent for terminal interface
├── toast.tsx           // ✅ Professional notifications
├── dialog.tsx          // ✅ For modals and confirmations
├── select.tsx          // ✅ For dropdowns and account selection
├── badge.tsx           // ✅ For status indicators and tags
├── accordion.tsx       // ✅ For collapsible sections
├── alert.tsx           // ✅ For system messages
├── checkbox.tsx        // ✅ For form controls
├── dropdown-menu.tsx   // ✅ For context menus
├── label.tsx           // ✅ For form labels
├── popover.tsx         // ✅ For tooltips and overlays
├── sheet.tsx           // ✅ For side panels
├── textarea.tsx        // ✅ For multi-line input
└── toaster.tsx         // ✅ Toast notification system
```

#### **Design System (100% Reusable)**

```css
/* Complete theme system ready for production */
src/app/globals.css     // ✅ CSS variables, theme tokens, dark mode
components.json         // ✅ shadcn/ui configuration (New York style, neutral base)
```

#### **Integration Benefits**

**Immediate Advantages:**

- **Professional Design** - Polished, modern interface from day one
- **Accessibility** - WCAG compliant components out of the box
- **Consistency** - Unified design language across the entire app
- **Developer Experience** - TypeScript, proper props, excellent documentation
- **Time Savings** - 2-3 weeks of design and component development work

#### **Terminal Interface Integration**

The **Command component** is particularly valuable for the new terminal interface:

```typescript
// Perfect foundation for the new terminal system
<Command>
  <CommandInput placeholder="Type a command or natural language..." />
  <CommandList>
    <CommandGroup heading="Recent Commands">
      <CommandItem>ex -i coffee 100 -v Starbucks</CommandItem>
      <CommandItem>in -i consultancy 5000 -c "Acme Corp"</CommandItem>
    </CommandGroup>
    <CommandGroup heading="AI Suggestions">
      <CommandItem>I bought coffee for $5</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

#### **New Components to Build (Using Existing Primitives)**

```typescript
// New ledger-specific components using existing UI primitives
src/components/ledger/
├── ledger-entry-card.tsx     // Uses Card, Badge, Button
├── account-suggestion.tsx    // Uses CommandItem, Badge
├── transaction-form.tsx      // Uses Input, Select, Button
├── balance-display.tsx       // Uses Card, Badge
├── command-terminal.tsx      // Uses Command, Input, Toast
├── subscription-billing.tsx  // Uses Card, Button, Badge
└── dashboard-widgets.tsx     // Uses Card, Badge, Button
```

#### **Example Integration**

```typescript
// New ledger entry component using existing UI
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from "@/components/ui";

export function LedgerEntryCard({ entry }: { entry: LedgerEntry }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{entry.description}</CardTitle>
        <Badge variant="outline">{entry.type}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entry.postings.map((posting) => (
            <div key={posting.id} className="flex justify-between">
              <span>{posting.account}</span>
              <span>{posting.amount}</span>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### **Rebuild Integration Timeline**

**Week 1: UI Foundation (1-2 days)**

- Copy UI components directory
- Copy design system (globals.css, components.json)
- Set up theme and styling
- Test component functionality

**Week 2: Core Components (3-4 days)**

- Build ledger-specific components using existing primitives
- Create terminal interface using Command component
- Implement form components using Input, Select, Button
- Add notification system using Toast components

**Week 3-4: Integration & Polish (1-2 days)**

- Integrate components with new architecture
- Add business-specific styling
- Implement responsive design
- Test accessibility and user experience

### **Current Codebase Structure**

tree /Users/wolf/Documents/Development/Projects/Ledger/ledger-app/src
/Users/wolf/Documents/Development/Projects/Ledger/ledger-app/src
├── actions
│   └── comments
│   ├── add-comment.ts
│   ├── approve-comment.ts
│   ├── delete-comment.ts
│   └── edit-comment.ts
├── app
│   ├── about
│   │   └── page.tsx
│   ├── actions
│   │   ├── actions.ts
│   │   ├── auth-actions.ts
│   │   ├── cache-actions.ts
│   │   ├── cache-bak-remove
│   │   │   └── generate-posts-cache.ts
│   │   ├── comments
│   │   │   └── get-comments.ts
│   │   ├── contact
│   │   │   └── get-contact-messages.ts
│   │   ├── create-new-post-action.ts
│   │   ├── delete-post-action.ts
│   │   ├── edit-post-action.ts
│   │   ├── editor
│   │   │   ├── delete-post.ts
│   │   │   └── save-post.ts
│   │   ├── ledger
│   │   │   ├── after-save-ledger-sync.ts
│   │   │   ├── create-ledger-entry.ts
│   │   │   ├── create-ledger-from-structured.ts
│   │   │   ├── get-ledger-entries.ts
│   │   │   ├── read-ledger-file.ts
│   │   │   ├── route-new-commands.ts
│   │   │   ├── sync-ledger-file.ts
│   │   │   └── update-ledger-entry.ts
│   │   ├── like-actions.ts
│   │   ├── mdx
│   │   │   └── fetch-mdx-raw.ts
│   │   ├── open-actions.ts
│   │   ├── pages
│   │   │   ├── create-new-page-action.ts
│   │   │   ├── edit-page-action.ts
│   │   │   └── get-page.ts
│   │   └── posts
│   │   ├── get-popular-posts.ts
│   │   ├── get-post.ts
│   │   ├── get-posts.ts
│   │   └── getRelatedPostTitles.ts
│   ├── api
│   │   ├── admin
│   │   │   └── cache-posts
│   │   │   └── route.ts
│   │   ├── ai-usage
│   │   │   └── route.ts
│   │   ├── contact-messages
│   │   │   └── route.ts
│   │   ├── ledger
│   │   │   └── append
│   │   │   └── route.ts
│   │   ├── ledger-cli
│   │   │   └── route.ts
│   │   ├── ledger-entry
│   │   │   └── delete
│   │   │   └── route.ts
│   │   ├── mdx-raw
│   │   │   └── route.ts
│   │   ├── openai
│   │   │   └── route.ts
│   │   ├── openai-image-analyze
│   │   │   └── route.ts
│   │   ├── receipt-image
│   │   │   └── route.ts
│   │   └── receipt-preprocess
│   │   └── route.ts
│   ├── apple-icon.png
│   ├── auth
│   │   ├── \_archinve
│   │   │   ├── sign-up
│   │   │   │   └── page.tsx
│   │   │   └── sign-up-success
│   │   │   └── page.tsx
│   │   ├── confirm
│   │   │   └── route.ts
│   │   ├── error
│   │   │   └── page.tsx
│   │   ├── forgot-password
│   │   │   └── page.tsx
│   │   ├── login
│   │   │   └── page.tsx
│   │   └── update-password
│   │   └── page.tsx
│   ├── blog
│   │   ├── [slug]
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── contact
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── image-process
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── ledger
│   │   ├── entries
│   │   │   └── page.tsx
│   │   └── entry
│   │   └── [id]
│   │   ├── editable-ledger-entry.tsx
│   │   ├── image-upload.tsx
│   │   └── page.tsx
│   ├── loading.tsx
│   ├── manifest.json
│   ├── not-found.tsx
│   ├── page.tsx
│   ├── post
│   │   ├── create
│   │   │   └── [slug]
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── edit
│   │   │   └── [slug]
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── privacy-policy
│   │   └── page.tsx
│   ├── projects
│   │   ├── [slug]
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── protected
│   │   └── page.tsx
│   └── test
│   └── page.tsx
├── commands
│   ├── smart
│   │   ├── edit-entry-command.ts
│   │   ├── entries
│   │   │   ├── currency.ts
│   │   │   ├── formatting.ts
│   │   │   ├── parser.ts
│   │   │   ├── query-builder.ts
│   │   │   └── types.ts
│   │   ├── entries-command.ts
│   │   ├── handle-command.ts
│   │   ├── ledger-cli-command.ts
│   │   ├── new-command-handler.ts
│   │   ├── registry.ts
│   │   ├── sets
│   │   │   ├── about.ts
│   │   │   ├── admin.ts
│   │   │   ├── blog.ts
│   │   │   ├── contact.ts
│   │   │   ├── global.ts
│   │   │   ├── home.ts
│   │   │   ├── post.ts
│   │   │   ├── privacy.ts
│   │   │   └── projects.ts
│   │   └── utils.ts
│   └── utils.ts
├── components
│   ├── alerts
│   │   ├── custom-alert.tsx
│   │   ├── editable-receipt-error.tsx
│   │   └── production-mode-alert.tsx
│   ├── auth-button.tsx
│   ├── blog
│   │   └── blog-layout-wrapper.tsx
│   ├── code
│   │   ├── code.tsx
│   │   ├── inline-code.tsx
│   │   └── pre.tsx
│   ├── comments
│   │   ├── comment-form.tsx
│   │   ├── comment-list.tsx
│   │   └── comment-section.tsx
│   ├── compliance
│   │   ├── cookie-consent-banner.tsx
│   │   └── cookie-consent-manager.tsx
│   ├── contact
│   │   └── contact-form.tsx
│   ├── editor
│   │   └── monaco-mdx-editor.tsx
│   ├── examples
│   │   ├── charts
│   │   ├── chat
│   │   │   └── command-console.tsx
│   │   ├── code-type-animation.tsx
│   │   ├── cookie-jar.tsx
│   │   ├── copy-to-clipboard
│   │   │   ├── copy-image.tsx
│   │   │   └── copy-text.tsx
│   │   ├── css
│   │   │   ├── box-model-visualizer.tsx
│   │   │   ├── display-type-visualizer.tsx
│   │   │   ├── em-vs-rem.tsx
│   │   │   ├── position-visualizer.tsx
│   │   │   └── selectors-demo.tsx
│   │   ├── custom-button.tsx
│   │   ├── drawing
│   │   ├── dynamic-input-popup copy.tsx
│   │   ├── dynamic-input-popup.tsx
│   │   ├── fetch-vs-axios
│   │   │   ├── axios-component.tsx
│   │   │   └── fetch-component.tsx
│   │   ├── forms
│   │   │   └── form-data-demo.tsx
│   │   ├── geolocation
│   │   │   └── geolocation-tracker.tsx
│   │   ├── html
│   │   ├── media
│   │   │   ├── custom-audio-player.tsx
│   │   │   ├── eq-visualizer.tsx
│   │   │   ├── example-player.tsx
│   │   │   └── video-with-subtitles.tsx
│   │   ├── tailwind-colors.tsx
│   │   ├── typescript
│   │   │   ├── typed-input-usage.tsx
│   │   │   └── typed-input.tsx
│   │   └── useref
│   │   ├── focus-input-no-useref.tsx
│   │   ├── focus-input-with-useref.tsx
│   │   ├── track-previous-state-cannot.tsx
│   │   └── track-previous-state-with-useref.tsx
│   ├── forgot-password-form.tsx
│   ├── graphics
│   │   └── noisy-logo
│   │   ├── noisy-logo-test.tsx
│   │   └── noisy-logo.tsx
│   ├── image
│   │   ├── image-analyzer.tsx
│   │   └── image-to-ocr.tsx
│   ├── like
│   │   └── like-button.tsx
│   ├── login-form.tsx
│   ├── logout-button.tsx
│   ├── mdx
│   │   ├── accordion-component.tsx
│   │   ├── code.tsx
│   │   ├── custom-button.tsx
│   │   ├── custom-link.tsx
│   │   ├── iframe.tsx
│   │   ├── image.tsx
│   │   ├── inline-code.tsx
│   │   ├── mdx-content.tsx
│   │   ├── pre.tsx
│   │   ├── regex-highlighter-component.tsx
│   │   └── youtube.tsx
│   ├── multi-select
│   │   ├── multi-select-test.tsx
│   │   └── shcn-multi-select-categories.tsx
│   ├── my-component.tsx
│   ├── nav
│   │   ├── footer.tsx
│   │   ├── header.tsx
│   │   └── links-sheet.tsx
│   ├── posts
│   │   ├── back-button.tsx
│   │   ├── blog-post-list.tsx
│   │   ├── edit-post-button.tsx
│   │   ├── open-in-cursor-button.tsx
│   │   ├── open-in-vs-code-button.tsx
│   │   ├── popular-posts.tsx
│   │   ├── progress-bar.tsx
│   │   ├── project-post-list.tsx
│   │   ├── related-posts.tsx
│   │   ├── search-posts.tsx
│   │   ├── select-limit-posts.tsx
│   │   └── sort-posts.tsx
│   ├── sign-up-form.tsx
│   ├── sw-register.tsx
│   ├── terminal
│   │   ├── command-loading.tsx
│   │   ├── custom-mdx-components.tsx
│   │   ├── ledger-entry-components.tsx
│   │   ├── smart-terminal.tsx
│   │   ├── terminal-image-upload.tsx
│   │   ├── terminal-loading.tsx
│   │   ├── terminal-output-renderer.tsx
│   │   ├── terminal-reset-button.tsx
│   │   └── terminal.tsx
│   ├── theme
│   │   └── mode-toggle.tsx
│   ├── theme-bridge.tsx
│   ├── theme-provider.tsx
│   ├── typography
│   │   ├── font-hero
│   │   │   ├── font-hero.tsx
│   │   │   ├── fonts
│   │   │   │   └── CS Noire-Light.otf
│   │   │   └── fonts.ts
│   │   ├── hyphenated-title
│   │   │   └── ht.tsx
│   │   ├── random-font-hero
│   │   │   ├── fonts
│   │   │   │   ├── CS-5uper.otf
│   │   │   │   ├── CS-Defiant2.woff2
│   │   │   │   ├── CS-Endless.woff2
│   │   │   │   ├── CS-Glare.otf
│   │   │   │   └── CS-Noire-Black.otf
│   │   │   ├── fonts.ts
│   │   │   └── random-font-hero.tsx
│   │   └── random-font-hero-home
│   │   ├── fonts
│   │   │   ├── CS-5uper.otf
│   │   │   ├── CS-Defiant2.woff2
│   │   │   ├── CS-Endless.woff2
│   │   │   ├── CS-Glare.otf
│   │   │   └── CS-Noire-Black.otf
│   │   ├── fonts.ts
│   │   └── random-font-hero.tsx
│   ├── ui
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── command.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── sonner.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   └── update-password-form.tsx
├── config
│   └── vendors.json
├── content
│   ├── mdx
│   │   └── test.mdx
│   ├── pages
│   │   ├── about.mdx
│   │   ├── blog.mdx
│   │   ├── contact.mdx
│   │   ├── create.mdx
│   │   ├── edit.mdx
│   │   ├── home.mdx
│   │   ├── post.mdx
│   │   ├── privacy.mdx
│   │   ├── projects.mdx
│   │   ├── protected.mdx
│   │   └── welcome.mdx
│   └── posts
│   ├── documentation.mdx
│   ├── ledger-cli-a-beginners-tutorial-part-2.mdx
│   ├── ledger-cli-a-beginners-tutorial.mdx
│   └── ledger-cli-practical-tutorial-for-freelance-developers-6.mdx
├── data
│   ├── layer
│   │   ├── blog-fs.ts
│   │   └── blog.ts
│   ├── ledger
│   │   └── general.ledger
│   ├── pages-list.ts
│   └── routes.ts
├── hooks
│   ├── use-terminal-scroll-keys.ts
│   └── use-toast.ts
├── lib
│   ├── cache
│   │   ├── generate-cache-posts.mjs
│   │   └── generate-cache-posts.ts
│   ├── chat
│   │   └── generate-title.ts
│   ├── comments
│   │   └── local-storage.ts
│   ├── config
│   │   └── config.js
│   ├── keyword-utils.ts
│   ├── ledger
│   │   ├── account-map.ts
│   │   ├── ai-receipt-parser.ts
│   │   ├── auto-balance-ledger-entry.ts
│   │   ├── build-postings-from-receipt.ts
│   │   ├── convert-ocr-to-manual.ts
│   │   ├── enhanced-ocr-pipeline.ts
│   │   ├── is-local-write-enabled.ts
│   │   ├── parse-ledger-entry.ts
│   │   ├── parse-manual-command.ts
│   │   ├── parse-receipt-ocr-invoice.ts
│   │   ├── parse-receipt-ocr.ts
│   │   ├── reconcile-receipt-summary.ts
│   │   ├── render-ledger.ts
│   │   ├── schemas.ts
│   │   ├── segment-ocr-with-llm.ts
│   │   ├── validate-receipt-ocr.ts
│   │   └── vendor-config.ts
│   ├── ledger-config.ts
│   ├── ledger-date-parse.ts
│   ├── ledger-date.ts
│   ├── openai.ts
│   ├── posts
│   │   └── get-posts.mjs
│   ├── scripts
│   │   ├── embedding.ts
│   │   ├── generate-system-prompt.ts
│   │   └── populate-likes.mjs
│   ├── stopwords.ts
│   ├── theme-client.ts
│   ├── utils
│   │   └── is-dev-mode.js
│   ├── utils.ts
│   └── web
│   └── scrape.ts
├── types
│   ├── blog.ts
│   ├── comment.ts
│   ├── monaco-vim.d.ts
│   ├── post-metadata.ts
│   ├── terminal.ts
│   └── user.ts
└── utils
├── cn.ts
├── commands-serialize.ts
├── openai
│   ├── get-client-ip.ts
│   └── rate-limit.ts
├── rate-limit-redis.ts
├── supabase
│   ├── check-env-vars.ts
│   ├── client.ts
│   ├── get-user.ts
│   ├── middleware.ts
│   └── server.ts
└── utils.ts

122 directories, 308 files
