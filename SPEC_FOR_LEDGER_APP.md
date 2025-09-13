find github auth here:
/Users/wolf/Documents/Development/Education/file-system/github-auth

accounts:

# Multi‑Business + Personal Accounts System — Functional & Data Spec (v1.0)

**Owner:** OWolf / Ledger Entry / Entry App
**Status:** Draft for implementation
**Scope:** Chart of Accounts model, posting rules, data schema, seeding, validation, and API contracts for a multi‑entity system supporting Business(es) and Personal, with granular control and predictable structure.

---

## 0) Objectives

- Provide a **predictable**, **machine‑friendly** Chart of Accounts (CoA) across multiple entities (e.g., `Biz1`, `Biz2`, `Personal`).
- Enable **granular tracking** via hierarchical accounts + optional tags/dimensions without exploding the CoA.
- Standardize **codes, naming, and posting rules** to simplify automation (parsers, mapping rules, AI assistance) and reporting.
- Support **taxes (VAT/GST)**, **fixed assets & depreciation**, **multi‑currency**, and **inter‑entity transfers**.

---

## 1) Core Concepts & Terminology

- **Entity**: A legal or logical accounting unit (e.g., `Biz1`, `Biz2`, `Personal`). All accounts are **namespaced** by entity.
- **Account Class**: Top‑level class. Exactly one of: `Assets`, `Liabilities`, `Equity`, `Income`, `COGS`, `Expenses`.
- **Account Path**: Colon‑delimited hierarchy: `Entity:Class:Category[:Subcategory[:Detail]]` (≤ 5 levels after Entity).
- **Account Code**: Numeric, sortable identifier for accounts. Indicates class by leading digit.
- **Tag/Dimension**: Cross‑cutting analytics label(s) such as `Project`, `Client`, `Location`, `Campaign`. Does not change the CoA.
- **Journal Entry**: One or more debits and credits that balance to zero inside a **single entity**.

---

## 2) Naming & Hierarchy Standards

**Path Format**

```
<Entity>:<Class>:<Category>[:<Subcategory>[:<Detail>]]
```

- Use **TitleCase** nodes; words joined without spaces (e.g., `OfficeEquipment`, `ServiceSales`).
- Limit depth to **max 5 levels** after the Entity. Example: `Biz1:Expenses:Marketing:FacebookAds`.
- Node grammar uses **nouns** only (avoid verbs). Avoid abbreviations unless standard (e.g., `VAT`).

**Class Set (fixed)**

- `Assets`, `Liabilities`, `Equity`, `Income`, `COGS`, `Expenses`

**Common Categories** (non‑exhaustive):

- Assets: `Bank`, `Cash`, `Current`, `Receivables`, `Tax` (Input VAT), `Fixed`, `Clearing`, `Prepaid`, `Deposits`
- Liabilities: `Payables`, `CreditCard`, `Loans`, `Accrued`, `Tax` (Output VAT, CorporateIncome, Withholding), `Deferred`
- Equity: `Owner`, `RetainedEarnings`, `Capital`
- Income: `ProductSales`, `ServiceSales`, `RentalIncome`, `OtherIncome`
- COGS: `Merchandise`, `Subcontractors`, `Shipping`, `MerchantFees`
- Expenses: `Software`, `Marketing`, `Rent`, `Utilities`, `Payroll`, `Travel`, `Meals`, `Insurance`, `Depreciation`, `ProfessionalServices`

---

## 3) Account Codes

- **Leading digit** encodes class: `1xxx` Assets, `2xxx` Liabilities, `3xxx` Equity, `4xxx` Income, `5xxx` COGS, `6xxx+` Expenses.
- Reserve **x000–x099** for class headers; use **x100–x999** for leaf accounts.
- Example code blocks (suggested global ranges; per‑entity uniqueness enforced):

  - 1000–1999 Assets
  - 2000–2999 Liabilities
  - 3000–3999 Equity
  - 4000–4999 Income
  - 5000–5999 COGS
  - 6000–7999 Expenses

**Sample Code Map (excerpt)**

