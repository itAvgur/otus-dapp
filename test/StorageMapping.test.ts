import { expect } from "chai";
import { ethers } from "hardhat";
import type { ContractFactory } from "ethers";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("StorageMapping Contract", function () {
  let StorageMapping: ContractFactory;
  let storageMapping: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    StorageMapping = await ethers.getContractFactory("StorageMapping");
    // Deploy with initial values
    storageMapping = await StorageMapping.deploy(
      [owner.address, addr1.address],
      ["Owner Value", "Addr1 Value"]
    );
    await storageMapping.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should initialize with provided key-value pairs", async function () {
      expect(await storageMapping.getValueFor(owner.address)).to.equal("Owner Value");
      expect(await storageMapping.getValueFor(addr1.address)).to.equal("Addr1 Value");
    });

    it("Should emit ValueStored events during deployment", async function () {
      const newStorage: any = await StorageMapping.deploy(
        [addr1.address],
        ["Test Value"]
      );
      const receipt = await newStorage.deploymentTransaction()?.wait();
      
      const events = receipt?.logs.filter((log: any) => log.eventName === "ValueStored");
      expect(events?.length).to.equal(1);
    });

    it("Should deploy with empty mapping", async function () {
      const emptyStorage: any = await StorageMapping.deploy([], []);
      await emptyStorage.waitForDeployment();
      expect(await emptyStorage.getAddressCount()).to.equal(0);
    });

    it("Should revert if keys and values length mismatch", async function () {
      await expect(
        StorageMapping.deploy([owner.address], ["Value1", "Value2"])
      ).to.be.revertedWith("Keys and values length mismatch");
    });

    it("Should revert on zero address in initial keys", async function () {
      await expect(
        StorageMapping.deploy([ethers.ZeroAddress], ["Value"])
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Set Value", function () {
    it("Should allow setting value for sender", async function () {
      await expect(storageMapping.connect(addr2).setValue("Addr2 Value"))
        .to.emit(storageMapping, "ValueStored")
        .withArgs(addr2.address, "Addr2 Value", addr2.address);

      expect(await storageMapping.getValueFor(addr2.address)).to.equal("Addr2 Value");
    });

    it("Should allow updating existing value", async function () {
      await storageMapping.connect(owner).setValue("Updated Owner Value");
      expect(await storageMapping.getValueFor(owner.address)).to.equal("Updated Owner Value");
    });

    it("Should allow setting value for specific address", async function () {
      await storageMapping.setValueFor(addr2.address, "Set For Addr2");
      expect(await storageMapping.getValueFor(addr2.address)).to.equal("Set For Addr2");
    });

    it("Should revert when setting value for zero address", async function () {
      await expect(
        storageMapping.setValueFor(ethers.ZeroAddress, "Invalid")
      ).to.be.revertedWith("Invalid address");
    });

    it("Should handle empty string values", async function () {
      await storageMapping.setValue("");
      expect(await storageMapping.getValue()).to.equal("");
    });

    it("Should handle very long strings", async function () {
      const longString = "A".repeat(1000);
      await storageMapping.setValue(longString);
      expect(await storageMapping.getValue()).to.equal(longString);
    });

    it("Should handle special characters", async function () {
      const specialString = "!@#$%^&*()_+-=[]{}|;':\"<>?,./";
      await storageMapping.setValue(specialString);
      expect(await storageMapping.getValue()).to.equal(specialString);
    });

    it("Should handle unicode characters", async function () {
      const unicodeString = "Hello 世界 🌍 مرحبا";
      await storageMapping.setValue(unicodeString);
      expect(await storageMapping.getValue()).to.equal(unicodeString);
    });
  });

  describe("Get Value", function () {
    it("Should return value for sender", async function () {
      expect(await storageMapping.connect(owner).getValue()).to.equal("Owner Value");
    });

    it("Should return value for specific address", async function () {
      expect(await storageMapping.getValueFor(addr1.address)).to.equal("Addr1 Value");
    });

    it("Should return empty string for non-existent address", async function () {
      expect(await storageMapping.getValueFor(addr2.address)).to.equal("");
    });

    it("Should return empty string for zero address", async function () {
      expect(await storageMapping.getValueFor(ethers.ZeroAddress)).to.equal("");
    });

    it("Should reflect updates immediately", async function () {
      await storageMapping.setValue("New Value");
      expect(await storageMapping.getValue()).to.equal("New Value");
    });
  });

  describe("Delete Value", function () {
    it("Should delete value for sender", async function () {
      await expect(storageMapping.connect(owner).deleteValue())
        .to.emit(storageMapping, "ValueDeleted")
        .withArgs(owner.address, "Owner Value", owner.address);

      expect(await storageMapping.getValueFor(owner.address)).to.equal("");
    });

    it("Should delete value for specific address", async function () {
      await storageMapping.deleteValueFor(addr1.address);
      expect(await storageMapping.getValueFor(addr1.address)).to.equal("");
    });

    it("Should allow deleting non-existent value", async function () {
      await storageMapping.deleteValueFor(addr2.address);
      expect(await storageMapping.getValueFor(addr2.address)).to.equal("");
    });

    it("Should allow re-setting after deletion", async function () {
      await storageMapping.deleteValue();
      await storageMapping.setValue("New After Delete");
      expect(await storageMapping.getValue()).to.equal("New After Delete");
    });

    it("Should emit event with empty string for non-existent value", async function () {
      await expect(storageMapping.deleteValueFor(addr2.address))
        .to.emit(storageMapping, "ValueDeleted")
        .withArgs(addr2.address, "", owner.address);
    });
  });

  describe("Has Value", function () {
    it("Should return true for existing values", async function () {
      expect(await storageMapping.hasValue(owner.address)).to.be.true;
      expect(await storageMapping.hasValue(addr1.address)).to.be.true;
    });

    it("Should return false for non-existent values", async function () {
      expect(await storageMapping.hasValue(addr2.address)).to.be.false;
    });

    it("Should return false after deletion", async function () {
      await storageMapping.deleteValue();
      expect(await storageMapping.hasValue(owner.address)).to.be.false;
    });

    it("Should return false for empty string values", async function () {
      await storageMapping.connect(addr2).setValue("");
      expect(await storageMapping.hasValue(addr2.address)).to.be.false;
    });

    it("Should return false for zero address", async function () {
      expect(await storageMapping.hasValue(ethers.ZeroAddress)).to.be.false;
    });
  });

  describe("Get All Addresses", function () {
    it("Should return all addresses with values", async function () {
      const addresses = await storageMapping.getAllAddresses();
      expect(addresses.length).to.equal(2);
      expect(addresses).to.include(owner.address);
      expect(addresses).to.include(addr1.address);
    });

    it("Should not include addresses with deleted values", async function () {
      await storageMapping.deleteValue();
      const addresses = await storageMapping.getAllAddresses();
      expect(addresses.length).to.equal(1);
      expect(addresses).to.not.include(owner.address);
    });

    it("Should return empty array when no values", async function () {
      const emptyStorage: any = await StorageMapping.deploy([], []);
      await emptyStorage.waitForDeployment();
      const addresses = await emptyStorage.getAllAddresses();
      expect(addresses.length).to.equal(0);
    });

    it("Should include newly added addresses", async function () {
      await storageMapping.connect(addr2).setValue("Addr2 Value");
      const addresses = await storageMapping.getAllAddresses();
      expect(addresses.length).to.equal(3);
      expect(addresses).to.include(addr2.address);
    });
  });

  describe("Get Address Count", function () {
    it("Should return correct count", async function () {
      expect(await storageMapping.getAddressCount()).to.equal(2);
    });

    it("Should update after adding new address", async function () {
      await storageMapping.connect(addr2).setValue("Value");
      expect(await storageMapping.getAddressCount()).to.equal(3);
    });

    it("Should update after deletion", async function () {
      await storageMapping.deleteValue();
      expect(await storageMapping.getAddressCount()).to.equal(1);
    });

    it("Should return 0 for empty mapping", async function () {
      const emptyStorage: any = await StorageMapping.deploy([], []);
      await emptyStorage.waitForDeployment();
      expect(await emptyStorage.getAddressCount()).to.equal(0);
    });

    it("Should not double count updated values", async function () {
      await storageMapping.setValue("Updated");
      expect(await storageMapping.getAddressCount()).to.equal(2);
    });
  });

  describe("Get Batch Values", function () {
    it("Should return values for multiple addresses", async function () {
      const values = await storageMapping.getBatchValues([
        owner.address,
        addr1.address,
      ]);
      expect(values.length).to.equal(2);
      expect(values[0]).to.equal("Owner Value");
      expect(values[1]).to.equal("Addr1 Value");
    });

    it("Should return empty strings for non-existent addresses", async function () {
      const values = await storageMapping.getBatchValues([
        addr2.address,
        ethers.ZeroAddress,
      ]);
      expect(values.length).to.equal(2);
      expect(values[0]).to.equal("");
      expect(values[1]).to.equal("");
    });

    it("Should handle empty array", async function () {
      const values = await storageMapping.getBatchValues([]);
      expect(values.length).to.equal(0);
    });

    it("Should handle mixed existing and non-existing addresses", async function () {
      const values = await storageMapping.getBatchValues([
        owner.address,
        addr2.address,
        addr1.address,
      ]);
      expect(values[0]).to.equal("Owner Value");
      expect(values[1]).to.equal("");
      expect(values[2]).to.equal("Addr1 Value");
    });
  });

  describe("Get Contract Info", function () {
    it("Should return contract name and count", async function () {
      const info = await storageMapping.getContractInfo();
      expect(info[0]).to.equal("StorageMapping Contract v1.0");
      expect(info[1]).to.equal(2);
    });

    it("Should reflect current count", async function () {
      await storageMapping.connect(addr2).setValue("Value");
      const info = await storageMapping.getContractInfo();
      expect(info[1]).to.equal(3);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple updates to same address", async function () {
      await storageMapping.setValue("Update1");
      await storageMapping.setValue("Update2");
      await storageMapping.setValue("Update3");
      expect(await storageMapping.getValue()).to.equal("Update3");
    });

    it("Should handle rapid set and delete operations", async function () {
      await storageMapping.setValue("Value1");
      await storageMapping.deleteValue();
      await storageMapping.setValue("Value2");
      expect(await storageMapping.getValue()).to.equal("Value2");
    });

    it("Should maintain independence between addresses", async function () {
      await storageMapping.connect(addr2).setValue("Addr2 Value");
      await storageMapping.connect(owner).setValue("Updated Owner");
      
      expect(await storageMapping.getValueFor(owner.address)).to.equal("Updated Owner");
      expect(await storageMapping.getValueFor(addr2.address)).to.equal("Addr2 Value");
    });

    it("Should handle many addresses", async function () {
      const signers = await ethers.getSigners();
      for (let i = 0; i < 10; i++) {
        await storageMapping.connect(signers[i]).setValue(`Value${i}`);
      }
      expect(await storageMapping.getAddressCount()).to.be.at.least(10);
    });

    it("Should preserve data after failed operations", async function () {
      const originalValue = await storageMapping.getValue();
      
      try {
        await storageMapping.setValueFor(ethers.ZeroAddress, "Invalid");
      } catch (error) {
        // Expected to fail
      }
      
      expect(await storageMapping.getValue()).to.equal(originalValue);
    });
  });

  describe("Gas Usage", function () {
    it("Should have reasonable gas costs for setValue", async function () {
      const tx = await storageMapping.setValue("Gas Test");
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      expect(Number(receipt!.gasUsed)).to.be.lessThan(150000);
    });

    it("Should have reasonable gas costs for deleteValue", async function () {
      const tx = await storageMapping.deleteValue();
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      expect(Number(receipt!.gasUsed)).to.be.lessThan(100000);
    });

    it("Should have low gas costs for view functions", async function () {
      // View functions don't consume gas, but verify they work
      const value = await storageMapping.getValue();
      expect(typeof value).to.equal("string");
    });
  });
});
