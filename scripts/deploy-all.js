const hre = require("hardhat");

async function deploySimple() {
  const initialValue = "Hello, Hardhat!";
  console.log("\n=== Deploying SimpleStorage ===");
  const Simple = await hre.ethers.getContractFactory("SimpleStorage");
  const simple = await Simple.deploy(initialValue);
  await simple.waitForDeployment();
  console.log("SimpleStorage deployed to:", await simple.getAddress());
}

async function deployArray() {
  console.log("\n=== Deploying StorageArray ===");
  const StorageArray = await hre.ethers.getContractFactory("StorageArray");
  const arr = await StorageArray.deploy(["First", "Second", "Third"]);
  await arr.waitForDeployment();
  console.log("StorageArray deployed to:", await arr.getAddress());
}

async function deployMapping() {
  console.log("\n=== Deploying StorageMapping ===");
  const signers = await hre.ethers.getSigners();
  const initialKeys = [signers[0].address, signers[1].address, signers[2].address];
  const initialValues = [
    "Deployer: Main account",
    "Address 1: Secondary account",
    "Address 2: Test account",
  ];
  const StorageMapping = await hre.ethers.getContractFactory("StorageMapping");
  const mapping = await StorageMapping.deploy(initialKeys, initialValues);
  await mapping.waitForDeployment();
  console.log("StorageMapping deployed to:", await mapping.getAddress());
}

async function deploySecure() {
  const initialValue = "Hello, SecureStorage!";
  console.log("\n=== Deploying SecureStorage ===");
  const Secure = await hre.ethers.getContractFactory("SecureStorage");
  const secure = await Secure.deploy(initialValue);
  await secure.waitForDeployment();
  console.log("SecureStorage deployed to:", await secure.getAddress());
}

async function main() {
  console.log("Deploying all contracts (sequential)");
  await deploySimple();
  await deployArray();
  await deployMapping();
  await deploySecure();
  console.log("\nAll done.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