- 1100 `Assets:Bank`
- 1110 `Assets:Bank:BangkokBank:Checking`
- 1200 `Assets:Current:Inventory`
- 1300 `Assets:Receivables:Customers`
- 1500 `Assets:Tax:VAT:Input`
- 2100 `Liabilities:CreditCard:Visa1234`
- 2500 `Liabilities:Tax:VAT:Output`
- 3100 `Equity:Owner:Contributions`
- 3200 `Equity:Owner:Distributions`
- 4100 `Income:ProductSales:TShirts`
- 5100 `COGS:Merchandise:TShirts`
- 6200 `Expenses:Marketing:FacebookAds`
- 6210 `Expenses:Marketing:GoogleAds`
- 6900 `Expenses:Depreciation:OfficeEquipment`

> Codes are **per entity**; same code can exist under different entities.

---

## 4) Standard Account Tree Templates

### 4.1 Business (Products) — Template (excerpt)

```
<Entity>
  Assets
    Bank
      <BankName>
        Checking
        Savings
    Current
      Inventory
      Prepaid
      Deposits
    Receivables
      Customers
    Tax
      VAT
        Input
    Clearing
      Stripe
      PayPal
  Liabilities
    Payables
      Vendors
    CreditCard
      Visa1234
    Tax
      VAT
        Output
      CorporateIncome
  Equity
    Owner
      Contributions
      Distributions
    RetainedEarnings
  Income
    ProductSales
      TShirts
    OtherIncome
  COGS
    Merchandise
      TShirts
    Shipping
    MerchantFees
  Expenses
    Marketing
      FacebookAds
      GoogleAds
    Software
      SaaS
        GoogleWorkspace
        Figma
    Rent
    Utilities
    Depreciation
      OfficeEquipment
```

### 4.2 Business (Services) — Template (excerpt)

```
<Entity>
  Assets
    Bank
      <BankName>
        Checking
    Receivables
      Customers
    Tax
      VAT
        Input
  Liabilities
    Payables
      Vendors
    CreditCard
      Visa1234
    Tax
      VAT
        Output
  Equity
    Owner
      Contributions
      Distributions
    RetainedEarnings
  Income
    ServiceSales
      Consultancy
  COGS (optional)
    Subcontractors
  Expenses
    Marketing
      GoogleAds
    Software
      SaaS
        GoogleWorkspace
```

### 4.3 Personal — Template (excerpt)

```
Personal
  Assets
    Bank
      KBank
        Checking
  Liabilities
    CreditCard
      Visa1234
  Equity
    NetWorth (computed; no postings)
  Income
    Salary
    OtherIncome
  Expenses
    Food
      Fruit
        Apples
    Household
      Kitchen
        Towels
    Subscriptions
      Entertainment
        Netflix
  Transfers (optional non‑P&L view)
    FromBiz1
    ToBiz1
```

---

## 5) Posting & Validation Rules

**General**

1. **Entity‑local balancing**: A journal entry must balance (sum debits = sum credits) **within one entity**.
2. **No cross‑entity postings** in a single entry. Inter‑entity flows use **paired entries** (see §6).
3. **Leaf‑only postings**: Post to leaf accounts. Non‑leaf accounts are headers (set `is_postable=false`).
4. **Class compatibility**: Enforce debit/credit natural balance by class (configurable). E.g., Assets normally debit‑positive, Income credit‑positive.
5. **Code range check**: Account code must match class‑leading digit.

**Cashflows & Sales**
6\. For sales collected via processor:

- Credit `Income:*` for net revenue line(s)
- Credit `Liabilities:Tax:VAT:Output` if applicable
- Debit `Assets:Clearing:<Processor>` for gross receipt
- Debit `Expenses:Fees:<Processor>` and credit `Assets:Clearing:<Processor>` for fees when settled
- Transfer clearing to bank upon payout (Debit `Assets:Bank:*`, Credit `Assets:Clearing:*`).

**Purchases & VAT**
7\. Purchases with VAT:

- Debit `Expenses:*` or `COGS:*`
- Debit `Assets:Tax:VAT:Input`
- Credit payment source (`Assets:Bank:*` or `Liabilities:CreditCard:*`).

**Inventory & COGS (periodic method)**
8\. For product businesses using periodic COGS: track `Assets:Current:Inventory`. Periodically record COGS via inventory adjustment journal (or use perpetual with item‑level movement if implemented).

**Fixed Assets & Depreciation**
9\. Capitalize items meeting capitalization threshold at `Assets:Fixed:...`, track `ContraAssets:AccumDep:*` (if implemented) and book depreciation to `Expenses:Depreciation:*` periodically.

