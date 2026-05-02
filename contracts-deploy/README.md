# TrailmarkEscrow Contract Deployment

Quick reference for deploying the escrow contract to Base Sepolia.

**📖 For detailed instructions, see [../DEPLOYMENT.md](../DEPLOYMENT.md)**

---

## Quick Deploy

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY and DAO_ADDRESS

# 2. Build
source ~/.zshenv
forge build

# 3. Deploy to Base Sepolia
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_sepolia \
  --broadcast

# 4. Copy deployed address to root .env.local
# NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0x...

# 5. Export ABI
cat out/TrailmarkEscrow.sol/TrailmarkEscrow.json | jq '.abi' > ../src/lib/contracts/TrailmarkEscrow.json
```

---

## Files

- `src/TrailmarkEscrow.sol` - Main escrow contract
- `script/Deploy.s.sol` - Deployment script
- `.env` - Environment variables (DO NOT COMMIT)
- `foundry.toml` - Foundry configuration

---

## Contract Features

- ✅ Milestone-based payments
- ✅ Auto-release on client confirmation
- ✅ 2.5% protocol fee to DAO
- ✅ Dispute resolution
- ✅ Job cancellation (if no milestones completed)

---

## Deployed Contracts

Add your deployed addresses here:

- **Base Sepolia Escrow**: (pending deployment)
- **EAS Schema UID**: (pending registration)
