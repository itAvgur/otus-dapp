// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract StorageArray {
    // Array to store values
    string[] private dataArray;

    // Event to track value addition
    event ValueAdded(string value, uint256 index, address indexed addedBy);

    // Event to track value update
    event ValueUpdated(string oldValue, string newValue, uint256 index, address indexed updatedBy);

    // Event to track value removal
    event ValueRemoved(string value, uint256 index, address indexed removedBy);

    /**
     * @dev Constructor initializes the contract with initial values
     * @param initialValues Array of initial values to store
     */
    constructor(string[] memory initialValues) {
        for (uint256 i = 0; i < initialValues.length; i++) {
            dataArray.push(initialValues[i]);
            emit ValueAdded(initialValues[i], i, msg.sender);
        }
    }

    /**
     * @dev Add a new value to the end of the array
     * @param value Value to add
     */
    function addValue(string memory value) public {
        dataArray.push(value);
        emit ValueAdded(value, dataArray.length - 1, msg.sender);
    }

    /**
     * @dev Get value by index
     * @param index Element index
     * @return Value at the specified index
     */
    function getValue(uint256 index) public view returns (string memory) {
        require(index < dataArray.length, "Index out of bounds");
        return dataArray[index];
    }

    /**
     * @dev Update value by index
     * @param index Element index
     * @param newValue New value
     */
    function updateValue(uint256 index, string memory newValue) public {
        require(index < dataArray.length, "Index out of bounds");
        string memory oldValue = dataArray[index];
        dataArray[index] = newValue;
        emit ValueUpdated(oldValue, newValue, index, msg.sender);
    }

    /**
     * @dev Remove the last value from the array
     * @return Removed value
     */
    function removeLastValue() public returns (string memory) {
        require(dataArray.length > 0, "Array is empty");
        string memory removedValue = dataArray[dataArray.length - 1];
        dataArray.pop();
        emit ValueRemoved(removedValue, dataArray.length, msg.sender);
        return removedValue;
    }

    /**
     * @dev Get all values
     * @return Array of all values
     */
    function getAllValues() public view returns (string[] memory) {
        return dataArray;
    }

    /**
     * @dev Get the number of elements in the array
     * @return Number of elements
     */
    function getLength() public view returns (uint256) {
        return dataArray.length;
    }

    /**
     * @dev Clear all values from the array
     */
    function clearAll() public {
        uint256 length = dataArray.length;
        for (uint256 i = 0; i < length; i++) {
            emit ValueRemoved(dataArray[i], i, msg.sender);
        }
        delete dataArray;
    }

    /**
     * @dev Check if the array contains a value
     * @param value Value to check
     * @return Index of the first occurrence or -1 (maxUint) if not found
     */
    function indexOf(string memory value) public view returns (int256) {
        for (uint256 i = 0; i < dataArray.length; i++) {
            if (keccak256(bytes(dataArray[i])) == keccak256(bytes(value))) {
                return int256(i);
            }
        }
        return -1;
    }

    /**
     * @dev Get contract information
     * @return Contract name and number of elements
     */
    function getContractInfo() public view returns (string memory, uint256) {
        return ("StorageArray Contract v1.0", dataArray.length);
    }
}