**Refunds/Returns**
10\. Use contra accounts or dedicated nodes: `Income:ProductSales:Returns` (credit/debit direction consistent with contra policy), or `ContraIncome:Returns` if you maintain a separate class.

**Personal vs Business Separation**
11\. Block business P\&L postings to `Personal:*` and vice versa. Use inter‑entity transfers (next section).

---

## 6) Inter‑Entity Transfers & Owner Flows

**Owner contribution (Personal pays Biz expense):**

- In `BizX`:

  - Debit `Expenses:*`
  - Credit `Equity:Owner:Contributions`

- Optional mirror in `Personal` for tracking:

  - Debit `Assets:DueFrom:BizX` (or `Transfers:ToBizX`)
  - Credit `Assets:Bank:*`

**Owner draw (Biz pays Personal expense):**

- In `BizX`:

  - Debit `Equity:Owner:Distributions`
  - Credit `Assets:Bank:*`

- Optional mirror in `Personal`:

  - Debit `Transfers:FromBizX` (or `Assets:Bank:*`)
  - Credit non‑P\&L category (avoid inflating income).

**Due To/From Tracking (optional)**

- Choose one pattern per entity: `Assets:DueFrom:Owner` **or** `Liabilities:DueTo:Owner` to avoid sign confusion.

---

## 7) Taxes (VAT/GST) & Withholding

- **Output VAT** (on sales): credit `Liabilities:Tax:VAT:Output`.
- **Input VAT** (on purchases): debit `Assets:Tax:VAT:Input`.
- Netting/remittance entry transfers net amount to/from bank and resets VAT balances.
- Withholding tax (if applicable): recognize at `Liabilities:Tax:Withholding` and clear upon remittance.

---

## 8) Multi‑Currency & FX

- Each journal line stores `amount`, `currency`, and optional `fx_rate` to **entity functional currency**.
- Derived `amount_functional = amount * fx_rate` for reporting.
- Revaluation postings: period‑end unrealized FX to `Income:FXGainsLosses` or `Expenses:FXGainsLosses` as configured.

---

## 9) Data Model (Database Schema)

### 9.1 Entities

- `entities(id, slug, name, type ENUM['business','personal'], functional_currency, created_at)`

### 9.2 Accounts

- `accounts(id, entity_id FK, code INT, path TEXT, name TEXT, class ENUM, parent_id FK NULL, is_postable BOOL, currency NULLABLE, created_at)`
- **Unique**: `(entity_id, code)` and `(entity_id, path)`
- **Derived fields** (materialized or view): `depth`, `path_array`, `leaf_bool`.

### 9.3 Journals & Lines

- `journal_entries(id, entity_id FK, date, memo TEXT, created_by, created_at, locked BOOL DEFAULT false, source ENUM['user','import','ai','api'])`
- `journal_lines(id, journal_id FK, account_id FK, dc ENUM['D','C'], amount NUMERIC(18,2), currency CHAR(3), fx_rate NUMERIC(18,8) NULL, amount_functional NUMERIC(18,2) GENERATED, tags JSONB NULL)`
- **Constraint**: sum(amount_functional \* sign(dc)) = 0 per `journal_id`.
- **Index**: `(entity_id, date)`, `(account_id, date)`.

### 9.4 Tags / Dimensions

- `dimensions(id, name)`; `dimension_values(id, dimension_id, value)`; bridge `journal_line_dimensions(journal_line_id, dimension_id, value_id)`
- Or simpler: `journal_lines.tags JSONB` (key → value array). Enforce schema at app layer.

### 9.5 Tax Tables (optional for automation)

- `tax_schemes(id, name, country, currency, rate JSONB)`
- `tax_rules(id, entity_id, match JSONB, input_account_id FK, output_account_id FK, rate DECIMAL)`

### 9.6 Closing & Period Locks

- `period_locks(entity_id, period_start, period_end, locked_by, locked_at)`

---

## 10) API Contracts (v1, REST‑ish)

### 10.1 Accounts

- `GET /entities/:eid/accounts` (filters: class, is_postable, depth)
- `POST /entities/:eid/accounts`
  Body: `{ code, path, name, class, parent_id, is_postable }`
- `PATCH /entities/:eid/accounts/:aid`
- Validation: path hierarchy, class/code alignment, uniqueness.

