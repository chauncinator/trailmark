# HACKATHON_SPRINT.md — Night-by-Night Task Plan
## Trailmark Guild · Deadline: Friday

**Developer availability:** Nights only (Tuesday, Wednesday, Thursday). Day job + guests during the day.
**Claude Code role:** Work autonomously during the day between check-ins. When Kyle checks in at night, show what's done and what's next.

---

## STATUS TRACKER

Update this as tasks complete. When Kyle checks in, he reads this first.

| Feature | Status | Notes |
|---|---|---|
| Privy wallet connect | ✅ Done | Provider with fallback for missing app ID |
| Worker onboarding UI | ✅ Done | Multi-step: connect → profile → category → tier |
| Category selection | ✅ Done | 5 categories with subcategories, licensed/unlicensed |
| TDLR verification flow | ✅ Done | Mock fallback for hackathon; real API call coded |
| Tier assignment logic | ✅ Done | Tier 0 start, roadmap display |
| Job marketplace browse | ✅ Done | /jobs with category filters, job cards |
| Job apply/accept flow | ✅ Done | Apply with cover note, client accept |
| Escrow funding step UI | ✅ Done | Fund escrow button, status flow |
| Escrow smart contract | ✅ Done | TrailmarkEscrow.sol written, ABI exported |
| Milestone completion | ✅ Done | Confirm milestone → auto-release, job completion |
| Auto-release to worker | ✅ Done | Milestone payout flow in UI + contract |
| Reputation profile page | ✅ Done | /profile?address=0x... with scores, credentials, tier |
| EAS attestation read | 🔄 In progress | Schema defined, read path coded, needs real UID |
| Trailblazer agent | ✅ Done | Chat UI + Claude API with tool use (categories, TDLR, tiers) |
| Scout agent (Bonfire) | ✅ Done | /scout — paste RFP → plain-language summary + eligibility check + M/WBE flagging |
| Pathfinder agent | ✅ Done | /pathfinder — tier gap analysis, matching jobs, career roadmap |
| Peer attestation UI | ✅ Done | Vouch button on worker profile with stake |
| MCP tool demo | ✅ Done | /api/mcp — trailmark_find_workers, trailmark_get_jobs, trailmark_get_worker_profile |
| DAO vote (Vocdoni) | ⬜ Not started | Post-hackathon |

Legend: ⬜ Not started · 🔄 In progress · ✅ Done · ❌ Blocked

---

## TUESDAY NIGHT — Onboarding Flow

**Goal:** A new worker can connect their wallet, describe their work, get category-matched, verify their TDLR license, and be assigned a tier. Kyle reviews and gives feedback.

### Tasks

#### T1 — Privy Wallet Connect
- Install and configure Privy in Next.js
- Create `/onboarding` route
- Wallet connect button with Privy modal
- On success: store wallet address in Supabase `workers` table
- Show connected state in UI

#### T2 — Worker Profile Creation
- After wallet connect: prompt for name, bio, location (Fort Worth neighborhood or ZIP)
- Store in Supabase

#### T3 — Category Selection UI
- Display category grid: Trades (Unlicensed), Trades (Licensed), Digital Work, Personal Services, Community Service, Civic Projects
- Sub-category selection within each
- Store selection in Supabase worker record

#### T4 — TDLR License Verification Flow
- Conditional: only show if category requires license (Trades Licensed)
- Input: TDLR license number
- Call TDLR Public API: `https://www.tdlr.texas.gov/tools/api` (verify endpoint)
- Display: license holder name, license type, expiration, active/inactive status
- On success: write EAS attestation (or mock attestation record in Supabase for hackathon)
- On failure: show clear error, allow skip with "no license" flag

#### T5 — Tier Assignment Logic
- Based on onboarding data, compute starting tier:
  - No license, no history → Tier 0
  - Valid TDLR license → eligible for Tier 2 (needs jobs + peer attestations to unlock)
  - Show worker their current tier and what they need for next tier
- Display tier badge and tier roadmap on completion

#### T6 — Trailblazer Agent (conversational onboarding)
- Chat interface on `/onboarding` page
- System prompt: see `ARCHITECTURE.md` Agent Prompts section
- Tools available to the agent:
  - `get_categories()` → returns category list
  - `check_tdlr_license(license_number)` → calls TDLR API
  - `get_tier_requirements(tier)` → returns requirements object
  - `suggest_vouching_candidates(category, location)` → queries Supabase for matching workers
