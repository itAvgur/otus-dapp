async function main() {
  const initialValues = ["First", "Second", "Third"];
  
  console.log("Deploying StorageArray contract...");
  console.log("Initial values:", initialValues);

  const StorageArray = await ethers.getContractFactory("StorageArray");
  const storageArray = await StorageArray.deploy(initialValues);

  await storageArray.waitForDeployment();

  const address = await storageArray.getAddress();
  console.log("StorageArray deployed to:", address);
  
  // Verify contract is working
  const length = await storageArray.getLength();
  console.log("Array length:", length.toString());
  
  const allValues = await storageArray.getAllValues();
  console.log("All values:", allValues);
  
  const info = await storageArray.getContractInfo();
  console.log("Contract info:", info[0]);
  console.log("Number of elements:", info[1].toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
