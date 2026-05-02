# Built from the Bottom Up
### *A Fort Worth Handyman's Journey — and the Protocol That Changes the Game*

---

> *"I run a handyman business in Fort Worth. I can do the work. I can't get the commercial contracts — not because of skill, but because of connections I don't have and bonds I can't afford. Research shows every additional bidder on a public contract saves taxpayers 8.3% in costs. The city wants better value. I want the work. The only thing missing is the infrastructure to connect us. That's Trailmark."*

---

## Chapter 1: The Work Was Never the Problem

I know how to fix things. Drywall, fixtures, doors that don't hang right, discontinued plumbing connections in 100 year old houses. In Fort Worth, there's no shortage of work — residential, commercial, municipal. The demand is real.

What nobody tells you when you go independent is that the work is the easy part.

The hard part is everything else.

---

## Chapter 2: The Four Walls

Before I earned a single dollar, I hit the first wall.

**General liability/Workers Comp insurance: $2,500+ a year.** No work without it. No client takes you seriously without it. No GC lets you on a job site without it. It's not optional — it's the price of admission to a game you haven't been allowed to play yet.

Then came the second wall: **not being in the club.** General contractors book their guys first. The guy they've worked with for five years. The guy someone's cousin vouched for. Platforms like Thumbtack and Angi aren't really marketplaces — they're incumbent protection systems. You show up with no reviews, no history, no network, and you're invisible. It doesn't matter how good you are. The algorithm doesn't know you exist.

Wall three was the **advertising black hole.** Google Ads. Thumbtack leads. Angi fees. I spent hundreds of dollars to compete for jobs that paid hundreds of dollars. The unit economics don't work. You're buying exposure on someone else's platform, building someone else's brand, and the moment you stop paying, you disappear again.

And wall four — the one that grinds you down the most — was **cash flow anxiety.** No contract protection. No escrow. Just an invoice sent to someone who pays when they feel like it. Net-30, net-60, sometimes net-never. You've already bought the materials. You've already done the work.  You learn to avoid the shady people, but the anxiety never goes away.

Four walls. Four problems every independent tradesperson faces. Four things that have nothing to do with whether you can do the job.

---

## Chapter 3: It's Not Just Me

The moment I started talking to other tradespeople in Fort Worth, I realized the pattern was everywhere.

Plumbers. HVAC techs. Electricians. Licensed contractors who hit the bonding ceiling for city work. Tutors who couldn't get into school district contracts. Developers trying to break into city IT procurement. Landscapers locked out of commercial accounts. Personal service providers competing on platforms that take 30% and give them nothing portable in return.

Fort Worth's own disparity study found that African American business spend came in below 1% of city procurement in 2019. That's not an accident. That's a system that wasn't designed to include everyone, perpetuating itself. And cities that do outreach and diversify their bidder pools spend 17.6% less on infrastructure. The exclusion isn't just unfair — it's expensive for everyone.

This is a designed system. Municipal procurement processes, gig platform capture, licensing complexity — they work together to keep the same people at the same tables. It's been that way since the Middle Ages, when guilds controlled who could work and who couldn't.

The question I kept coming back to: what if we rebuilt the guild model — but for everyone?

---

## Chapter 4: The Insight

Somewhere in the process of learning about blockchain and Web3 infrastructure, I started working with the FWTX DAO — a Fort Worth civic organization exploring decentralized governance tools for local communities.

And I noticed something.

The tools DAOs use to govern themselves — treasuries, bounties, on-chain reputation, governance votes — are exact solutions to the problems independent workers face.

| **The Problem** | **The DAO Solution** |
|---|---|
| No escrow, late payments | Treasury-held smart contract escrow |
| No way to break in without a network | Bounty board — post work, anyone applies |
| Reputation locked to one platform | On-chain reputation, portable across every job |
| No worker voice in how the system works | Governance voting — workers help set the rules |
| Credentials siloed in spreadsheets | Verifiable on-chain attestations |

The infrastructure already existed. It just hadn't been applied to the trades.

---

## Chapter 5: Trailmark

**Trailmark is a decentralized guild protocol for independent workers.**

It borrows the structure that made medieval guilds powerful — reputation, tiers, mutual accountability — and rebuilds it on infrastructure no single company controls.

### The Three Tiers

Workers join and progress through the system based on verified work history:

- **Apprentice** — New to the network. Completes small bounties to build initial reputation. Attaches to verified contractors for mentorship. OSHA-10, basic trade certs get recorded on-chain as they're earned.
- **Journeyman** — Established reputation. Eligible for city sub-threshold work (under ~$50K, where the city has procurement discretion). Participates in governance. Escrow access and formal dispute resolution.
- **Master** — Deep track record. Mentors Apprentices. Elevated governance weight. Eligible for larger city contracts and bonding pool participation.