- Flow: detect category from description → ask for license if needed → pre-fill forms → explain tier roadmap
- Agent cannot submit anything — it populates forms for human confirmation

**Tuesday night check-in deliverable:** Kyle should be able to walk through the full onboarding flow himself.

---

## WEDNESDAY NIGHT — Marketplace + Escrow

**Goal:** Jobs exist. A client can post one and fund it. A worker can browse, apply, accept. A milestone gets paid out. Kyle reviews and stress-tests.

### Tasks

#### W1 — Seed Data
- Create 5–10 realistic Fort Worth jobs in Supabase:
  - Mix of categories: handyman, electrical, web dev, landscaping, tutoring
  - Each with: title, description, budget, milestones array, client wallet (mock), required tier, location
- Use real Fort Worth neighborhoods: Near Southside, Magnolia, Riverside, Cultural District, TCU area

#### W2 — Job Marketplace Page
- Route: `/jobs`
- Browse open jobs with filter by: category, tier requirement, budget range, neighborhood
- Job card: title, category, budget, tier required, neighborhood, client rating
- Job detail page: full description, milestone breakdown, client info, apply button

#### W3 — Apply & Accept Flow
- Worker applies from job detail page
- Application stored in Supabase `job_applications` table
- Client view: see applications, accept one worker
- On accept: trigger escrow funding step

#### W4 — Escrow Smart Contract (Base testnet)
- Deploy `TrailmarkEscrow.sol` implementing `ITrailmarkEscrow` interface (see CLAUDE.md)
- Milestones stored as array in contract
- `createJob()`: client sends ETH, locked in contract
- `confirmMilestone()`: client marks complete → releases milestone payment to worker
- `disputeMilestone()`: raises dispute flag (resolution manual for hackathon)
- Use Base Sepolia testnet

#### W5 — Escrow Funding UI
- After worker is accepted: show "Fund Job" step to client
- Display: job total, milestone breakdown with amounts, gas estimate
- "Fund Escrow" button → triggers wallet tx via Privy
- Show tx hash + confirmation
- Job status updates to "Active" on confirmation

#### W6 — Milestone Completion UI
- Active job view for worker: milestone list, current milestone highlighted
- "Mark Complete" button → sends tx to `confirmMilestone()`
- Payment auto-releases to worker wallet on confirmation
- Show: payment amount received, updated reputation score (mock for hackathon)
- Job status updates to "Milestone X Complete"

**Wednesday night check-in deliverable:** Kyle should be able to demo the full job flow end-to-end — post → fund → accept → complete → paid.

---

## THURSDAY NIGHT — Reputation + Polish + Agents

**Goal:** Reputation profile is live. Trailblazer agent is smooth. Supporting agents are roughed in. Everything is demo-ready. Kyle does final review and prepares presentation talking points.

### Tasks

#### TH1 — On-Chain Reputation Profile
- Route: `/profile/[address]`
- Read from Supabase (jobs completed, ratings, attestations) + EAS (credentials)
- Display:
  - Tier badge (0–4) with tier name
  - Reputation score breakdown: completion rate, quality score, peer weight
  - Credential list: each with type, issuer, date, expiry, external ref
  - Job history: completed jobs with client ratings
  - Vouching: who has attested for this worker
- Public profile — anyone can view by wallet address

#### TH2 — EAS Attestation Integration
- Schema UID for TrailmarkCredential (register on EAS if not done)
- Read attestations for a wallet address via EAS GraphQL API
- Display in profile alongside Supabase data

#### TH3 — Trailblazer Agent Polish
- Refine conversational flow based on Tuesday's testing
- Make sure TDLR pre-fill works smoothly
- Add tier roadmap explanation: specific, not generic ("You need 3 more verified jobs and 2 peer attestations from Tier 1+ workers in Fort Worth")
- Streaming response for feel

#### TH4 — Scout Agent (Bonfire RFP translation)
- Chat interface or input panel on `/scout` route
- Worker pastes a Bonfire RFP URL or text
- Agent:
  - Summarizes the RFP in plain language (what they want, timeline, budget)
  - Checks eligibility against worker's current tier and credentials
  - Flags missing credentials required to bid
  - Lists M/WBE subcontracting requirements if present
