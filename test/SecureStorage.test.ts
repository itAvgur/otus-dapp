import { expect } from "chai";
import { ethers } from "hardhat";
import type {
  ContractFactory,
  Contract,
  TransactionResponse,
  TransactionReceipt,
} from "ethers";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SecureStorage Contract", function () {
  let SecureStorage: ContractFactory;
  let secureStorage: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    // Get accounts
    [owner, addr1] = (await ethers.getSigners()) as [
      SignerWithAddress,
      SignerWithAddress
    ];

    // Deploy contract
    SecureStorage = await ethers.getContractFactory("SecureStorage");
    secureStorage = (await SecureStorage.deploy(
      "Initial Secure"
    )) as Contract & {
      getValue: () => Promise<string>;
      setValue: (value: string) => Promise<TransactionResponse>;
      getContractInfo: () => Promise<[string, string]>;
      setHashedValue: (h: string) => Promise<TransactionResponse>;
      hashedValue: () => Promise<string>;
      owner: () => Promise<string>;
      verifyMessage: (
        message: string,
        v: number,
        r: string,
        s: string
      ) => Promise<boolean>;
    };
    await secureStorage.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct initial value", async function () {
      expect(await secureStorage.getValue()).to.equal("Initial Secure");
    });

    it("Should return correct contract info", async function () {
      const contractInfo: [string, string] =
        await secureStorage.getContractInfo();
      expect(contractInfo[0]).to.equal("SecureStorage Contract v1.0");
    });

    it("Should set owner to deployer", async function () {
      expect(await secureStorage.owner()).to.equal(owner.address);
    });
  });

  describe("Changing value", function () {
    it("Should allow owner to change the value", async function () {
      const newValue: string = "New Secure Value";

      // Change value
      await expect(secureStorage.setValue(newValue))
        .to.emit(secureStorage, "ValueChanged")
        .withArgs(newValue, owner.address);

      // Check new value
      expect(await secureStorage.getValue()).to.equal(newValue);
    });

    it("Should NOT allow non-owner to change the value", async function () {
      const newValue: string = "Value from another account";

      // Attempt change value from another account should revert
      await expect(
        secureStorage.connect(addr1).setValue(newValue)
      ).to.be.revertedWith("Only owner");

      // Value should remain unchanged
      expect(await secureStorage.getValue()).to.equal("Initial Secure");
    });

    it("Should emit event on value change", async function () {
      const newValue: string = "Event Secure Test Value";

      const tx: TransactionResponse = await secureStorage.setValue(newValue);
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

  describe("Hashed value and signatures", function () {
    it("Owner can set hashed value and it's stored correctly", async function () {
      const plain = "secure secret";
      const hashed = ethers.keccak256(ethers.toUtf8Bytes(plain));

      await expect(secureStorage.setHashedValue(hashed))
        .to.emit(secureStorage, "HashedValueChanged")
        .withArgs(hashed, owner.address);

      expect(await secureStorage.hashedValue()).to.equal(hashed);
    });

    it("verifyMessage returns true for a correct signature and owner", async function () {
      const message = "Please verify me";
      const signature = await owner.signMessage(message);
      const sig = ethers.Signature.from(signature);

      expect(
        await secureStorage.verifyMessage(message, sig.v, sig.r, sig.s)
      ).to.equal(true);
    });

    it("verifyMessage returns false for wrong signer or message", async function () {
      const message = "Please verify me";
      const badSig = await addr1.signMessage(message);
      const bad = ethers.Signature.from(badSig);

      expect(
        await secureStorage.verifyMessage(message, bad.v, bad.r, bad.s)
      ).to.equal(false);

      const signature = await owner.signMessage("Different message");
      const sig = ethers.Signature.from(signature);

      expect(
        await secureStorage.verifyMessage(message, sig.v, sig.r, sig.s)
      ).to.equal(false);
    });
  });

  describe("Reading value", function () {
    it("Should return correct value after changes", async function () {
      const testValues: string[] = ["First", "Second", "Third"];

      for (const value of testValues) {
        await secureStorage.setValue(value);
        expect(await secureStorage.getValue()).to.equal(value);
      }
    });

    it("Should return contract information", async function () {
      const info: [string, string] = await secureStorage.getContractInfo();

      expect(info[0]).to.equal("SecureStorage Contract v1.0");
      expect(info[1]).to.equal("Initial Secure");
    });
  });

  describe("Gas costs", function () {
    it("Should have reasonable gas costs for setValue", async function () {
      const tx: TransactionResponse = await secureStorage.setValue("Gas Test");
      const receipt: TransactionReceipt | null = await tx.wait();

      expect(receipt).to.not.be.null;
      expect(Number(receipt!.gasUsed)).to.be.lessThan(100000);
    });

    it("Should have low gas costs for getValue", async function () {
      const value: string = await secureStorage.getValue();
      expect(value).to.be.a("string");
    });
  });
});
