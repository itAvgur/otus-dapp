// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    // Variable to store string value
    string private storedData;

    // Event to track changes
    event ValueChanged(string newValue, address indexed changedBy);

    /**
     * @dev Constructor initializes the contract with an initial value
     * @param initialValue Initial value to store
     */
    constructor(string memory initialValue) {
        storedData = initialValue;
        emit ValueChanged(initialValue, msg.sender);
    }

    /**
     * @dev Function to change the stored value
     * @param newValue New value to store
     */
    function setValue(string memory newValue) public {
        storedData = newValue;
        emit ValueChanged(newValue, msg.sender);
    }

    /**
     * @dev Function to read the current value
     * @return Current stored value
     */
    function getValue() public view returns (string memory) {
        return storedData;
    }

    /**
     * @dev Helper function to get contract information
     * @return Contract name and current value
     */
    function getContractInfo()
        public
        view
        returns (string memory, string memory)
    {
        return ("SimpleStorage Contract v1.0", storedData);
    }
}
