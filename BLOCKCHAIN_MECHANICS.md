# Blockchain Mechanics — Future Enhancements

This document captures blockchain mechanics that are either underspecified in the current protocol or not yet implemented. Organized by priority: items marked **P0** should be addressed before or alongside the hackathon build; **P1** are post-hackathon production concerns.

---

## P0 — Slashing (Critical to Trust Model)

**What it is:** When a peer vouches for a worker via `stake_amount` in the EAS attestation schema, that stake should be at risk if the vouched worker commits fraud or fails a dispute. Currently the `stake_amount` field exists in the schema but nothing enforces consequences when a dispute resolves against the worker.

**Why it matters:** Without slashing, peer attestation is a reputational gesture with no financial weight. The entire trust model relies on vouchers having skin in the game — this is what makes the network self-regulating rather than just a list of unverified claims.

**What needs to change:**

In `TrailmarkEscrow.sol`, when `resolveDispute()` finds against the worker, the contract should signal the reputation contract to slash the voucher's stake:

```solidity
// TODO: Add to resolveDispute() when workerPrevails == false
// 1. Identify active peer attestations for this worker (read from EAS or a local mapping)
// 2. Reduce the attester's stake by a configurable slash percentage
// 3. Emit a SlashEvent for the reputation indexer to pick up
// 4. Slashed funds route to: injured client (partial) + DAO treasury (partial)

event StakeSlashed(address attester, address worker, uint256 amount, bytes32 jobId);
```

The slash percentage should be a DAO governance parameter (suggested starting range: 10–25% of staked amount per failed attestation). Full slash on first offense is too punitive and will deter legitimate vouching.

**References:** See `stake_amount` in `ARCHITECTURE.md` EAS schema, and the open question on slashing percentage in the Guild Protocol Plan §8.1.

---

## P0 — On-Chain Evidence Hashing for Disputes

**What it is:** The current `disputeMilestone()` function accepts a `string calldata evidence` parameter but stores it as plain text on-chain. This is both expensive (long strings cost gas) and insecure (evidence can be altered before submission).

**The correct pattern:** Store only the hash of the evidence on-chain; store the actual content on IPFS.

```solidity
// Current (in TrailmarkEscrow.sol)
function disputeMilestone(uint8 index, string calldata evidence) external {
    // evidence stored as string — expensive and mutable off-chain
}

// TODO: Replace with
function disputeMilestone(uint8 index, bytes32 evidenceHash, string calldata ipfsCid) external {
    require(msg.sender == client || msg.sender == worker, "Not authorized");
    require(index < milestones.length, "Invalid index");
    milestones[index].status = MilestoneStatus.Disputed;
    milestones[index].evidenceHash = evidenceHash;   // hash of content
    milestones[index].evidenceCid = ipfsCid;         // IPFS CID for retrieval
    emit DisputeRaised(index, msg.sender, evidenceHash, ipfsCid);
}
```

The frontend computes `evidenceHash = keccak256(fileBytes)` before upload, uploads to IPFS, then passes both to the contract. Anyone can verify the IPFS content hasn't been tampered with by re-hashing and comparing to the on-chain record.

**Add to Milestone struct:**
```solidity
struct Milestone {
    string name;
    uint256 amount;
    MilestoneStatus status;
    bytes32 evidenceHash;  // add
    string evidenceCid;    // add
}
```

---

## P1 — Soulbound Tier Badges

**What it is:** Tier status (Apprentice → Journeyman → Master) should be non-transferable. Currently tier is a field in the `TrailmarkReputation` struct — it can be updated but isn't enforced as non-transferable at the token level.

**Option A (simpler):** Keep tier in the reputation struct but add explicit non-transfer logic if tier is ever tokenized. Document that tier is identity-bound, not asset-bound.

**Option B (explicit):** Issue ERC-5114 Soulbound Tokens (SBTs) when a worker reaches each tier. Token is minted to their wallet and cannot be transferred or approved for transfer. Any external system (city procurement, other DAOs) can verify tier by checking for the SBT.

