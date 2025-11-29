// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract SimpleStorage {
    // Переменная для хранения строкового значения
    string private storedData;

    // Событие для отслеживания изменений
    event ValueChanged(string newValue, address indexed changedBy);

    /**
     * @dev Конструктор инициализирует контракт с начальным значением
     * @param initialValue Начальное значение для хранения
     */
    constructor(string memory initialValue) {
        storedData = initialValue;
        emit ValueChanged(initialValue, msg.sender);
    }

    /**
     * @dev Функция для изменения хранимого значения
     * @param newValue Новое значение для хранения
     */
    function setValue(string memory newValue) public {
        storedData = newValue;
        emit ValueChanged(newValue, msg.sender);
    }

    /**
     * @dev Функция для чтения текущего значения
     * @return Текущее хранимое значение
     */
    function getValue() public view returns (string memory) {
        return storedData;
    }

    /**
     * @dev Вспомогательная функция для получения информации о контракте
     * @return Название контракта и текущее значение
     */
    function getContractInfo()
        public
        view
        returns (string memory, string memory)
    {
        return ("SimpleStorage Contract v1.0", storedData);
    }
}
