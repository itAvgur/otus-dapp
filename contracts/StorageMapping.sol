// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract StorageMapping {
    // Mapping to store values by address
    mapping(address => string) private dataMapping;
    
    // Array to track all addresses that have stored values
    address[] private addressList;
    
    // Mapping to check if address already exists in addressList
    mapping(address => bool) private addressExists;

    // Event to track value storage
    event ValueStored(address indexed key, string value, address indexed storedBy);

    // Event to track value deletion
    event ValueDeleted(address indexed key, string value, address indexed deletedBy);

    /**
     * @dev Constructor initializes the contract with initial key-value pairs
     * @param initialKeys Array of initial addresses
     * @param initialValues Array of initial values
     */
    constructor(address[] memory initialKeys, string[] memory initialValues) {
        require(initialKeys.length == initialValues.length, "Keys and values length mismatch");
        
        for (uint256 i = 0; i < initialKeys.length; i++) {
            require(initialKeys[i] != address(0), "Invalid address");
            _setValue(initialKeys[i], initialValues[i]);
        }
    }

    /**
     * @dev Store a value for the sender's address
     * @param value Value to store
     */
    function setValue(string memory value) public {
        _setValue(msg.sender, value);
    }

    /**
     * @dev Store a value for a specific address (only callable by that address or anyone if mapping is empty)
     * @param key Address to store value for
     * @param value Value to store
     */
    function setValueFor(address key, string memory value) public {
        require(key != address(0), "Invalid address");
        _setValue(key, value);
    }

    /**
     * @dev Internal function to set value
     * @param key Address key
     * @param value Value to store
     */
    function _setValue(address key, string memory value) private {
        // Add to address list if new
        if (!addressExists[key]) {
            addressList.push(key);
            addressExists[key] = true;
        }
        
        dataMapping[key] = value;
        emit ValueStored(key, value, msg.sender);
    }

    /**
     * @dev Get value for the sender's address
     * @return Value stored for sender
     */
    function getValue() public view returns (string memory) {
        return dataMapping[msg.sender];
    }

    /**
     * @dev Get value for a specific address
     * @param key Address to query
     * @return Value stored for the address
     */
    function getValueFor(address key) public view returns (string memory) {
        return dataMapping[key];
    }

    /**
     * @dev Delete value for the sender's address
     */
    function deleteValue() public {
        _deleteValue(msg.sender);
    }

    /**
     * @dev Delete value for a specific address
     * @param key Address to delete value for
     */
    function deleteValueFor(address key) public {
        _deleteValue(key);
    }

    /**
     * @dev Internal function to delete value
     * @param key Address key
     */
    function _deleteValue(address key) private {
        string memory oldValue = dataMapping[key];
        delete dataMapping[key];
        emit ValueDeleted(key, oldValue, msg.sender);
    }

    /**
     * @dev Check if an address has a stored value
     * @param key Address to check
     * @return True if address has a non-empty value
     */
    function hasValue(address key) public view returns (bool) {
        return bytes(dataMapping[key]).length > 0;
    }

    /**
     * @dev Get all addresses that have stored values
     * @return Array of addresses
     */
    function getAllAddresses() public view returns (address[] memory) {
        // Filter out addresses with empty values
        uint256 count = 0;
        for (uint256 i = 0; i < addressList.length; i++) {
            if (bytes(dataMapping[addressList[i]]).length > 0) {
                count++;
            }
        }
        
        address[] memory activeAddresses = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < addressList.length; i++) {
            if (bytes(dataMapping[addressList[i]]).length > 0) {
                activeAddresses[index] = addressList[i];
                index++;
            }
        }
        
        return activeAddresses;
    }

    /**
     * @dev Get the number of addresses with stored values
     * @return Count of active addresses
     */
    function getAddressCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < addressList.length; i++) {
            if (bytes(dataMapping[addressList[i]]).length > 0) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Get all values as a batch
     * @param keys Array of addresses to query
     * @return Array of values corresponding to the keys
     */
    function getBatchValues(address[] memory keys) public view returns (string[] memory) {
        string[] memory values = new string[](keys.length);
        for (uint256 i = 0; i < keys.length; i++) {
            values[i] = dataMapping[keys[i]];
        }
        return values;
    }

    /**
     * @dev Get contract information
     * @return Contract name and number of active addresses
     */
    function getContractInfo() public view returns (string memory, uint256) {
        return ("StorageMapping Contract v1.0", getAddressCount());
    }
}
