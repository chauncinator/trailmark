# Trailmark Guild

**A decentralized labor marketplace that gives Fort Worth workers portable, on-chain reputation and escrow-backed payment protection.**

Built for the Trailmark Guild Hackathon

---

## The Problem

Workers in traditional labor markets—tradespeople, gig workers, tutors, digital freelancers—face three critical barriers:

1. **Reputation doesn't travel.** A master electrician with 20 years of stellar work on one platform starts from zero on another. Their reputation is locked in silos, owned by the platform, not the worker.

2. **Payment risk.** Workers complete milestones but wait weeks for payment, face arbitrary disputes, or get stiffed entirely. Escrow exists in traditional systems, but it's opaque and controlled by intermediaries.

3. **Procurement barriers.** Fort Worth city contracts often include M/WBE (Minority/Women-Owned Business Enterprise) subcontracting requirements, but the RFPs are written in dense procurement language that filters out qualified workers who could do the work.

**Trailmark Guild solves this** by putting reputation on-chain (workers own it, take it anywhere), backing every job with smart contract escrow (payment is guaranteed and transparent), and using AI agents to translate complex city RFPs into plain language and match workers to opportunities they'd otherwise miss.

---

## What It Does

### For Workers

- **Own your reputation**: Complete jobs, earn peer attestations, verify licenses on-chain. Your reputation is yours—portable across any platform that reads the Trailmark Protocol.
- **Get paid automatically**: Milestone-based escrow releases payment when the client confirms completion. No intermediaries, no waiting 30 days for an invoice to process.
- **Access city opportunities**: The Scout AI agent translates dense Bonfire RFPs into plain English, checks your eligibility, and flags M/WBE subcontracting requirements you qualify for.
- **See your path forward**: The Pathfinder AI agent shows you the exact gap to your next tier—not generic advice like "keep working hard," but specific numbers: "You need 3 more verified jobs and 2 peer attestations from Tier 2+ workers in your category."

### For Clients

- **Hire with confidence**: Filter workers by tier, verified credentials, category, and neighborhood. Every worker's reputation is backed by on-chain attestations.
- **Escrow-backed payments**: Fund jobs through smart contracts on Base. Payments release milestone-by-milestone as work is confirmed.
- **Local, verified talent**: All workers are Fort Worth-based with verified TDLR licenses (for licensed trades) and neighborhood-specific expertise.

### For the Fort Worth Economy

- **M/WBE participation**: The Scout agent actively surfaces subcontracting opportunities in city contracts, lowering barriers for minority and women-owned businesses.
- **Local wealth retention**: Payments flow directly from client to worker wallets—no platform taking 20-30% cuts.
- **Trust infrastructure**: Peer attestations and staked vouching create a self-regulating network where reputation has real financial weight.

---

## Technology Stack

