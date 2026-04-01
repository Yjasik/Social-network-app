// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SocialNetwork.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        SocialNetwork socialNetwork = new SocialNetwork();

        vm.stopBroadcast();
        console.log("Deployed SocialNetwork at:", address(socialNetwork));
    }
}
