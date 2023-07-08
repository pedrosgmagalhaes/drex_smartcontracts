# RealDigital Smart Contract

Digital, a Central Bank Digital Currency (CBDC). Real Digital is a conceptual ERC20 token that provides functionalities for minting, transferring, burning, freezing, and checking balances.

**Note: This smart contract is a simulated implementation based on the provided ABI from Bacen (Central Bank). It is intended for educational and illustrative purposes only and should not be used in a production environment.**

Please exercise extreme caution, and conduct thorough testing, and auditing before deploying any smart contract in a live environment. Always consult with legal and regulatory experts to ensure compliance with all applicable laws and regulations.

For the official implementation of a Central Bank Digital Currency (CBDC) or any financial system, please refer to the authoritative sources provided by the Bacen or relevant regulatory bodies.

If you have any questions or concerns, feel free to reach out to the team at Bacen.

## Features
- Minting: Authorized accounts can mint new Real Digital tokens.
- Burning: Authorized accounts can burn Real Digital tokens.
- Freezing: Authorized accounts can freeze and unfreeze token balances.
- Transfer: Token holders can transfer Real Digital tokens to other addresses.
- Pausing: Authorized accounts can pause and unpause token transfers.
- Access Control: Different roles (burner, minter, pauser, mover) are assigned to authorized accounts.

## Smart Contract Details
The RealDigital smart contract is built using the OpenZeppelin library. It inherits from the following contracts:

- ERC20: Provides the standard ERC20 token implementation.
- ERC20Burnable: Allows burning (destroying) of tokens.
- AccessControl: Implements role-based access control.
- Pausable: Enables pausing and unpausing of token transfers.

## Roles
The contract defines the following roles:

- BURNER_ROLE: Allows burning of tokens.
- MINTER_ROLE: Allows minting of tokens.
- PAUSER_ROLE: Allows pausing and unpausing of token transfers.
- MOVER_ROLE: Allows moving of tokens between wallets.

## Functions
The important functions provided by the contract include:

- disableAccount: Disables an authorized account from transferring tokens.
- enableAccount: Enables a previously disabled account for token transfers.
- increaseFrozenBalance: Increases the frozen balance of a wallet address.
- decreaseFrozenBalance: Decreases the frozen balance of a wallet address.
- transfer: Overrides the ERC20 transfer function to include account status and frozen balance checks.
- transferFrom: Overrides the ERC20 transferFrom function to include account status and frozen balance checks.
- mint: Mints new Real Digital tokens to a specified address.
- burn: Burns (destroys) a specified amount of Real Digital tokens.
- pause: Pauses token transfers.
- unpause: Unpauses token transfers.
- frozenBalanceOf: Retrieves the frozen balance of a wallet address.
- authorizedAccount: Checks if an account is authorized for token transfers.
- move: Moves tokens from one wallet to another.
- moveAndBurn: Moves and burns tokens from a wallet.
- burnFrom: Burns tokens from a specified account.

## Installation

To compile and deploy the RealDigital smart contract, follow these steps:

Clone this repository:

```bash
git clone https://github.com/example/realdigital-smartcontracts.git
```

Install the dependencies:

```bash
cd realdigital-smartcontracts
```

```bash
npm install
```

Compile the smart contract:

```bash
npx hardhat compile
```

Deploy the smart contract to a network:

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

Replace <network-name> with the desired network (e.g., mainnet, ropsten, rinkeby, etc.).

## License
This project is licensed under the MIT License. See the LICENSE file for more information.

## Credits
This RealDigital smart contract is developed by Pedro Magalhaes and Iora Labs.

Iora Labs is a leading blockchain services provider that specializes in custom blockchain development, smart contract development, and decentralized applications (DApps).