### The Protocol Pillars

**Portable Reputation.** Every completed job, every credential earned, every dispute resolved — recorded on-chain via Ethereum Attestation Service (EAS). Stored in your wallet. Yours, not Thumbtack's.

**On-Chain Escrow.** Payment locked in a smart contract when a job is accepted. Released when milestones are confirmed. No more "paid when they feel like it." No more collections calls.

**Bounty Board.** Jobs posted by clients, city departments, or neighborhood associations. Contractors browse and apply based on their verified trade categories and tier. Sub-threshold city work is the natural wedge — it's where small operators can actually compete.

**Worker Governance.** Workers vote on treasury allocation, recognized training programs, dispute resolution policies, and platform rules. The people doing the work have a say in how the work is organized.

**AI Agent Suite.** Four agents working on your behalf:
- *Trailblazer* — Matches you to jobs based on your verified skills, location, and capacity.
- *Scout* — Monitors the bounty board and alerts you to work you'd likely win.
- *Arbiter* — Facilitates dispute resolution using documented job history.
- *MCP Server* — Connects your Trailmark profile to external tools (city vendor portals, insurance providers, certification bodies).

### Sign-Up Without the Crypto Friction

The system is built for tradespeople, not crypto enthusiasts. The embedded wallet (Coinbase Smart Wallet) runs in the background. Your credentials live on-chain without you ever thinking about it. It looks and feels like a normal app.

---

## Chapter 6: The Off-Chain / On-Chain Architecture

A question worth answering directly: if this is supposed to be a decentralized protocol, why does it have a database?

Because the blockchain and the database are doing different jobs.

**The chain is the trust layer.** EAS attestations (credentials), escrow release logic, bond pool mechanics, governance votes — these need to exist independent of whether Trailmark as an organization survives. If the company goes under tomorrow, a worker's verified reputation still lives in their wallet.

**The database is the operational layer.** Job listings that need to be created, searched, and closed quickly. Semantic embeddings for AI job matching. Worker profile metadata. Application state. These need to be mutable, queryable, and fast — things the chain is terrible at. Storing a job listing on Base costs real money, can't be edited, and can't run a geographic proximity query.

The databasehandles the operational layer. The chain handles the trust layer. The credentials don't disappear if the database goes down — they're still on-chain in the worker's wallet.

---

## Chapter 7: The Bigger Picture

Trailmark fits into existing systems — it doesn't replace them.

**Texas Department of Licensing and Regulation (TDLR)** — existing trade licenses map directly to tier eligibility. No duplicate credentialing.

**City of Fort Worth vendor registration** — the protocol collects standard docs once (license, insurance, certs) and issues a verifiable credential that any party can check. The difference between spending a week on paperwork per client vs. showing them a QR code.

**M/WBE and national certification programs** — on-chain attestation compatibility. Diverse business certifications recorded and verifiable the same way.

**Bonfire and city procurement systems** — Journeyman and Master tier workers eligible for sub-threshold city contracts, with a clear pathway toward larger work as track records accumulate.

**Future cities** — the protocol is city-agnostic. Fort Worth is the pilot. Dallas, Austin, Houston, and eventually any city with a procurement equity problem becomes a replicable deployment.

---

## Chapter 8: The HackFW Connection


Trailmark sits at exactly that intersection.

- **Blockchain** provides the trust and portability layer — portable reputation, on-chain escrow, verifiable credentials.
- **AI agents** provide the discovery and matching layer — connecting workers to work they'd actually win.
- **Civic infrastructure** provides the institutional layer — city procurement, licensing bodies, training programs.

None of these alone solves the problem. Converged, they create something that didn't exist before: an open, permissionless protocol for building a career in the trades.

The reindustrialization argument is simple. If every additional qualified bidder on a public contract reduces infrastructure costs by 8.3%, and states that diversify their contractor pools spend 17.6% less — then the single highest-leverage infrastructure investment Fort Worth can make is in the infrastructure that gets more qualified workers to the table.

That's Trailmark.

---

## Epilogue: Why This Matters to Me

I built a handyman business because I know where we're headed. I've run into every wall this document describes — the insurance, the club, the advertising black hole, the late payments. I got through them, mostly through grit and some help from the right people.

Most people don't get through them. Most people who could do the work never get the chance to prove it. And that's not just their loss — it's the city's loss, the taxpayers' loss, and ultimately everyone's loss.

The guilds of the Middle Ages understood something we've forgotten: that when skilled workers are organized, recognized, and given a fair pathway, the whole community benefits from what they build.

This is that — rebuilt for Fort Worth, in 2026.