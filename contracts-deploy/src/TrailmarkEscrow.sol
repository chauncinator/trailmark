// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TrailmarkEscrow {
    struct Milestone {
        string name;
        uint256 amount;
        MilestoneStatus status;
        bytes32 evidenceHash;  // P0: Hash of dispute evidence (IPFS content hash)
        string evidenceCid;    // P0: IPFS CID for evidence retrieval
    }

    enum MilestoneStatus { Pending, Complete, Disputed }
    enum JobStatus { Active, Complete, Cancelled }

    bytes32 public jobId;
    address public client;
    address public worker;
    address public dao;
    uint256 public protocolFee;
    uint256 public slashPercentage;  // P0: Percentage of stake to slash (basis points)
    JobStatus public jobStatus;
    Milestone[] public milestones;

    // P0: Track attesters who vouched for this worker (simplified for hackathon)
    mapping(address => uint256) public attestorStakes;

    event MilestoneConfirmed(uint8 index, uint256 amount, address worker);
    event DisputeRaised(uint8 index, address initiator, bytes32 evidenceHash, string ipfsCid);
    event DisputeResolved(uint8 index, bool workerPrevailed);
    event StakeSlashed(address indexed attester, address indexed worker, uint256 amount, bytes32 jobId);
    event JobCompleted();
    event JobCancelled();

    constructor(
        bytes32 _jobId,
        address _worker,
        address _dao,
        string[] memory _milestoneNames,
        uint256[] memory _milestoneAmounts
    ) payable {
        require(_milestoneNames.length == _milestoneAmounts.length, "Length mismatch");

        jobId = _jobId;
        client = msg.sender;
        worker = _worker;
        dao = _dao;
        protocolFee = 250; // 2.5%
        slashPercentage = 1500; // P0: 15% slash on failed attestation (basis points)
        jobStatus = JobStatus.Active;

        uint256 totalRequired = 0;
        for (uint i = 0; i < _milestoneNames.length; i++) {
            totalRequired += _milestoneAmounts[i];
            milestones.push(Milestone({
                name: _milestoneNames[i],
                amount: _milestoneAmounts[i],
                status: MilestoneStatus.Pending,
                evidenceHash: bytes32(0),
                evidenceCid: ""
            }));
        }
        require(msg.value >= totalRequired, "Insufficient funding");
    }

    function confirmMilestone(uint8 index) external {
        require(msg.sender == client, "Only client");
        require(index < milestones.length, "Invalid index");
        require(milestones[index].status == MilestoneStatus.Pending, "Not pending");

        milestones[index].status = MilestoneStatus.Complete;
        uint256 fee = (milestones[index].amount * protocolFee) / 10000;
        uint256 payout = milestones[index].amount - fee;

        payable(worker).transfer(payout);
        if (fee > 0) payable(dao).transfer(fee);

        emit MilestoneConfirmed(index, milestones[index].amount, worker);

        // Check if all complete
        bool allDone = true;
        for (uint i = 0; i < milestones.length; i++) {
            if (milestones[i].status != MilestoneStatus.Complete) {
                allDone = false;
                break;
            }
        }
        if (allDone) {
            jobStatus = JobStatus.Complete;
            emit JobCompleted();
        }
    }

    // P0: Updated to accept evidence hash + IPFS CID instead of raw string
    function disputeMilestone(
        uint8 index,
        bytes32 evidenceHash,
        string calldata ipfsCid
    ) external {
        require(msg.sender == client || msg.sender == worker, "Not authorized");
        require(index < milestones.length, "Invalid index");
        require(milestones[index].status == MilestoneStatus.Pending, "Not pending");
        require(evidenceHash != bytes32(0), "Evidence hash required");
        require(bytes(ipfsCid).length > 0, "IPFS CID required");

        milestones[index].status = MilestoneStatus.Disputed;
        milestones[index].evidenceHash = evidenceHash;
        milestones[index].evidenceCid = ipfsCid;

        emit DisputeRaised(index, msg.sender, evidenceHash, ipfsCid);
    }

    // P0: Added slashing mechanism when worker loses dispute
    function resolveDispute(
        uint8 index,
        bool workerPrevails,
        address[] calldata attesters
    ) external {
        require(msg.sender == dao, "Only DAO");
        require(index < milestones.length, "Invalid index");
        require(milestones[index].status == MilestoneStatus.Disputed, "Not disputed");

        milestones[index].status = MilestoneStatus.Complete;

        if (workerPrevails) {
            payable(worker).transfer(milestones[index].amount);
        } else {
            // Worker lost dispute - slash attestor stakes
            _slashAttestors(attesters);
            payable(client).transfer(milestones[index].amount);
        }

        emit DisputeResolved(index, workerPrevails);
    }

    // P0: Slash stakes of workers who vouched for failed worker
    function _slashAttestors(address[] calldata attesters) internal {
        for (uint i = 0; i < attesters.length; i++) {
            address attester = attesters[i];
            uint256 stake = attestorStakes[attester];

            if (stake > 0) {
                uint256 slashAmount = (stake * slashPercentage) / 10000;

                if (slashAmount > 0) {
                    attestorStakes[attester] -= slashAmount;

                    // Split slashed funds: 50% to injured client, 50% to DAO treasury
                    uint256 clientShare = slashAmount / 2;
                    uint256 daoShare = slashAmount - clientShare;

                    payable(client).transfer(clientShare);
                    payable(dao).transfer(daoShare);

                    emit StakeSlashed(attester, worker, slashAmount, jobId);
                }
            }
        }
    }

    // P0: Allow attestors to stake on this worker (simplified for hackathon)
    function stakeForWorker() external payable {
        require(msg.value > 0, "Stake required");
        attestorStakes[msg.sender] += msg.value;
    }

    // P0: Allow attestors to withdraw unstaked funds
    function withdrawStake(uint256 amount) external {
        require(attestorStakes[msg.sender] >= amount, "Insufficient stake");
        attestorStakes[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    function cancelJob() external {
        require(msg.sender == client, "Only client");
        require(jobStatus == JobStatus.Active, "Not active");

        // Only allow cancel if no milestones completed
        for (uint i = 0; i < milestones.length; i++) {
            require(milestones[i].status == MilestoneStatus.Pending, "Has completed milestones");
        }

        jobStatus = JobStatus.Cancelled;
        payable(client).transfer(address(this).balance);
        emit JobCancelled();
    }

    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    receive() external payable {}
}