### 10.2 Journals

- `POST /entities/:eid/journals`
  Body: `{ date, memo, lines: [{ account_code|account_path, dc, amount, currency, fx_rate?, tags? }] }`
- Server resolves accounts, validates balance, applies tax/clearing rules if `source=='ai'` hints provided.

### 10.3 Dimensions

- `GET /dimensions`, `POST /dimensions`, `POST /dimensions/:id/values`

### 10.4 Utilities

- `POST /entities/:eid/close-period` (requires balanced VAT remittance etc.)
- `POST /entities/:eid/revalue-fx`

---

## 11) Seeding & Templates

### 11.1 Seed JSON Schema

```json
{
  "version": "1.0",
  "entities": [
    {
      "slug": "Biz1",
      "type": "business",
      "functional_currency": "THB",
      "accounts": [
        {
          "code": 1100,
          "path": "Assets:Bank",
          "name": "Bank",
          "is_postable": false
        },
        {
          "code": 1110,
          "path": "Assets:Bank:BangkokBank:Checking",
          "name": "BangkokBank Checking",
          "is_postable": true
        },
        {
          "code": 1200,
          "path": "Assets:Current:Inventory",
          "name": "Inventory",
          "is_postable": true
        },
        {
          "code": 1500,
          "path": "Assets:Tax:VAT:Input",
          "name": "VAT Input",
          "is_postable": true
        },
        {
          "code": 2100,
          "path": "Liabilities:CreditCard:Visa1234",
          "name": "Visa 1234",
          "is_postable": true
        },
        {
          "code": 2500,
          "path": "Liabilities:Tax:VAT:Output",
          "name": "VAT Output",
          "is_postable": true
        },
        {
          "code": 3100,
          "path": "Equity:Owner:Contributions",
          "name": "Owner Contributions",
          "is_postable": true
        },
        {
          "code": 3200,
          "path": "Equity:Owner:Distributions",
          "name": "Owner Distributions",
          "is_postable": true
        },
        {
          "code": 4100,
          "path": "Income:ProductSales:TShirts",
          "name": "Product Sales — TShirts",
          "is_postable": true
        },
        {
          "code": 5100,
          "path": "COGS:Merchandise:TShirts",
          "name": "COGS — TShirts",
          "is_postable": true
        },
        {
          "code": 6200,
          "path": "Expenses:Marketing:FacebookAds",
          "name": "Facebook Ads",
          "is_postable": true
        },
        {
          "code": 6210,
          "path": "Expenses:Marketing:GoogleAds",
          "name": "Google Ads",
          "is_postable": true
        },
        {
          "code": 6900,
          "path": "Expenses:Depreciation:OfficeEquipment",
          "name": "Depreciation — Office Equipment",
          "is_postable": true
        }
      ]
    },
    {
      "slug": "Biz2",
      "type": "business",
      "functional_currency": "THB",
      "accounts": [
        {
          "code": 1110,
          "path": "Assets:Bank:BangkokBank:Checking",
          "name": "BangkokBank Checking",
          "is_postable": true
        },
        {
          "code": 1300,
          "path": "Assets:Receivables:Customers",
          "name": "Accounts Receivable",
          "is_postable": true
        },
        {
          "code": 2100,
          "path": "Liabilities:CreditCard:Visa1234",
          "name": "Visa 1234",
          "is_postable": true
        },
        {
          "code": 3100,
          "path": "Equity:Owner:Contributions",
          "name": "Owner Contributions",
          "is_postable": true
        },
        {
          "code": 3200,
          "path": "Equity:Owner:Distributions",
          "name": "Owner Distributions",
          "is_postable": true
        },
        {
          "code": 4200,
          "path": "Income:ServiceSales:Consultancy",
          "name": "Service Sales — Consultancy",
          "is_postable": true
        },
        {
          "code": 5200,
          "path": "COGS:Subcontractors",
          "name": "Subcontractors (Direct Costs)",
          "is_postable": true
        },
        {
          "code": 6210,
          "path": "Expenses:Marketing:GoogleAds",
          "name": "Google Ads",
          "is_postable": true
        },
        {
          "code": 6400,
          "path": "Expenses:Software:SaaS:GoogleWorkspace",
          "name": "Google Workspace",
          "is_postable": true
        },
        {
          "code": 6500,
          "path": "Expenses:ProfessionalServices:Accounting",
          "name": "Accounting Fees",
          "is_postable": true
        },
        {
          "code": 6800,
          "path": "Assets:Fixed:OfficeEquipment:Printer",
          "name": "Office Equipment — Printer",
          "is_postable": true
        },
        {
          "code": 6950,
          "path": "Expenses:Depreciation:OfficeEquipment",
          "name": "Depreciation — Office Equipment",
          "is_postable": true
        }
      ]
    },
    {
      "slug": "Personal",
      "type": "personal",
      "functional_currency": "THB",
      "accounts": [
        {
          "code": 1110,
          "path": "Assets:Bank:KBank:Checking",
          "name": "KBank Checking",
          "is_postable": true
        },
        {
          "code": 2100,
          "path": "Liabilities:CreditCard:Visa1234",
          "name": "Visa 1234",
          "is_postable": true
        },
        {
          "code": 4300,
          "path": "Income:OtherIncome",
          "name": "Other Income",
          "is_postable": true
        },
        {
          "code": 6100,
          "path": "Expenses:Food:Fruit:Apples",
          "name": "Food — Fruit — Apples",
          "is_postable": true
        },
        {
          "code": 6120,
          "path": "Expenses:Household:Kitchen:Towels",
          "name": "Household — Kitchen — Towels",
          "is_postable": true
        },
        {
          "code": 6150,
          "path": "Expenses:Subscriptions:Entertainment:Netflix",
          "name": "Subscriptions — Entertainment — Netflix",
          "is_postable": true
        },
        {
          "code": 9001,
          "path": "Transfers:FromBiz1",
          "name": "Transfers From Biz1",
          "is_postable": true
        },
        {
          "code": 9002,
          "path": "Transfers:ToBiz1",
          "name": "Transfers To Biz1",
          "is_postable": true
        }
      ]
    }
  ]
}
```

