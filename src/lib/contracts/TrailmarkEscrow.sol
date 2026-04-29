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
    address public dao;
    uint256 public protocolFee;
    JobStatus public jobStatus;
    Milestone[] public milestones;

    event MilestoneConfirmed(uint8 index, uint256 amount, address worker);
    event DisputeRaised(uint8 index, address initiator);
    event DisputeResolved(uint8 index, bool workerPrevailed);
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
        jobStatus = JobStatus.Active;

        uint256 totalRequired = 0;
        for (uint i = 0; i < _milestoneNames.length; i++) {
            totalRequired += _milestoneAmounts[i];
            milestones.push(Milestone({
                name: _milestoneNames[i],
                amount: _milestoneAmounts[i],
                status: MilestoneStatus.Pending
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

    function disputeMilestone(uint8 index, string calldata evidence) external {
        require(msg.sender == client || msg.sender == worker, "Not authorized");
        require(index < milestones.length, "Invalid index");
        require(milestones[index].status == MilestoneStatus.Pending, "Not pending");

        milestones[index].status = MilestoneStatus.Disputed;
        emit DisputeRaised(index, msg.sender);
    }

    function resolveDispute(uint8 index, bool workerPrevails) external {
        require(msg.sender == dao, "Only DAO");
        require(index < milestones.length, "Invalid index");
        require(milestones[index].status == MilestoneStatus.Disputed, "Not disputed");

        milestones[index].status = MilestoneStatus.Complete;

        if (workerPrevails) {
            payable(worker).transfer(milestones[index].amount);
        } else {
            payable(client).transfer(milestones[index].amount);
        }

        emit DisputeResolved(index, workerPrevails);
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
