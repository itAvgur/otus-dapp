async function main() {
    const initialValue = "Hello, Hardhat!";
    const {ethers} = require("hardhat");

    console.log("Deploying SimpleStorage contract...");
    console.log("Initial value:", initialValue);

    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    const simpleStorage = await SimpleStorage.deploy(initialValue);

    await simpleStorage.waitForDeployment();

    const address = await simpleStorage.getAddress();
    console.log("SimpleStorage deployed to:", address);

    // Verify contract is working
    const value = await simpleStorage.getValue();
    console.log("Current stored value:", value);

    const info = await simpleStorage.getContractInfo();
    console.log("Contract info:", info[0]);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});