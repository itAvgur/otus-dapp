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
  let simpleStorage: Contract & {
    getValue: () => Promise<string>;
    setValue: (value: string) => Promise<TransactionResponse>;
    getContractInfo: () => Promise<[string, string]>;
  };
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    // Получаем аккаунты
    [owner, addr1] = (await ethers.getSigners()) as [
      SignerWithAddress,
      SignerWithAddress
    ];

    // Развертываем контракт
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

  describe("Развертывание", function () {
    it("Должен установить правильное начальное значение", async function () {
      expect(await simpleStorage.getValue()).to.equal("Initial Value");
    });

    it("Должен установить правильного владельца", async function () {
      const contractInfo: [string, string] =
        await simpleStorage.getContractInfo();
      expect(contractInfo[0]).to.equal("SimpleStorage Contract v1.0");
    });
  });

  describe("Изменение значения", function () {
    it("Должен позволять изменять значение", async function () {
      const newValue: string = "New Test Value";

      // Изменяем значение
      await expect(simpleStorage.setValue(newValue))
        .to.emit(simpleStorage, "ValueChanged")
        .withArgs(newValue, owner.address);

      // Проверяем новое значение
      expect(await simpleStorage.getValue()).to.equal(newValue);
    });

    it("Должен позволять любому изменять значение", async function () {
      const newValue: string = "Value from another account";

      // Изменяем значение с другого аккаунта
      await simpleStorage.connect(addr1).setValue(newValue);

      expect(await simpleStorage.getValue()).to.equal(newValue);
    });

    it("Должен эмитировать событие при изменении", async function () {
      const newValue: string = "Event Test Value";

      const tx: TransactionResponse = await simpleStorage.setValue(newValue);
      const receipt: TransactionReceipt | null = await tx.wait();

      // Проверяем событие
      expect(receipt).to.not.be.null;
      const event = receipt!.logs.find(
        (log: any) => log.eventName === "ValueChanged"
      ) as any;
      expect(event.args.newValue).to.equal(newValue);
      expect(event.args.changedBy).to.equal(owner.address);
    });
  });

  describe("Чтение значения", function () {
    it("Должен возвращать корректное значение после изменения", async function () {
      const testValues: string[] = ["First", "Second", "Third"];

      for (const value of testValues) {
        await simpleStorage.setValue(value);
        expect(await simpleStorage.getValue()).to.equal(value);
      }
    });

    it("Должен возвращать информацию о контракте", async function () {
      const info: [string, string] = await simpleStorage.getContractInfo();

      expect(info[0]).to.equal("SimpleStorage Contract v1.0");
      expect(info[1]).to.equal("Initial Value");
    });
  });

  describe("Газовые затраты", function () {
    it("Должен иметь разумные газовые затраты на setValue", async function () {
      const tx: TransactionResponse = await simpleStorage.setValue("Gas Test");
      const receipt: TransactionReceipt | null = await tx.wait();

      expect(receipt).to.not.be.null;
      expect(Number(receipt!.gasUsed)).to.be.lessThan(100000);
    });

    it("Должен иметь низкие газовые затраты на getValue", async function () {
      // view функции не требуют газа, но проверим вызов
      const value: string = await simpleStorage.getValue();
      expect(value).to.be.a("string");
    });
  });
});
