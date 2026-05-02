// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TrailmarkEscrow.sol";

contract DeployScript is Script {
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Get DAO address (for receiving protocol fees and dispute resolution)
        // For hackathon: use your own address or a test multisig
        address dao = vm.envAddress("DAO_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy a sample escrow contract for testing
        // In production, each job would deploy its own escrow instance
        string[] memory milestoneNames = new string[](3);
        milestoneNames[0] = "Design mockup approved";
        milestoneNames[1] = "Site live with menu";
        milestoneNames[2] = "Mobile responsive";

        uint256[] memory milestoneAmounts = new uint256[](3);
        milestoneAmounts[0] = 0.02 ether;
        milestoneAmounts[1] = 0.04 ether;
        milestoneAmounts[2] = 0.02 ether;

        // Sample worker address (replace with actual test address)
        address worker = 0x000000000000000000000000000000000000dEaD;

        TrailmarkEscrow escrow = new TrailmarkEscrow{value: 0.08 ether}(
            keccak256("test-job-001"),
            worker,
            dao,
            milestoneNames,
            milestoneAmounts
        );

        console.log("TrailmarkEscrow deployed at:", address(escrow));
        console.log("Job ID:", uint256(escrow.jobId()));
        console.log("Client:", escrow.client());
        console.log("Worker:", escrow.worker());
        console.log("DAO:", escrow.dao());
        console.log("Protocol Fee (basis points):", escrow.protocolFee());

        vm.stopBroadcast();
    }
}
