# ARCHITECTURE.md — Trailmark Guild Protocol
## System Design, Data Models & Agent Prompts

---

## SYSTEM LAYERS

```
┌─────────────────────────────────────────────────────────┐
│                    EXTERNAL WORLD                        │
│   City Systems   Other DAOs   Agentic Programs   Builders│
└────────────────────┬────────────────────────────────────┘
                     │  Trailmark Protocol API
┌────────────────────▼────────────────────────────────────┐
│              TRAILMARK PROTOCOL LAYER                    │
│  Credential Schema │ Reputation Graph │ Escrow Spec      │
│  Tier Definitions  │ Attestation Std  │ Agent Spec       │
└────────────────────┬────────────────────────────────────┘
                     │  reads / writes
┌────────────────────▼────────────────────────────────────┐
│       TRAILMARK GUILD (Fort Worth Application)           │
│  Marketplace │ DAO Treasury │ AI Agents │ UI/UX          │
└─────────────────────────────────────────────────────────┘
```

**Key principle:** The Protocol layer is open infrastructure. The Guild is the first app built on it. Agents interact with the Protocol through declared, bounded capability scopes — no agent can execute a financial transaction without a human operator in the loop.

---

## DATABASE SCHEMA (Supabase / PostgreSQL)

### workers
```sql
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT,
  bio TEXT,
  location TEXT,               -- Fort Worth neighborhood or ZIP
  category TEXT,               -- primary category
  subcategory TEXT,
  tier INTEGER DEFAULT 0,      -- 0–4, computed
  completion_rate INTEGER DEFAULT 0,  -- 0–100
  quality_score INTEGER DEFAULT 0,    -- 0–500
  peer_weight INTEGER DEFAULT 0,
  jury_score INTEGER DEFAULT 0,
  mentor_score INTEGER DEFAULT 0,
  dao_score INTEGER DEFAULT 0,
  tdlr_license_number TEXT,
  tdlr_verified BOOLEAN DEFAULT FALSE,
  tdlr_expires_at TIMESTAMPTZ,
  profile_embedding VECTOR(1536),  -- for semantic matching
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### jobs
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_wallet TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  budget_eth NUMERIC,
  tier_required INTEGER DEFAULT 0,
  location TEXT,
  status TEXT DEFAULT 'open',  -- open | active | complete | disputed | cancelled
  worker_wallet TEXT,          -- assigned worker
  contract_address TEXT,       -- deployed escrow contract
  job_embedding VECTOR(1536),  -- for semantic matching
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### milestones
```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  index INTEGER NOT NULL,      -- milestone order (0-indexed, matches contract)
  name TEXT NOT NULL,
  description TEXT,
  amount_eth NUMERIC,
  status TEXT DEFAULT 'pending',  -- pending | complete | disputed
  completed_at TIMESTAMPTZ,
  tx_hash TEXT,                -- release tx hash
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### attestations
```sql
CREATE TABLE attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_wallet TEXT NOT NULL,
  attester_wallet TEXT NOT NULL,
  credential_type TEXT NOT NULL,  -- LICENSE | CERTIFICATION | PEER_ATTESTATION | WORK_RECORD
  category TEXT,
  subcategory TEXT,
  external_ref TEXT,           -- TDLR license number, cert ID, job URI
  metadata_uri TEXT,           -- IPFS link
  stake_amount NUMERIC DEFAULT 0,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  eas_uid TEXT,                -- EAS attestation UID (if written on-chain)
  is_on_chain BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### job_applications
```sql
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  worker_wallet TEXT NOT NULL,
  cover_note TEXT,
  status TEXT DEFAULT 'pending',  -- pending | accepted | rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## SMART CONTRACT ARCHITECTURE

### TrailmarkEscrow.sol

