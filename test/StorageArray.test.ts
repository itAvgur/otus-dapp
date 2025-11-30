import { expect } from "chai";
import { ethers } from "hardhat";
import type {
  ContractFactory,
  Contract,
  TransactionResponse,
} from "ethers";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("StorageArray Contract", function () {
  let StorageArray: ContractFactory;
  let storageArray: any;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    StorageArray = await ethers.getContractFactory("StorageArray");
    storageArray = await StorageArray.deploy(["Initial1", "Initial2", "Initial3"]);
    await storageArray.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should initialize with provided values", async function () {
      expect(await storageArray.getLength()).to.equal(3);
      expect(await storageArray.getValue(0)).to.equal("Initial1");
      expect(await storageArray.getValue(1)).to.equal("Initial2");
      expect(await storageArray.getValue(2)).to.equal("Initial3");
    });

    it("Should emit ValueAdded events during deployment", async function () {
      const newStorage = await StorageArray.deploy(["Test1", "Test2"]);
      const receipt = await newStorage.deploymentTransaction()?.wait();
      
      const events = receipt?.logs.filter((log: any) => log.eventName === "ValueAdded");
      expect(events?.length).to.equal(2);
    });

    it("Should deploy with empty array", async function () {
      const emptyStorage: any = await StorageArray.deploy([]);
      await emptyStorage.waitForDeployment();
      expect(await emptyStorage.getLength()).to.equal(0);
    });
  });

  describe("Add Value", function () {
    it("Should add a new value", async function () {
      await expect(storageArray.addValue("NewValue"))
        .to.emit(storageArray, "ValueAdded")
        .withArgs("NewValue", 3, owner.address);

      expect(await storageArray.getLength()).to.equal(4);
      expect(await storageArray.getValue(3)).to.equal("NewValue");
    });

    it("Should allow multiple additions", async function () {
      await storageArray.addValue("Value4");
      await storageArray.addValue("Value5");
      await storageArray.addValue("Value6");

      expect(await storageArray.getLength()).to.equal(6);
      expect(await storageArray.getValue(5)).to.equal("Value6");
    });

    it("Should handle empty string", async function () {
      await storageArray.addValue("");
      expect(await storageArray.getValue(3)).to.equal("");
    });

    it("Should handle very long strings", async function () {
      const longString = "A".repeat(1000);
      await storageArray.addValue(longString);
      expect(await storageArray.getValue(3)).to.equal(longString);
    });

    it("Should handle special characters", async function () {
      const specialString = "Hello!@#$%^&*()_+-=[]{}|;':\"<>?,./";
      await storageArray.addValue(specialString);
      expect(await storageArray.getValue(3)).to.equal(specialString);
    });

    it("Should handle unicode characters", async function () {
      const unicodeString = "Hello 世界 🌍 مرحبا";
      await storageArray.addValue(unicodeString);
      expect(await storageArray.getValue(3)).to.equal(unicodeString);
    });
  });

  describe("Get Value", function () {
    it("Should return correct value by index", async function () {
      expect(await storageArray.getValue(0)).to.equal("Initial1");
      expect(await storageArray.getValue(1)).to.equal("Initial2");
      expect(await storageArray.getValue(2)).to.equal("Initial3");
    });

    it("Should revert on out of bounds index", async function () {
      await expect(storageArray.getValue(3))
        .to.be.revertedWith("Index out of bounds");
    });

    it("Should revert on negative index (uint underflow)", async function () {
      await expect(storageArray.getValue(ethers.MaxUint256))
        .to.be.revertedWith("Index out of bounds");
    });
  });

  describe("Update Value", function () {
    it("Should update value at index", async function () {
      await expect(storageArray.updateValue(1, "UpdatedValue"))
        .to.emit(storageArray, "ValueUpdated")
        .withArgs("Initial2", "UpdatedValue", 1, owner.address);

      expect(await storageArray.getValue(1)).to.equal("UpdatedValue");
    });

    it("Should update first element", async function () {
      await storageArray.updateValue(0, "NewFirst");
      expect(await storageArray.getValue(0)).to.equal("NewFirst");
    });

    it("Should update last element", async function () {
      await storageArray.updateValue(2, "NewLast");
      expect(await storageArray.getValue(2)).to.equal("NewLast");
    });

    it("Should revert on out of bounds index", async function () {
      await expect(storageArray.updateValue(10, "Invalid"))
        .to.be.revertedWith("Index out of bounds");
    });

    it("Should allow updating to empty string", async function () {
      await storageArray.updateValue(0, "");
      expect(await storageArray.getValue(0)).to.equal("");
    });

    it("Should allow any address to update", async function () {
      await storageArray.connect(addr1).updateValue(0, "UpdatedByAddr1");
      expect(await storageArray.getValue(0)).to.equal("UpdatedByAddr1");
    });
  });

  describe("Remove Last Value", function () {
    it("Should remove last value", async function () {
      const initialLength = await storageArray.getLength();
      
      await expect(storageArray.removeLastValue())
        .to.emit(storageArray, "ValueRemoved")
        .withArgs("Initial3", 2, owner.address);

      expect(await storageArray.getLength()).to.equal(initialLength - 1n);
    });

    it("Should return removed value", async function () {
      const tx = await storageArray.removeLastValue();
      const receipt = await tx.wait();
      
      expect(await storageArray.getLength()).to.equal(2);
    });

    it("Should revert when array is empty", async function () {
      await storageArray.removeLastValue();
      await storageArray.removeLastValue();
      await storageArray.removeLastValue();

      await expect(storageArray.removeLastValue())
        .to.be.revertedWith("Array is empty");
    });

    it("Should handle removing all elements one by one", async function () {
      while ((await storageArray.getLength()) > 0) {
        await storageArray.removeLastValue();
      }
      expect(await storageArray.getLength()).to.equal(0);
    });
  });

  describe("Get All Values", function () {
    it("Should return all values", async function () {
      const values = await storageArray.getAllValues();
      expect(values.length).to.equal(3);
      expect(values[0]).to.equal("Initial1");
      expect(values[1]).to.equal("Initial2");
      expect(values[2]).to.equal("Initial3");
    });

    it("Should return empty array when no values", async function () {
      const emptyStorage: any = await StorageArray.deploy([]);
      await emptyStorage.waitForDeployment();
      
      const values = await emptyStorage.getAllValues();
      expect(values.length).to.equal(0);
    });

    it("Should reflect additions", async function () {
      await storageArray.addValue("Value4");
      const values = await storageArray.getAllValues();
      expect(values.length).to.equal(4);
      expect(values[3]).to.equal("Value4");
    });
  });

  describe("Get Length", function () {
    it("Should return correct length", async function () {
      expect(await storageArray.getLength()).to.equal(3);
    });

    it("Should update after additions", async function () {
      await storageArray.addValue("Value4");
      expect(await storageArray.getLength()).to.equal(4);
    });

    it("Should update after removals", async function () {
      await storageArray.removeLastValue();
      expect(await storageArray.getLength()).to.equal(2);
    });

    it("Should be 0 for empty array", async function () {
      const emptyStorage: any = await StorageArray.deploy([]);
      await emptyStorage.waitForDeployment();
      expect(await emptyStorage.getLength()).to.equal(0);
    });
  });

  describe("Clear All", function () {
    it("Should clear all values", async function () {
      await storageArray.clearAll();
      expect(await storageArray.getLength()).to.equal(0);
    });

    it("Should emit ValueRemoved events for all elements", async function () {
      const tx = await storageArray.clearAll();
      const receipt = await tx.wait();
      
      const events = receipt?.logs.filter((log: any) => log.eventName === "ValueRemoved");
      expect(events?.length).to.equal(3);
    });

    it("Should allow adding after clear", async function () {
      await storageArray.clearAll();
      await storageArray.addValue("AfterClear");
      expect(await storageArray.getLength()).to.equal(1);
      expect(await storageArray.getValue(0)).to.equal("AfterClear");
    });

    it("Should handle clearing empty array", async function () {
      const emptyStorage: any = await StorageArray.deploy([]);
      await emptyStorage.waitForDeployment();
      await emptyStorage.clearAll();
      expect(await emptyStorage.getLength()).to.equal(0);
    });
  });

  describe("Index Of", function () {
    it("Should find existing value", async function () {
      const index = await storageArray.indexOf("Initial2");
      expect(index).to.equal(1);
    });

    it("Should return first occurrence", async function () {
      await storageArray.addValue("Initial1");
      const index = await storageArray.indexOf("Initial1");
      expect(index).to.equal(0);
    });

    it("Should return -1 for non-existent value", async function () {
      const index = await storageArray.indexOf("NonExistent");
      expect(index).to.equal(-1);
    });

    it("Should handle empty string search", async function () {
      await storageArray.addValue("");
      const index = await storageArray.indexOf("");
      expect(index).to.equal(3);
    });

    it("Should be case sensitive", async function () {
      const index = await storageArray.indexOf("initial1");
      expect(index).to.equal(-1);
    });

    it("Should return -1 in empty array", async function () {
      const emptyStorage: any = await StorageArray.deploy([]);
      await emptyStorage.waitForDeployment();
      const index = await emptyStorage.indexOf("Test");
      expect(index).to.equal(-1);
    });
  });

  describe("Get Contract Info", function () {
    it("Should return contract name and length", async function () {
      const info = await storageArray.getContractInfo();
      expect(info[0]).to.equal("StorageArray Contract v1.0");
      expect(info[1]).to.equal(3);
    });

    it("Should reflect current length", async function () {
      await storageArray.addValue("NewValue");
      const info = await storageArray.getContractInfo();
      expect(info[1]).to.equal(4);
    });
  });

  describe("Gas Usage", function () {
    it("Should have reasonable gas costs for addValue", async function () {
      const tx: TransactionResponse = await storageArray.addValue("GasTest");
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      expect(Number(receipt!.gasUsed)).to.be.lessThan(100000);
    });

    it("Should have reasonable gas costs for removeLastValue", async function () {
      const tx: TransactionResponse = await storageArray.removeLastValue();
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      expect(Number(receipt!.gasUsed)).to.be.lessThan(100000);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle large number of elements", async function () {
      for (let i = 0; i < 10; i++) {
        await storageArray.addValue(`Value${i}`);
      }
      expect(await storageArray.getLength()).to.equal(13);
    });

    it("Should handle rapid add/remove operations", async function () {
      await storageArray.addValue("Temp1");
      await storageArray.addValue("Temp2");
      await storageArray.removeLastValue();
      await storageArray.removeLastValue();
      expect(await storageArray.getLength()).to.equal(3);
    });

    it("Should preserve order after updates", async function () {
      await storageArray.updateValue(0, "Updated0");
      await storageArray.updateValue(2, "Updated2");
      
      expect(await storageArray.getValue(0)).to.equal("Updated0");
      expect(await storageArray.getValue(1)).to.equal("Initial2");
      expect(await storageArray.getValue(2)).to.equal("Updated2");
    });
  });
});
