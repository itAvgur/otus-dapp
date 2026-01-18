// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SecureStorage {
    // Owner of the contract
    address public owner;

    // Variable to store string value
    string private storedData;

    // Stored hashed value (e.g., SHA-256/keccak hash of some data)
    bytes32 public hashedValue;

    // Events to track changes
    event ValueChanged(string newValue, address indexed changedBy);
    event HashedValueChanged(bytes32 newValue, address indexed changedBy);

    /**
     * @dev Modifier to allow only the owner to call a function
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    /**
     * @dev Constructor initializes the contract with an initial value and sets the owner
     * @param initialValue Initial value to store
     */
    constructor(string memory initialValue) {
        owner = msg.sender;
        storedData = initialValue;
        emit ValueChanged(initialValue, msg.sender);
    }

    /**
     * @dev Function to change the stored value (owner only)
     * @param newValue New value to store
     */
    function setValue(string memory newValue) public onlyOwner {
        storedData = newValue;
        emit ValueChanged(newValue, msg.sender);
    }

    /**
     * @dev Function to set a hashed value (owner only)
     * @param _hash bytes32 hash to store
     */
    function setHashedValue(bytes32 _hash) public onlyOwner {
        hashedValue = _hash;
        emit HashedValueChanged(_hash, msg.sender);
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
        return ("SecureStorage Contract v1.0", storedData);
    }

    // Internal helper: convert uint to decimal string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Verify a signed message against the owner's address
     * @param message original string message that was signed
     * @param v signature component v
     * @param r signature component r
     * @param s signature component s
     * @return true if recovered signer equals owner
     *
     * This implementation recreates the same prefixed message hash used by
     * ethers' `signMessage(message)` (i.e. "\x19Ethereum Signed Message:\n" + len(message) + message)
     */
    function verifyMessage(
        string memory message,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public view returns (bool) {
        bytes memory messageBytes = bytes(message);
        string memory lenStr = _toString(messageBytes.length);
        // recreate the Ethereum Signed Message prefix and hash
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n", lenStr, messageBytes)
        );

        address signer = ecrecover(ethSignedMessageHash, v, r, s);
        return (signer == owner);
    }
}