Deploy on Base Sepolia for hackathon. One contract instance per job.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TrailmarkEscrow {
    struct Milestone {
        string name;
        uint256 amount;
        MilestoneStatus status;
    }

    enum MilestoneStatus { Pending, Complete, Disputed }
    enum JobStatus { Active, Complete, Cancelled }

    bytes32 public jobId;
    address public client;
    address public worker;
    address public dao;           // multisig for dispute resolution
    uint256 public protocolFee;   // basis points (250 = 2.5%)
    JobStatus public jobStatus;
    Milestone[] public milestones;

    event MilestoneConfirmed(uint8 index, uint256 amount, address worker);
    event DisputeRaised(uint8 index, address initiator);
    event DisputeResolved(uint8 index, bool workerPrevailed);

    constructor(
        bytes32 _jobId,
        address _worker,
        address _dao,
        string[] memory _milestoneNames,
        uint256[] memory _milestoneAmounts
    ) payable {
        // Validate total matches msg.value
        // Initialize milestones
        // Set parties
    }

    function confirmMilestone(uint8 index) external {
        require(msg.sender == client, "Only client");
        require(milestones[index].status == MilestoneStatus.Pending);
        milestones[index].status = MilestoneStatus.Complete;
        uint256 fee = milestones[index].amount * protocolFee / 10000;
        payable(worker).transfer(milestones[index].amount - fee);
        payable(dao).transfer(fee);
        emit MilestoneConfirmed(index, milestones[index].amount, worker);
    }

    function disputeMilestone(uint8 index, string calldata evidence) external {
        require(msg.sender == client || msg.sender == worker);
        milestones[index].status = MilestoneStatus.Disputed;
        emit DisputeRaised(index, msg.sender);
    }

    function resolveDispute(uint8 index, bool workerPrevails) external {
        require(msg.sender == dao, "Only DAO");
        if (workerPrevails) {
            payable(worker).transfer(milestones[index].amount);
        } else {
            payable(client).transfer(milestones[index].amount);
        }
        emit DisputeResolved(index, workerPrevails);
    }
}
```

### Deployment

- Network: Base Sepolia (`chainId: 84532`)
- RPC: `https://sepolia.base.org`
- After deployment: store `contract_address` in Supabase `jobs` table
- ABI: export and store in `/src/lib/contracts/TrailmarkEscrow.json`

---

## EAS (Ethereum Attestation Service)

### Schema Registration

Register `TrailmarkCredential` schema on EAS (Base Sepolia):
```
address worker_address, uint8 category, string subcategory, uint8 credential_type, uint256 expires_at, string external_ref, string metadata_uri, uint256 stake_amount
```

Store the Schema UID in env: `NEXT_PUBLIC_EAS_SCHEMA_UID`

### Reading Attestations

Use EAS GraphQL API:
```graphql
query GetAttestations($recipient: String!) {
  attestations(
    where: {
      recipient: { equals: $recipient }
      schemaId: { equals: "YOUR_SCHEMA_UID" }
    }
  ) {
    id
    attester
    recipient
    data
    time
    expirationTime
    revoked
  }
}
```

Endpoint (Base Sepolia): `https://base-sepolia.easscan.org/graphql`

---

## AI AGENT IMPLEMENTATION

### Shared Setup

```typescript
// src/lib/agents/client.ts
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = 'claude-sonnet-4-20250514';
```

### Agent Tool Definitions

```typescript
// src/lib/agents/tools.ts

export const trailblazerTools = [
  {
    name: 'get_categories',
    description: 'Get the list of available work categories and subcategories',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'check_tdlr_license',
    description: 'Verify a TDLR license number and return license details',
    input_schema: {
      type: 'object',
      properties: {
        license_number: { type: 'string', description: 'TDLR license number to verify' }
      },
      required: ['license_number']
    }
  },
  {
    name: 'get_tier_requirements',
    description: 'Get the requirements to reach a specific tier',
    input_schema: {
      type: 'object',
      properties: {
        tier: { type: 'integer', description: 'Tier level (0–4)' }
      },
      required: ['tier']
    }
  },
  {
    name: 'suggest_vouching_candidates',
    description: 'Find existing network members who could vouch for this worker',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        location: { type: 'string' }
      },
      required: ['category', 'location']
    }
  }
];

export const scoutTools = [
  {
    name: 'translate_rfp',
    description: 'Parse and summarize a Bonfire RFP into plain language',
    input_schema: {
      type: 'object',
      properties: {
        rfp_text: { type: 'string', description: 'Raw RFP text or URL content' }
      },
      required: ['rfp_text']
    }
  },
  {
    name: 'check_worker_eligibility',
    description: 'Check if a worker meets the requirements for a specific RFP',
    input_schema: {
      type: 'object',
      properties: {
        worker_wallet: { type: 'string' },
        rfp_requirements: { type: 'object' }
      },
      required: ['worker_wallet', 'rfp_requirements']
    }
  }
];
```

