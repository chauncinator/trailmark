# Deployment Guide

This guide will walk you through deploying the TrailmarkEscrow contract to Base Sepolia and registering the EAS schema.

---

## Prerequisites

1. **Base Sepolia testnet ETH** - Get free testnet ETH from:
   - [Coinbase Wallet Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
   - [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)

2. **A wallet with private key** - You'll need the private key (keep it safe!)

3. **Foundry installed** ✅ Already done

---

## Part 1: Deploy the Escrow Contract

### Step 1: Set up environment variables

```bash
cd contracts-deploy
cp .env.example .env
```

Edit `.env` and fill in:

```bash
# Your wallet's private key (must have Base Sepolia ETH)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Your wallet address (or a test address for DAO)
DAO_ADDRESS=0xYOUR_WALLET_ADDRESS

# Base Sepolia RPC (already configured)
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Optional: for contract verification
BASESCAN_API_KEY=
```

**⚠️ IMPORTANT:** Never commit your `.env` file! It contains your private key.

### Step 2: Build the contract

```bash
source ~/.zshenv  # Load Foundry into your shell
forge build
```

You should see output like:
```
[⠊] Compiling...
[⠊] Compiling 1 files with Solc 0.8.19
[⠢] Solc 0.8.19 finished in X.XXs
Compiler run successful!
```

### Step 3: Deploy to Base Sepolia

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_sepolia \
  --broadcast \
  --verify
```

**Expected output:**

```
TrailmarkEscrow deployed at: 0xABCD1234...
Job ID: 12345...
Client: 0xYOUR_ADDRESS
Worker: 0x000000000000000000000000000000000000dEaD
DAO: 0xYOUR_DAO_ADDRESS
Protocol Fee (basis points): 250
```

### Step 4: Copy the contract address

Copy the deployed address (after "TrailmarkEscrow deployed at:") and add it to your root `.env.local`:

```bash
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
```

**Note:** The deployment script creates a sample escrow. In production, your app will deploy a new escrow contract for each job.

### Step 5: Export the ABI

```bash
cat out/TrailmarkEscrow.sol/TrailmarkEscrow.json | jq '.abi' > ../src/lib/contracts/TrailmarkEscrow.json
```

If you don't have `jq` installed:

```bash
brew install jq
```

Or manually copy the `abi` field from `out/TrailmarkEscrow.sol/TrailmarkEscrow.json` to `src/lib/contracts/TrailmarkEscrow.json`.

---

## Part 2: Register EAS Schema

### What is EAS?

Ethereum Attestation Service (EAS) lets you create on-chain attestations (credentials, vouches, licenses) that anyone can verify.

### Step 1: Go to EAS Schema Builder

1. Visit [Base Sepolia EAS](https://base-sepolia.easscan.org/schema/create)
2. Connect your wallet (same one you deployed the contract with)

### Step 2: Create the Trailmark Credential Schema

Fill in the schema builder:

**Schema Name:** `TrailmarkCredential`

**Schema Definition:** Paste this exactly:

```
address worker_address,uint8 category,string subcategory,uint8 credential_type,uint256 expires_at,string external_ref,string metadata_uri,uint256 stake_amount
```

**Description:**

```
Trailmark Guild worker credential attestation. 
Used for TDLR license verification, peer vouching, and work history.
```

**Resolver Contract:** Leave blank (0x0000...)

**Revocable:** ✅ Check this (allows revocation of bad attestations)

### Step 3: Create the schema

1. Click "Create Schema"
2. Confirm the transaction in your wallet
3. Wait for confirmation
4. **Copy the Schema UID** (looks like: `0xabcd1234...`)

### Step 4: Add to .env.local

Add the schema UID to your root `.env.local`:

```bash
NEXT_PUBLIC_EAS_SCHEMA_UID=0xYOUR_SCHEMA_UID
```

### Step 5: Verify it works

Go to: `https://base-sepolia.easscan.org/schema/view/0xYOUR_SCHEMA_UID`

You should see your schema with the field definitions.

---

## Part 3: Update Environment Variables

Your root `.env.local` should now have:

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=cmojis...

# Base Sepolia
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS  # ✅ NEW

# EAS
NEXT_PUBLIC_EAS_CONTRACT_ADDRESS=0x4200000000000000000000000000000000000021
NEXT_PUBLIC_EAS_SCHEMA_UID=0xYOUR_SCHEMA_UID  # ✅ NEW

# TDLR
TDLR_API_BASE_URL=https://www.tdlr.texas.gov/tools/api
```

---

## Part 4: Test the Deployment

### Test the contract

```bash
# From contracts-deploy directory
forge test -vvv
```

### Test in the app

```bash
# From root directory
npm run dev
```

1. Go to http://localhost:3000
2. Connect wallet
3. Try the onboarding flow
4. Check that EAS attestations work
5. Post a test job and fund escrow

---

## Troubleshooting

### "Insufficient funds" error during deployment

- Make sure your wallet has Base Sepolia ETH
- The deployment script tries to fund the escrow with 0.08 ETH
- You need at least 0.1 ETH to cover gas + escrow funding

### "RPC URL not found" error

- Make sure you ran `source ~/.zshenv` to load Foundry
- Check that `.env` exists in `contracts-deploy/`
- Verify `BASE_SEPOLIA_RPC` is set correctly

### Schema creation fails

- Make sure you have Base Sepolia ETH for gas
- Double-check the schema definition syntax (no spaces, correct types)
- Try refreshing the EAS website and reconnecting wallet

### Contract verification fails

- Add a Basescan API key to `.env` (`BASESCAN_API_KEY`)
- Get one free at: https://basescan.org/apis
- Or skip verification (remove `--verify` flag)

---

## Next Steps

Once deployed:

1. ✅ Update root `.env.local` with contract address and schema UID
2. ✅ Test the full flow locally
3. Consider deploying a factory contract that creates escrows on-demand
4. For production: deploy to Base mainnet (change RPC and get real ETH)

---

## Advanced: Factory Contract (Post-Hackathon)

For production, you'll want a factory contract that deploys escrows:

```solidity
contract TrailmarkEscrowFactory {
    event EscrowCreated(address escrow, bytes32 jobId, address client, address worker);
    
    function createEscrow(
        bytes32 _jobId,
        address _worker,
        address _dao,
        string[] memory _milestoneNames,
        uint256[] memory _milestoneAmounts
    ) external payable returns (address) {
        TrailmarkEscrow escrow = new TrailmarkEscrow{value: msg.value}(
            _jobId, _worker, _dao, _milestoneNames, _milestoneAmounts
        );
        emit EscrowCreated(address(escrow), _jobId, msg.sender, _worker);
        return address(escrow);
    }
}
```

This way your app calls the factory instead of deploying raw contracts.