### Blockchain & Smart Contracts
- **[Base Sepolia](https://base.org)** (Ethereum L2): Escrow contracts with milestone-based payment releases
- **[Ethereum Attestation Service (EAS)](https://attest.sh)**: On-chain credential attestations (licenses, peer vouches, work records)
- **[Privy](https://privy.io)**: Wallet authentication and embedded wallet support
- **[Vocdoni](https://vocdoni.io)**: Anonymous DAO governance voting

### AI & Automation
- **[Anthropic Claude API](https://anthropic.com)** (Sonnet 4.5): Powers three specialized agents:
  - **Trailblazer**: Conversational onboarding—detects worker category, verifies TDLR licenses, explains tier requirements
  - **Scout**: Translates Bonfire city RFPs into plain language, checks worker eligibility, surfaces M/WBE opportunities
  - **Pathfinder**: Career roadmap—shows exact tier gaps, matches workers to open roles, suggests training paths
- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io)**: External tool integration for AI agents to query worker profiles, job listings, and reputation data

### Application Layer
- **[Next.js 16](https://nextjs.org)** (App Router): React framework with server components and streaming
- **[Supabase](https://supabase.com)**: PostgreSQL database, real-time subscriptions, vector embeddings for semantic job matching
- **[Tailwind CSS](https://tailwindcss.com)**: Utility-first styling
- **[TypeScript](https://typescriptlang.org)**: Type-safe development

### External Integrations
- **TDLR API**: Texas Department of Licensing and Regulation—verifies electrician, plumber, HVAC, and roofing licenses
- **Bonfire**: Fort Worth's city procurement platform (RFP scraping for Scout agent)

---

## Local Setup

### Prerequisites

- **Node.js 18+** (Node.js 24 LTS recommended)
- **npm**, **pnpm**, or **bun**
- **Git**
- A **Base Sepolia testnet wallet** with test ETH ([get faucet here](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd trailmark
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Anthropic API (required for AI agents)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Privy (required for wallet authentication)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Base Sepolia (blockchain)
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=  # deployed contract address (see below)

# EAS (Ethereum Attestation Service)
NEXT_PUBLIC_EAS_CONTRACT_ADDRESS=0x4200000000000000000000000000000000000021
NEXT_PUBLIC_EAS_SCHEMA_UID=  # your schema UID after registration

# TDLR API (Texas license verification)
TDLR_API_BASE_URL=https://www.tdlr.texas.gov/tools/api
```

**Need help getting API keys?**

- **Anthropic API**: [Sign up at console.anthropic.com](https://console.anthropic.com)
- **Supabase**: [Create a project at supabase.com](https://supabase.com/dashboard)
- **Privy**: [Get an app ID at privy.io](https://privy.io)
- **Base Sepolia RPC**: Public endpoint provided above (no key needed)
- **EAS Schema**: Register the Trailmark credential schema at [easscan.org](https://base-sepolia.easscan.org) (see `ARCHITECTURE.md` for schema details)

### 3. Database Setup

Run the Supabase migrations:

```bash
# If you have Supabase CLI installed:
supabase db push

# Otherwise, copy the schema from /supabase/migrations and run in Supabase SQL Editor
```

**Seed data** (optional but recommended for demo):

```bash
# Run the seed script to create sample Fort Worth jobs
npm run seed
```

### 4. Smart Contract Deployment (Optional)

If you want to deploy your own escrow contract:

```bash
cd contracts
npm install
npx hardhat run scripts/deploy.js --network base-sepolia
```

Copy the deployed contract address to `NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS` in `.env.local`.

**For hackathon judging:** A pre-deployed contract address is included in the repo for quick setup.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Key Features & Demo Flow

### 1. Worker Onboarding (Trailblazer AI Agent)

- Navigate to `/onboarding`
- Connect wallet via Privy
- Chat with the Trailblazer agent:
  - Describe your work in plain language
  - Agent detects your category and subcategory
  - If you're in a licensed trade (electrical, plumbing, HVAC), provide your TDLR license number
  - Agent verifies license via Texas TDLR API and issues an on-chain attestation
  - Get assigned to Tier 0 and see your exact roadmap to Tier 1

### 2. Job Marketplace

- Browse open jobs at `/jobs`
- Filter by category, tier requirement, Fort Worth neighborhood, budget
- View job details: milestones, client info, required credentials
- Apply with a cover note

### 3. Escrow-Backed Payments

- Client accepts your application
- Client funds the job by depositing ETH into the escrow smart contract
- Milestone structure is defined on-chain (e.g., "Materials inspection: 0.03 ETH", "Final inspection: 0.05 ETH")
- When you complete a milestone, client confirms → payment auto-releases to your wallet
- Transparent, trustless, instant

### 4. On-Chain Reputation Profile

- View any worker's profile at `/profile/[wallet-address]`
- See:
  - Tier badge (Apprentice → Journeyman → Master → Expert → Guild Master)
  - Completion rate, quality score, peer attestations
  - Verified credentials (TDLR license, peer vouches, job history)
  - EAS attestations (on-chain proof)

### 5. Scout AI Agent (City RFP Translation)

- Navigate to `/scout`
- Paste a Bonfire RFP URL or text
- Scout agent:
  - Summarizes the RFP in plain language
  - Checks your eligibility against tier and credentials
  - Flags M/WBE subcontracting requirements: "This is an $800K contract with a 30% M/WBE requirement = $240K in subcontracting opportunity"
  - Lists missing credentials and how to get them

### 6. Pathfinder AI Agent (Career Roadmap)

- Navigate to `/pathfinder`
- Agent reads your on-chain profile and outputs:
  - **Exact tier gap**: "You need 3 more verified jobs (currently 7, need 10) and 1 more peer attestation from a Tier 2 worker in your category"
  - Active training bounties you qualify for
  - Under-supplied categories in Fort Worth where your skills transfer

### 7. Peer Attestations

- On any worker profile, click "Vouch for this worker"
- Stake ETH to back your attestation
- If the worker fails a job dispute, your stake gets slashed (skin in the game)
- Attestations are stored on-chain via EAS

### 8. MCP Tool Integration

The app exposes Model Context Protocol tools for external AI agents:

- `trailmark_find_workers`: Search for workers by category, tier, location
- `trailmark_get_jobs`: Query open jobs with filters
- `trailmark_get_worker_profile`: Retrieve on-chain reputation data

**Demo:** Call these tools from Claude Code or any MCP-compatible agent.

---

## Architecture Highlights

### Tiered Reputation System

Workers advance through 5 tiers based on verified metrics:

- **Tier 0 (Apprentice)**: New to network, no verified jobs
- **Tier 1 (Helper)**: 3+ verified jobs, 1+ peer attestation
- **Tier 2 (Journeyman)**: 10+ verified jobs, TDLR license (if applicable), 3+ peer attestations
- **Tier 3 (Master)**: 25+ jobs, 90%+ completion rate, quality score 400+, active mentor
- **Tier 4 (Guild Master)**: 50+ jobs, 95%+ completion rate, DAO vote approval

Each tier unlocks higher-value jobs and city procurement eligibility.

### Smart Contract Escrow Flow

```
Client posts job → Worker applies → Client accepts
  → Client funds escrow (ETH locked in contract)
  → Milestones defined on-chain
  → Worker completes milestone → Client confirms
  → Smart contract auto-releases payment to worker wallet
  → Repeat for remaining milestones
  → Job complete → Reputation updated
```

No intermediaries. No payment delays. Full transparency.

### AI Agent Tool Use

All three agents use the Claude API with tool calling:

- **Trailblazer tools**: `get_categories()`, `check_tdlr_license()`, `get_tier_requirements()`, `suggest_vouching_candidates()`
- **Scout tools**: `translate_rfp()`, `check_worker_eligibility()`
- **Pathfinder tools**: `get_tier_gap()`, `find_training_bounties()`, `suggest_category_transfers()`

Agents are read-only—they populate information for human confirmation, never execute financial transactions.

---

## Social Impact

### Economic Empowerment

Workers in Fort Worth's trades and service sectors—many of whom are immigrants, women, or people of color—build reputation that they **own**. It's not locked in Thumbtack's database or Upwork's proprietary score. It's on-chain, readable by any future platform, any city system, any DAO.

### Payment Protection

A roofer who completes a job doesn't wait 45 days for an invoice to process. A tutor doesn't chase a parent for Venmo payment. The smart contract holds the funds, and release is automatic when the client confirms the milestone. This is transformative for workers living paycheck-to-paycheck.

### Barrier Reduction

Fort Worth city contracts often include requirements like:

> "Bidders must subcontract at least 25% of project value to certified M/WBE firms, with documentation of outreach to a minimum of three firms in the project category."

**Most workers don't speak this language.** The Scout agent translates it to:

> "This is a $600K streetlight project. You need to hire M/WBE subcontractors for at least $150K of the work. Here are 3 certified electrical contractors in Fort Worth you can reach out to."

That's the difference between missing an opportunity and capturing it.

### Local Wealth Retention

Platform fees on traditional marketplaces (Upwork, TaskRabbit, Thumbtack) range from 15-30%. On a $10,000 home remodel, that's $1,500-$3,000 extracted from the local economy.

Trailmark's protocol fee is 2.5%, and it flows to the DAO treasury, which funds:

- Training bounties for workers advancing tiers
- Dispute resolution (neutral jury pool)
- Open-source tooling for other cities to adopt the protocol

More money stays in Fort Worth. More wealth builds in the community.

---

## What's Next (Post-Hackathon)

### Phase 1: Fort Worth Production Launch
- Deploy to Base mainnet
- Partner with Fort Worth M/WBE certification office
- Integrate real-time Bonfire scraping
- Launch with 50 pilot workers across 5 categories

### Phase 2: Protocol Expansion
- Release Trailmark Protocol SDK for other cities
- Soulbound tier badges (ERC-5114)
- Streaming payments for recurring work (Superfluid integration)
- Event-driven reputation (immutable on-chain logs)

### Phase 3: Multi-City Network
- Austin, Dallas, Houston adopt the protocol
- Cross-city reputation portability
- Statewide TDLR integration
- Texas-wide M/WBE opportunity matching

---

## Project Structure

```
trailmark/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (platform)/      # Authenticated routes (jobs, profile, agents)
│   │   ├── onboarding/      # Worker onboarding flow
│   │   └── api/             # API routes (MCP tools, agent endpoints)
│   ├── lib/
│   │   ├── agents/          # AI agent implementations (Trailblazer, Scout, Pathfinder)
│   │   ├── contracts/       # Smart contract ABIs
│   │   ├── supabase/        # Database client & queries
│   │   └── tdlr.ts          # TDLR license verification
│   └── shared/
│       └── components/      # Reusable UI components
├── supabase/
│   └── migrations/          # Database schema
├── contracts/               # Solidity smart contracts
├── public/                  # Static assets
├── ARCHITECTURE.md          # Technical deep-dive
├── HACKATHON_SPRINT.md      # Build plan & status tracker
└── BLOCKCHAIN_MECHANICS.md  # Future enhancements (slashing, SBTs, streaming)
```

---

## License

MIT License - see LICENSE file for details

---

## Built With

Love for Fort Worth, frustration with platform monopolies, and belief that workers deserve to own their reputation.

**Questions?** Open an issue or reach out at kyle@datalof.com

---

## Acknowledgments

- Fort Worth's trades community for inspiration
- Base for fast, cheap L2 infrastructure
- Anthropic for Claude API that makes agents feel human
- Supabase for Postgres that scales
- The Trailmark Guild hackathon organizers for the deadline that shipped this
