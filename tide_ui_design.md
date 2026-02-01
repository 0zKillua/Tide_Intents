# Tide Protocol: Frontend UI Design Document

> [!NOTE]
> **Design Philosophy**: Professional, Institutional-Grade, Fluid.
> The interface should feel like a Bloomberg Terminal for DeFi—dense with data but clear in hierarchy.

## 1. Visual Identity & Design System

### 1.1 Theme: "Deep Ocean"

A dark mode-first interface using deep blues and energetic Cyans for actions.

**Color Palette**

- **Backgrounds**:
  - `Midnight Depth`: `#02040A` (Main Background)
  - `Abyssal Plain`: `#0D111C` (Card/Surface)
  - `Surface Level`: `#1A2235` (Hover/Active)
- **Primary Accents**:
  - `Electric Cyan`: `#00F2EA` (Primary Action / Confirm)
  - `Tide Blue`: `#2979FF` (Secondary / Links)
- **Semantic Colors**:
  - `Growth Green`: `#00E396` (Positive / Lend APY)
  - `Alert Amber`: `#FEB019` (Warnings / High LTV)
  - `Liquidate Red`: `#FF4560` (Errors / Danger)

### 1.2 Typography

- **Headings**: _Inter_ (Weight: 700/600) — Sharp, modern sans-serif.
- **Body**: _Inter_ (Weight: 400/500) — Highly readable.
- **Numbers/Data**: _JetBrains Mono_ or _Roboto Mono_ — Monospace for financial precision.

### 1.3 Components

- **Cards**: Minimal borders (`1px solid #1A2235`), subtle glassmorphism on active elements.
- **Buttons**:
  - _Primary_: Gradient Cyan-to-Blue background, black text.
  - _Secondary_: Transparent with Cyan border.
- **Inputs**: Heavy inputs with integrated token selectors and "Max" buttons.

---

## 2. Information Architecture

### Navigation (Sidebar or Top Bar)

1.  **Dashboard** (Home) - User's active loans, total lending, net APY.
2.  **Market: Lend** (Order Book) - View `BorrowRequests` to fill.
3.  **Market: Borrow** (Order Book) - View `LendOffers` to fill.
4.  **My Intents** - Manage open offers/requests.
5.  **Analytics** - Protocol-wide stats.

---

## 3. Key Views & Wireframes

### 3.1 Dashboard (Home)

**"Your Command Center"**

- **Top Summary Row**:
  - Net APY (Green ticker)
  - Total Supplied (USD value)
  - Total Borrowed (USD value)
  - Health Factor (Gauge chart)
- **Active Loans Table**:
  - Columns: Asset, Principal, Accrued Interest, Debt, LTV Bar, Time Remaining.
  - Actions: `Repay`, `Add Collateral`, `View Note` (NFT).
- **Active Lending Table**:
  - Columns: Borrower (masked), Amount, APR, Earned Interest, Claimable.
  - Actions: `Claim` (if repaid), `Sell Note` (future).

### 3.2 Market: Lend (The "Taker" View)

**"Earn Fixed Yield Instantly"**

- **Header**: Filter by Asset (USDC, SUI, etc.), Duration, Min APR.
- **Order Book (List of BorrowRequests)**:
  - Sortable list of open requests waiting to be filled.
  - _Row Data_:
    - **Collateral**: 100 SUI
    - **Requesting**: 500 USDC
    - **LTV**: 65% (Green)
    - **APR**: 8%
    - **Duration**: 14d
  - _Action Column_: `Fill Request` button.
- **Create Intent (Maker)**:
  - Floating Action Button (FAB) or Top Right Button: "Create Custom Lend Offer".
  - _Modal_: "I want to lend [Amount] at min [Rate]%" -> Posts `LendOffer`.

### 3.3 Market: Borrow

**"Access Liquidity on Your Terms"**

- **Header**: Filter by Collateral Type.
- **Order Book (List of LendOffers)**:
  - _Row Data_:
    - **Available**: 50,000 USDC
    - **Max LTV**: 80%
    - **Min APR**: 6%
    - **Max Duration**: 30d
  - _Action Column_: `Borrow` button.
- **Create Intent (Maker)**:
  - Button: "Create Custom Borrow Request".
  - _Modal_: "I want to borrow [Amount] against [Collateral] at max [Rate]%" -> Posts `BorrowRequest`.

### 3.4 Modal: Fill Transaction

When clicking `Fill Request` (Lender Taker flow):

1.  **Review**:
    - "You are lending **500 USDC**."
    - "You receive **LoanNote #123** secured by **100 SUI**."
    - "Expected Profit: **1.53 USDC** (8% APR / 14d)."
2.  **Safety Check**:
    - Show current Oracle Price of SUI.
    - Show Liquidation Price.
3.  **Action**: `Approve USDC` -> `Confirm Fill`.

### 3.5 Modal: Repay Loan

1.  **Status**:
    - "Principal: 500 USDC"
    - "Interest: 1.53 USDC"
    - "Total Due: 501.53 USDC"
2.  **Action**: `Repay Full Amount`.
3.  **Result**: "Loan Repaid. 100 SUI collateral returned to your wallet."

---

## 4. User Journeys

### Flow A: The "Lazy" Lender (Taker)

1.  Connect Wallet.
2.  Go to **Market: Lend**.
3.  Filter for "High Yield" (Sort by APR desc).
4.  See a request: "Borrow 1000 USDC @ 10% APR against SUI".
5.  Click `Fill`.
6.  Confirm Tx.
7.  **Done**. (LoanNote received, interest accruing).

### Flow B: The "Patient" Borrower (Maker)

1.  Connect Wallet.
2.  Click **Create Custom Borrow Request**.
3.  Input: "Borrow 5000 USDC".
4.  Input: "Collateral 3000 SUI".
5.  Input: "Max Rate 5%".
6.  Click `Post Request`.
7.  **Wait**: Intent is live. Direct matcher or Solver bot fills it later.

---

## 5. Technology Stack (Frontend)

- **Framework**: React/ Next.js 14+ (App Router).
- **Styling**: TailwindCSS (with extensive custom config for "Deep Ocean" theme).
- **State**: TanStack Query (for data fetching).
- **Sui Integration**: `@misten/dapp-kit`.
- **Components**: Shadcn/UI (Customized).
- **Icons**: Lucide React.
