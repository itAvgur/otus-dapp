import { expect } from "chai";
import { ethers } from "hardhat";
import type {
  ContractFactory,
  Contract,
  TransactionResponse,
  TransactionReceipt,
} from "ethers";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SimpleStorage Contract", function () {
  let SimpleStorage: ContractFactory;
  let simpleStorage: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    // Get accounts
    [owner, addr1] = (await ethers.getSigners()) as [
      SignerWithAddress,
      SignerWithAddress
    ];

    // Deploy contract
    SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = (await SimpleStorage.deploy(
      "Initial Value"
    )) as Contract & {
      getValue: () => Promise<string>;
      setValue: (value: string) => Promise<TransactionResponse>;
      getContractInfo: () => Promise<[string, string]>;
    };
    await simpleStorage.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct initial value", async function () {
      expect(await simpleStorage.getValue()).to.equal("Initial Value");
    });

    it("Should return correct contract info", async function () {
      const contractInfo: [string, string] =
        await simpleStorage.getContractInfo();
      expect(contractInfo[0]).to.equal("SimpleStorage Contract v1.0");
    });
  });

  describe("Changing value", function () {
    it("Should allow changing the value", async function () {
      const newValue: string = "New Test Value";

      // Change value
      await expect(simpleStorage.setValue(newValue))
        .to.emit(simpleStorage, "ValueChanged")
        .withArgs(newValue, owner.address);

      // Check new value
      expect(await simpleStorage.getValue()).to.equal(newValue);
    });

    it("Should allow anyone to change the value", async function () {
      const newValue: string = "Value from another account";

      // Change value from another account
      await simpleStorage.connect(addr1).setValue(newValue);

      expect(await simpleStorage.getValue()).to.equal(newValue);
    });

    it("Should emit event on value change", async function () {
      const newValue: string = "Event Test Value";

      const tx: TransactionResponse = await simpleStorage.setValue(newValue);
      const receipt: TransactionReceipt | null = await tx.wait();

      // Check event
      expect(receipt).to.not.be.null;
      const event = receipt!.logs.find(
        (log: any) => log.eventName === "ValueChanged"
      ) as any;
      expect(event.args.newValue).to.equal(newValue);
      expect(event.args.changedBy).to.equal(owner.address);
    });
  });

  describe("Reading value", function () {
    it("Should return correct value after changes", async function () {
      const testValues: string[] = ["First", "Second", "Third"];

      for (const value of testValues) {
        await simpleStorage.setValue(value);
        expect(await simpleStorage.getValue()).to.equal(value);
      }
    });

    it("Should return contract information", async function () {
      const info: [string, string] = await simpleStorage.getContractInfo();

      expect(info[0]).to.equal("SimpleStorage Contract v1.0");
      expect(info[1]).to.equal("Initial Value");
    });
  });

  describe("Gas costs", function () {
    it("Should have reasonable gas costs for setValue", async function () {
      const tx: TransactionResponse = await simpleStorage.setValue("Gas Test");
      const receipt: TransactionReceipt | null = await tx.wait();

      expect(receipt).to.not.be.null;
      expect(Number(receipt!.gasUsed)).to.be.lessThan(100000);
    });

    it("Should have low gas costs for getValue", async function () {
      // view functions don't require gas, but let's verify the call
      const value: string = await simpleStorage.getValue();
      expect(value).to.be.a("string");
    });
  });
});