> Note: Codes 9001+ for Personal `Transfers:*` are outside the standard class ranges by design (non‑P\&L, for tracking only). Implementers may disable them or map them to Assets if needed.

---

## 12) Validation & Business Rules (Engine)

- **Tree integrity**: Parent must exist and be `is_postable=false` if it has children.
- **Uniqueness**: `(entity, path)` and `(entity, code)` unique.
- **Posting guardrails**: Block cross‑entity lines; block postings to non‑leaf accounts; block class/code mismatch.
- **VAT guardrails**: If `line.tags.tax=VAT` and `line.tags.direction=output`, must post to `Liabilities:Tax:VAT:Output`; if `input`, must post to `Assets:Tax:VAT:Input`.
- **Inventory policy**: If item `sku` is specified, enforce posting to Inventory/COGS per entity policy (periodic/perpetual).
- **Period locks**: Disallow edits in locked periods unless admin override.

---

## 13) Dimensions / Tags (Recommended Keys)

- `Project` (e.g., `FilmA`), `Client` (e.g., `AcmeCo`), `Location` (e.g., `TH-BKK`), `Campaign` (e.g., `BlackFriday2025`), `PaymentMethod` (e.g., `Card:Visa1234`, `Bank:KBank`), `SKU`, `VATRate`.
- Store on **journal lines**.

---

## 14) Example Journal Patterns

**Card purchase (Biz1, Google Ads, with VAT input 7%)**

- Dr `Biz1:Expenses:Marketing:GoogleAds` — 1,000.00 THB
- Dr `Biz1:Assets:Tax:VAT:Input` — 70.00 THB
- Cr `Biz1:Liabilities:CreditCard:Visa1234` — 1,070.00 THB

**Stripe sale (Biz1, TShirt)**

- Dr `Biz1:Assets:Clearing:Stripe` — 1,000.00 THB
- Cr `Biz1:Income:ProductSales:TShirts` — 1,000.00 THB
- Fee settlement (when reported):

  - Dr `Biz1:Expenses:Fees:Stripe` — 30.00 THB
  - Cr `Biz1:Assets:Clearing:Stripe` — 30.00 THB

- Payout to bank:

  - Dr `Biz1:Assets:Bank:BangkokBank:Checking` — 970.00 THB
  - Cr `Biz1:Assets:Clearing:Stripe` — 970.00 THB

**Owner contribution (Personal pays Biz1 expense)**