---

## AGENT SYSTEM PROMPTS

### Trailblazer (Onboarding Agent)

```
You are the Trailblazer, the onboarding agent for Trailmark Guild — a decentralized labor marketplace in Fort Worth, Texas that gives workers on-chain reputation they own and bond coverage for jobs.

Your job is to guide a new worker through registration in a friendly, direct conversation. You are their first point of contact with the network.

WHAT YOU DO:
1. Ask the worker to describe what they do for work in their own words
2. Use get_categories() to identify the best category and subcategory match
3. If their category requires a license (electrical, plumbing, HVAC, roofing): ask for their TDLR license number and use check_tdlr_license() to verify it
4. Use get_tier_requirements() to explain exactly where they start and what they need to advance
5. Use suggest_vouching_candidates() to identify 3–5 network members who could vouch for them
6. Summarize their profile and next steps clearly

YOUR TONE:
- Direct and practical — you respect that these are working people with limited time
- Specific, not generic — never say "keep working hard." Say "You need 3 more verified jobs and 2 peer attestations from Tier 1+ workers in Fort Worth."
- Encouraging without being patronizing
- Fort Worth-specific — you know the local trades, neighborhoods, and city context

WHAT YOU CANNOT DO:
- You cannot submit any forms or write any data — you populate information for the worker to confirm
- You cannot verify claims that aren't backed by the TDLR API
- You cannot promise specific job outcomes

Keep responses concise. Workers are often on their phones between jobs.
```

### Scout (Bid Intelligence Agent)

```
You are the Scout, the bid intelligence agent for Trailmark Guild in Fort Worth, Texas.

Your job is to translate complex procurement language into plain English, check worker eligibility, and surface opportunities workers would otherwise miss — particularly M/WBE subcontracting requirements in city contracts.

WHEN GIVEN AN RFP:
1. Summarize in 3–4 sentences: what they want, what the budget is, when it's due, and who can bid
2. Identify any M/WBE subcontracting requirements (percentage and dollar amounts)
3. List the specific credentials, bonds, or certifications required
4. Check worker eligibility using check_worker_eligibility() if a worker wallet is provided
5. Flag any missing credentials clearly: "You are missing: [specific item]. Here is how to get it: [specific path]."

YOUR TONE:
- No jargon. If you must use a procurement term, define it immediately.
- Specific dollar amounts always. "30% M/WBE requirement on an $800K contract = $240K in subcontracting opportunity."
- Actionable. Every output should end with a clear next step.

WHAT YOU CANNOT DO:
- You cannot submit bids on the worker's behalf
- You cannot guarantee eligibility — the final determination is the GC's or city's
```

### Pathfinder (Career Pathway Agent)

```
You are the Pathfinder, the career pathway agent for Trailmark Guild in Fort Worth, Texas.

Your job is to give workers a specific, personalized roadmap to their next tier based on their actual on-chain profile. You are read-only — you never write data.

WHEN GIVEN A WORKER PROFILE:
1. State their current tier and the exact gap to the next tier in specific numbers
   - BAD: "Keep completing jobs and getting attestations"
   - GOOD: "You need 3 more verified jobs (currently 7, need 10) and 1 more peer attestation from a Tier 2 member in your category (currently have 2, need 3)"
2. List any active training bounties they qualify for right now
3. Identify under-supplied categories in the Fort Worth network where their existing skills would transfer with minimal additional credentialing
4. If they are Tier 0 or 1: identify Tier 2+ workers in their category who are actively supervising apprentices

YOUR TONE:
- Precise and data-driven
- No empty encouragement — just facts and next steps
- Acknowledge constraints honestly: "The peer attestation requirement is the binding constraint right now. Your job count is fine."
```

---

## MULTI-AGENT WORKFLOW (for reference)

### Workflow A: New Worker → First Job
```
Trailblazer: detect category → TDLR verify → EAS attestation (pending human sign)
  → identify vouching candidates → pass profile to Scout
Scout: match open jobs to worker profile → surface top 4 by fit score
  → worker selects → Wrangler reviews scope
Worker confirms bid → escrow deployed → job begins
```

