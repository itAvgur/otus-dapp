# Otus DApp - Storage Patterns Project

This project demonstrates different storage patterns in Solidity smart contracts using Hardhat 2 and ethers.js.

## Project Overview

This project includes three smart contracts demonstrating different storage patterns:

1. **SimpleStorage** (`StorageSimple.sol`) - Simple variable storage
2. **StorageArray** (`StorageArray.sol`) - Array-based storage
3. **StorageMapping** (`StorageMapping.sol`) - Mapping-based storage (address => value)

Each contract includes:
- Comprehensive test suites (106 tests total)
- Deploy scripts for local testing
- Events for tracking state changes
- Gas optimization

## Installation

```bash
npm install
```

## Usage

### Running Tests

Run all tests:
```bash
npx hardhat test
```

Run specific test file:
```bash
npx hardhat test test/SimpleStorage.test.ts
npx hardhat test test/StorageArray.test.ts
npx hardhat test test/StorageMapping.test.ts
```

### Compiling Contracts

```bash
npx hardhat compile
```

### Running Contracts on Local Hardhat Node

#### Option 1: Deploy to Hardhat's Built-in Network (Quick Test)

Deploy and test contracts without starting a persistent node:

```bash
# Deploy SimpleStorage
npx hardhat run scripts/deploy-simple-storage.js --network hardhat

# Deploy StorageArray
npx hardhat run scripts/deploy-storage-array.js --network hardhat

# Deploy StorageMapping
npx hardhat run scripts/deploy-storage-mapping.js --network hardhat
```

#### Option 2: Deploy to Local Persistent Node (For Frontend Integration)

Start a local Hardhat node in a separate terminal:

```bash
npx hardhat node
```

The node will run at `http://127.0.0.1:8545/` and provide 20 test accounts with 10000 ETH each.

In another terminal, deploy contracts to the local node:

```bash
# Deploy SimpleStorage
npx hardhat run scripts/deploy-simple-storage.js --network localhost

# Deploy StorageArray
npx hardhat run scripts/deploy-storage-array.js --network localhost

# Deploy StorageMapping
npx hardhat run scripts/deploy-storage-mapping.js --network localhost
```

The local node will display all transactions and contract interactions in real-time.

## Storage Patterns Comparison

### 1. Simple Variable Storage (`SimpleStorage`)

**Pattern:** Single variable storage
```solidity
string private storedData;
```

**Characteristics:**
- Stores one value at a time
- Direct access with O(1) complexity
- Lowest gas cost for single value operations
- No iteration capabilities

**Best Use Cases:**
- Single configuration values
- Contract metadata (name, version)
- Simple state variables
- Counter values

**Gas Costs:** ~30,000 gas for setValue operation

---

### 2. Array Storage (`StorageArray`)

**Pattern:** Dynamic array storage
```solidity
string[] private dataArray;
```

**Characteristics:**
- Ordered collection of elements
- Access by index with O(1) complexity
- Iteration over all elements possible
- Higher gas costs for large arrays
- Can retrieve all values in one call

**Advantages:**
- Maintains insertion order
- Can get all values at once
- Index-based access is predictable
- Easy to iterate

**Disadvantages:**
- Expensive to search for specific values O(n)
- Deleting middle elements is complex
- Gas costs increase with array size
- No direct key-based lookup

**Best Use Cases:**
- Lists of items (products, users, transactions)
- When order matters
- When you need to iterate over all items
- When you need to retrieve all data
- Small to medium-sized collections (<100 items)

**Gas Costs:** ~32,000-79,000 gas for addValue operation

---

### 3. Mapping Storage (`StorageMapping`)

**Pattern:** Key-value storage
```solidity
mapping(address => string) private dataMapping;
```

**Characteristics:**
- Direct key-based access with O(1) complexity
- Very efficient lookups
- No iteration without additional tracking
- Scales well with large datasets

**Advantages:**
- Constant-time lookups O(1)
- Efficient for large datasets
- Low gas costs for individual operations
- Perfect for user data

**Disadvantages:**
- Cannot iterate over keys natively
- Cannot get all values directly
- Requires additional array to track keys
- No ordering

**Best Use Cases:**
- User balances and profiles
- Permission systems (address => role)
- Token ownership tracking
- Large datasets (>100 items)
- When you need fast lookup by key
- When iteration is not required

**Gas Costs:** ~27,000-97,000 gas for setValue operation

---

## When to Use Which Pattern

### Use **Simple Variable** when:
- You need to store a single value
- The value doesn't need to be part of a collection
- Gas optimization is critical

### Use **Array** when:
- You need to maintain order
- You need to iterate over all elements
- You need to retrieve all data at once
- Collection size is relatively small (<100 items)
- Index-based access is important

### Use **Mapping** when:
- You need fast lookups by key
- You're working with large datasets (>100 items)
- Each item is accessed independently
- User-specific data (balances, permissions)
- Iteration is not required or can be handled separately

### Hybrid Approach (Used in StorageMapping):
For best of both worlds, combine mapping with array:
```solidity
mapping(address => string) private dataMapping;
address[] private addressList;  // Track keys
```

This allows:
- Fast O(1) lookups via mapping
- Iteration capability via array
- Slightly higher gas costs but maximum flexibility

## Contract Details

### SimpleStorage
- Single string value storage
- Events: `ValueChanged`
- Methods: `setValue`, `getValue`, `getContractInfo`

### StorageArray
- Dynamic array of strings
- Events: `ValueAdded`, `ValueUpdated`, `ValueRemoved`
- Methods: `addValue`, `getValue`, `updateValue`, `removeLastValue`, `getAllValues`, `getLength`, `clearAll`, `indexOf`

### StorageMapping
- Address to string mapping
- Events: `ValueStored`, `ValueDeleted`
- Methods: `setValue`, `getValue`, `setValueFor`, `getValueFor`, `deleteValue`, `hasValue`, `getAllAddresses`, `getAddressCount`, `getBatchValues`
