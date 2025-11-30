async function main() {
  // Get signers
  const [deployer, addr1, addr2] = await ethers.getSigners();
  
  // Prepare initial data
  const initialKeys = [deployer.address, addr1.address, addr2.address];
  const initialValues = [
    "Deployer: Main account",
    "Address 1: Secondary account", 
    "Address 2: Test account"
  ];
  
  console.log("Deploying StorageMapping contract...");
  console.log("Deployer address:", deployer.address);
  console.log("\nInitial mappings:");
  for (let i = 0; i < initialKeys.length; i++) {
    console.log(`  ${initialKeys[i]} => "${initialValues[i]}"`);
  }

  // Deploy contract
  const StorageMapping = await ethers.getContractFactory("StorageMapping");
  const storageMapping = await StorageMapping.deploy(initialKeys, initialValues);

  await storageMapping.waitForDeployment();

  const address = await storageMapping.getAddress();
  console.log("\nStorageMapping deployed to:", address);
  
  // Verify contract is working
  console.log("\n--- Verification ---");
  
  const count = await storageMapping.getAddressCount();
  console.log("Number of addresses with values:", count.toString());
  
  const allAddresses = await storageMapping.getAllAddresses();
  console.log("\nAll addresses with values:");
  for (const addr of allAddresses) {
    const value = await storageMapping.getValueFor(addr);
    console.log(`  ${addr}: "${value}"`);
  }
  
  // Test batch retrieval
  const batchValues = await storageMapping.getBatchValues(initialKeys);
  console.log("\nBatch values retrieval:");
  for (let i = 0; i < initialKeys.length; i++) {
    console.log(`  ${initialKeys[i]}: "${batchValues[i]}"`);
  }
  
  const info = await storageMapping.getContractInfo();
  console.log("\nContract info:", info[0]);
  console.log("Active mappings:", info[1].toString());
  
  // Test setting value
  console.log("\n--- Testing setValue ---");
  const tx = await storageMapping.setValue("Updated deployer value");
  await tx.wait();
  const newValue = await storageMapping.getValue();
  console.log("Deployer's new value:", newValue);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