### Workflow B: Bonfire RFP → Subcontracting Opportunity
```
Scout: detects Bonfire award → reads M/WBE requirement
  → finds matching Tier 2+ workers → notifies with RFP summary
Pathfinder (for workers who don't qualify yet):
  → shows exact gap → surfaces training bounties
Scout (for qualified workers): drafts subcontracting bid proposal
  → worker reviews and submits independently
```

---

## ENVIRONMENT VARIABLES NEEDED

```bash
# Anthropic
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Privy (wallet connect)
NEXT_PUBLIC_PRIVY_APP_ID=

# Base / Ethereum
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=  # after deployment

# EAS
NEXT_PUBLIC_EAS_CONTRACT_ADDRESS=0x4200000000000000000000000000000000000021  # Base Sepolia
NEXT_PUBLIC_EAS_SCHEMA_UID=  # after schema registration

# TDLR
TDLR_API_BASE_URL=https://www.tdlr.texas.gov/tools/api
```

---

## TDLR API INTEGRATION

Texas Dept of Licensing & Regulation public license lookup.

```typescript
// src/lib/tdlr.ts
export async function verifyTDLRLicense(licenseNumber: string) {
  const response = await fetch(
    `${process.env.TDLR_API_BASE_URL}/license/${licenseNumber}`
  );
  
  if (!response.ok) {
    return { valid: false, error: 'License not found' };
  }
  
  const data = await response.json();
  
  return {
    valid: data.status === 'Active',
    holderName: data.holderName,
    licenseType: data.licenseType,
    expiresAt: data.expirationDate,
    licenseNumber: data.licenseNumber,
  };
}

// FALLBACK for hackathon if API has issues:
// Return mock data with realistic structure
export function mockTDLRResponse(licenseNumber: string) {
  return {
    valid: true,
    holderName: "Demo Worker",
    licenseType: "Electrical Contractor",
    expiresAt: "2026-12-31",
    licenseNumber,
  };
}
```

---

## VOCDONI SDK INTEGRATION (DAO Vote — supporting feature)

```typescript
// src/lib/vocdoni.ts
import { VocdoniSDKClient, Election, PlainCensus } from '@vocdoni/sdk';

export async function createGovernanceProposal({
  title,
  description,
  options,
  voterWallets,
}: {
  title: string;
  description: string;
  options: string[];
  voterWallets: string[];
}) {
  const client = new VocdoniSDKClient({
    env: 'stg',  // staging for hackathon
    wallet: daoSigner,
  });

  const census = new PlainCensus();
  voterWallets.forEach(addr => census.add(addr));

  const election = Election.from({
    title,
    description,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    census,
    questions: [{
      title,
      description,
      choices: options.map((option, i) => ({ title: option, value: i }))
    }]
  });

  const electionId = await client.createElection(election);
  return electionId;
}
```

---

## BONFIRE INTEGRATION (Scout Agent)

Fort Worth uses Bonfire for city procurement. Public listings are accessible without API key.

```typescript
// src/lib/bonfire.ts
// Phase 1: scrape public listings (no API required)
// Target: https://fortworth.bonfirehub.com/portal/?tab=openOpportunities

export async function fetchBonfireListings() {
  // Puppeteer/Playwright for JS-rendered content
  // Or use fetch if listings are server-rendered
  // Extract: title, posted date, closing date, category, estimated value, M/WBE requirements
}

// For hackathon: use sample RFP text — paste into Scout agent directly
// Real scraping can be a post-hackathon task
```

---

## COMPONENT PATTERNS (from existing codebase)

Based on code found in the project:

- Use `requireAuth()` for protected routes
- Use `actionSuccess()` / `actionError()` for server action returns
- Use `activitiesService.trackActivity()` for activity logging (non-blocking, use `.catch(() => {})`)
- Supabase client available as `db`
- Platform routes live in `src/app/(platform)/`
- Shared components in `src/shared/components/`

### Reputation/Tier Display Pattern (from passport-stamps component)
The project already has a stamps system. Tier badges should follow similar visual language — use colored borders and backgrounds to distinguish tiers:
- Tier 0: gray
- Tier 1: blue  
- Tier 2: green
- Tier 3: gold/amber
- Tier 4: purple (Guild Master)
