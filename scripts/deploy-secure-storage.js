const { ethers } = require("hardhat");

async function main() {
  const initialValue = "Hello, SecureStorage!";

  console.log("Deploying SecureStorage contract...");
  console.log("Initial value:", initialValue);

  const SecureStorage = await ethers.getContractFactory("SecureStorage");
  const secureStorage = await SecureStorage.deploy(initialValue);

  await secureStorage.waitForDeployment();

  const address = await secureStorage.getAddress();
  console.log("SecureStorage deployed to:", address);

  // Verify contract is working
  const value = await secureStorage.getValue();
  console.log("Current stored value:", value);

  const info = await secureStorage.getContractInfo();
  console.log("Contract info:", info[0]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