- System prompt: see `ARCHITECTURE.md`

#### TH5 — Pathfinder Agent
- Chat interface on `/profile/[address]` page (or `/pathfinder` route)
- Input: worker wallet address (auto-populated if logged in)
- Agent reads worker's profile and outputs:
  - Exact gap to next tier: specific numbers, not generic advice
  - Active training bounties they qualify for
  - Under-supplied categories in Fort Worth network
- Read-only agent — no writes

#### TH6 — MCP Tool Demo Prep
- Ensure `trailmark_find_workers` MCP tool is implemented and callable
- Test calling it from Claude interface
- Prepare a working demo: search for "electrical Tier 2 Fort Worth" → returns seeded workers

#### TH7 — Demo Run-Through
- End-to-end demo walkthrough following presentation narrative in CLAUDE.md
- Fix any broken flows, rough edges, loading states
- Ensure all must-haves work on Base Sepolia testnet
- Prepare demo wallet with test ETH funded

#### TH8 — DAO Vote (Vocdoni) — if time allows
- Simple governance proposal: "Should we add Pet Care as a Phase 1 category?"
- Vocdoni SDK integration
- Show: proposal creation, anonymous vote, result verification

**Thursday night check-in deliverable:** Full demo rehearsal. Kyle runs through the entire presentation. Everything works or has a graceful fallback.

---

## FRIDAY — Submit

- Final review of all must-haves
- Record demo video if required by hackathon
- Submit

---

## IF YOU GET BLOCKED

1. **TDLR API issues:** Mock the response with realistic data. The UI and flow matter more than live API for the demo.
2. **EAS integration slow:** Store attestations in Supabase with the same schema. Real EAS integration is a post-hackathon task.
3. **Contract deployment issues:** Pre-deploy and hardcode the contract address. Don't let deployment debugging eat demo time.
4. **Vocdoni SDK issues:** Skip the DAO vote demo. It's a supporting feature.
5. **Time running out Thursday night:** Cut Pathfinder and Scout agents. Ship Trailblazer only. The must-haves win the demo.

---

## SEED DATA — Fort Worth Jobs (use these)

```json
[
  {
    "title": "Electrical panel upgrade — Near Southside duplex",
    "category": "trades_licensed",
    "subcategory": "electrical",
    "budget_eth": 0.15,
    "tier_required": 2,
    "location": "Near Southside, Fort Worth",
    "milestones": [
      { "name": "Materials inspection", "amount_eth": 0.03 },
      { "name": "Panel removal and rough-in", "amount_eth": 0.07 },
      { "name": "Final inspection pass", "amount_eth": 0.05 }
    ]
  },
  {
    "title": "Small business website — food truck, Cultural District",
    "category": "digital",
    "subcategory": "web_dev",
    "budget_eth": 0.08,
    "tier_required": 1,
    "location": "Cultural District, Fort Worth",
    "milestones": [
      { "name": "Design mockup approved", "amount_eth": 0.02 },
      { "name": "Site live with menu and contact", "amount_eth": 0.04 },
      { "name": "Mobile responsive + SEO", "amount_eth": 0.02 }
    ]
  },
  {
    "title": "Weekly lawn care — Riverside neighborhood",
    "category": "trades_unlicensed",
    "subcategory": "landscaping",
    "budget_eth": 0.02,
    "tier_required": 0,
    "location": "Riverside, Fort Worth",
    "milestones": [
      { "name": "First visit complete", "amount_eth": 0.02 }
    ]
  },
  {
    "title": "SAT math tutoring — TCU area student",
    "category": "tutoring",
    "subcategory": "math",
    "budget_eth": 0.04,
    "tier_required": 1,
    "location": "TCU area, Fort Worth",
    "milestones": [
      { "name": "4 sessions complete", "amount_eth": 0.02 },
      { "name": "Practice test improvement verified", "amount_eth": 0.02 }
    ]
  },
  {
    "title": "Interior painting — Magnolia Ave commercial space",
    "category": "trades_unlicensed",
    "subcategory": "painting",
    "budget_eth": 0.06,
    "tier_required": 0,
    "location": "Magnolia, Fort Worth",
    "milestones": [
      { "name": "Prep and primer", "amount_eth": 0.02 },
      { "name": "Two coats complete", "amount_eth": 0.04 }
    ]
  }
]
```