- In Biz1:

  - Dr `Expenses:*`
  - Cr `Equity:Owner:Contributions`

- Optional in Personal:

  - Dr `Transfers:ToBiz1`
  - Cr `Assets:Bank:*`

**Owner draw (Biz2 pays personal)**

- In Biz2:

  - Dr `Equity:Owner:Distributions`
  - Cr `Assets:Bank:*`

- Optional in Personal:

  - Dr `Assets:Bank:*`
  - Cr `Transfers:FromBiz2`

---

## 15) Depreciation Policy (Baseline)

- **Capitalization threshold**: configurable per entity (default THB 10,000).
- **Method**: Straight‑line by default (configurable).
- **Accounts**:

  - Cost at `Assets:Fixed:*`
  - Accumulated at `ContraAssets:AccumDep:*` (optional)
  - Expense to `Expenses:Depreciation:*`

---

## 16) Multi‑Currency Policy (Baseline)

- Journal lines accept `currency` and optional `fx_rate` to functional.
- Realized FX on settlement goes to `Income/Expenses:FXGainsLosses`.
- Revaluation creates adjusting journals at period‑end.

---

## 17) Access Control / RBAC (Minimum)

- **Reader**: view CoA and journals.
- **Poster**: create/edit journals (unlocked periods only).
- **Account Admin**: manage accounts, codes, locks.
- **Entity Admin**: close periods, revaluation, VAT remittance.
- Permissions are **per entity**.

---

## 18) Versioning & Migrations

- Maintain `coa_versions(entity_id, version, applied_at)`.
- Account renames/merges tracked via `account_migrations(entity_id, from_account_id, to_account_id, reason, date)`.
- Disallow deletion of accounts with postings; mark `is_active=false` and map to replacement.

---

## 19) Testing Checklist

- Create entities and seed CoA; ensure uniqueness and class/code validation.
- Post sample journals incl. VAT, inventory, FX, depreciation; verify balances.
- Cross‑entity guardrails and owner flows.
- Period lock behavior.
- API idempotency and error messaging.

---

## 20) Reporting (Baseline)

- Trial Balance (per entity, period filter).
- P\&L by period, with dimension breakdowns.
- Balance Sheet.
- VAT report: input vs output; remittance calculation.
- Cashflow (direct/indirect configurable).

---

## 21) Implementation Notes

- Prefer **leaf‑only postings** for clean aggregation.
- Keep CoA **lean**; use **dimensions/tags** for analytics.
- Enforce **code‑class linkage** and **entity isolation** at DB and service layer.
- Provide sensible **defaults** but allow entity‑specific overrides (e.g., VAT rate, capitalization threshold).

---

## 22) Appendix — Quick Reference Example Trees (Condensed)

**Biz1 (Products)**

- Assets: Bank\:BangkokBank\:Checking; Current\:Inventory; Tax\:VAT\:Input; Clearing\:Stripe
- Liabilities: CreditCard\:Visa1234; Tax\:VAT\:Output
- Equity: Owner:{Contributions, Distributions}
- Income: ProductSales\:TShirts
- COGS: Merchandise\:TShirts; Shipping; MerchantFees
- Expenses: Marketing:{FacebookAds, GoogleAds}; Software\:SaaS:{GoogleWorkspace, Figma}; Depreciation\:OfficeEquipment

**Biz2 (Services)**

- Assets: Bank\:BangkokBank\:Checking; Receivables\:Customers; Tax\:VAT\:Input
- Liabilities: Payables\:Vendors; CreditCard\:Visa1234; Tax\:VAT\:Output
- Equity: Owner:{Contributions, Distributions}
- Income: ServiceSales\:Consultancy
- COGS: Subcontractors (optional)
- Expenses: Marketing\:GoogleAds; Software\:SaaS\:GoogleWorkspace; ProfessionalServices\:Accounting; Fixed\:OfficeEquipment\:Printer (asset) + Depreciation

**Personal**

- Assets: Bank\:KBank\:Checking
- Liabilities: CreditCard\:Visa1234
- Income: Salary; OtherIncome
- Expenses: Food\:Fruit\:Apples; Household\:Kitchen\:Towels; Subscriptions\:Entertainment\:Netflix
- Transfers: FromBiz1; ToBiz1 (optional)

---

**End of Spec v1.0**
