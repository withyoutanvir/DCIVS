async function main() {
  const hre = require("hardhat");
  const Contract = await hre.ethers.getContractFactory("EnhancedDataRequestContract");
  const contract = await Contract.deploy();

  await contract.deployed();
  console.log(`Deployed to: ${contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