**Recommended approach:** Option A for hackathon (document the intent, enforce via attestation schema). Option B for production when city integration is in scope — the SBT becomes the credential the city's procurement system checks.

---

## P1 — Streaming Payments for Recurring Work

**What it is:** The current escrow model (milestone → confirm → release) works well for project-based work. For recurring service categories (weekly landscaping, retainer-based digital work, ongoing tutoring), it creates friction — both parties have to interact for every payment cycle.

**Pattern to consider:** [Superfluid Protocol](https://www.superfluid.finance/) allows ETH or ERC-20 tokens to stream per-second to a recipient wallet. A client opens a stream at a rate (e.g., 0.01 ETH/day), the worker receives continuously, and the stream can be paused or cancelled by either party.

**Where this fits in Trailmark:** Add a second escrow mode — `StreamJob` alongside `MilestoneJob` — selectable when posting a job. The Protocol spec (`ITrailmarkEscrow`) would need a second interface variant.

**Dependency:** Requires integrating the Superfluid SDK on the frontend and deploying on a network where Superfluid is live (Base mainnet supports it; Base Sepolia support should be verified).

---

## P1 — Event-Driven Reputation Computation

**What it is:** The current `TrailmarkReputation` struct stores scores as mutable state variables that get updated. A more tamper-resistant design derives reputation from the immutable event log rather than storing it as mutable state.

**The pattern:**

Instead of:
```solidity
// Mutable — can be updated, requires trust in the updater
mapping(address => TrailmarkReputation) public reputation;
```

Emit rich events from each contract action and compute reputation off-chain (or via a read-only view function) by replaying the log:

```solidity
// Each of these events is immutable once emitted
event JobCompleted(address worker, address client, uint8 rating, bytes32 jobId);
event AttestationIssued(address worker, address attester, uint8 credentialType, uint256 stakeAmount);
event DisputeResolved(address worker, bool workerPrevailed, bytes32 jobId);
event StakeSlashed(address attester, address worker, uint256 slashAmount);
```

A reputation indexer (could be a Supabase function or a subgraph) subscribes to these events and maintains a computed score. Any party can independently verify by replaying events from genesis.

**Benefit:** Reputation becomes an emergent property of on-chain history rather than a number someone wrote — much harder to manipulate, fully auditable.

**Dependency:** Requires a reliable event indexer. The Graph Protocol (subgraph) is the standard approach for this; alternatively, a Supabase Edge Function listening to contract events via WebSocket works for the hackathon scale.

---

## P1 — Treasury Yield on Idle Bond Reserves

**What it is:** The DAO bond pool in Gnosis Safe is idle capital when not covering active disputes. In production, undeployed reserves could be deposited into a yield protocol (Aave, Compound, or similar) to generate returns that flow back to the treasury.

**Why it matters economically:** At scale, the bond pool could hold substantial ETH. Even modest yield (3–5% APY) meaningfully funds DAO operations without requiring fee increases.

**Risk note:** This introduces smart contract risk from the yield protocol and liquidity risk if many disputes trigger simultaneously. Requires a minimum liquid reserve policy (suggested: keep 30% of bond pool liquid at all times, deploy remaining 70% to yield).

**Not in scope for hackathon.** Flag for post-launch treasury governance proposal.

---

## Summary Table

| Mechanic | Priority | Status | Where to Implement |
|---|---|---|---|
| Slashing on failed attestations | P0 | Not implemented | `TrailmarkEscrow.sol` + reputation contract |
| On-chain evidence hashing (IPFS) | P0 | Partially stubbed | `TrailmarkEscrow.sol` — `Milestone` struct + `disputeMilestone()` |
| Soulbound tier badges | P1 | Documented only | New `TrailmarkTier.sol` (ERC-5114) |
| Streaming payments (Superfluid) | P1 | Not designed | New `StreamEscrow` interface variant |
| Event-driven reputation | P1 | Not designed | Reputation contract refactor + indexer |
| Treasury yield (Aave) | P1 | Not in scope | Post-launch governance proposal |
