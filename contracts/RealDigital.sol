// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract RealDigital is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MOVER_ROLE = keccak256("MOVER_ROLE");

    mapping(address => bool) private _authorizedAccounts;
    mapping(address => uint256) private _frozenBalances;

    event DisabledAccount(address indexed member);
    event EnabledAccount(address indexed member);
    event FrozenBalance(address indexed wallet, uint256 amount);

    constructor(
        string memory name,
        string memory symbol,
        address authority
    ) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, authority);
        _setupRole(BURNER_ROLE, authority);
        _setupRole(MINTER_ROLE, authority);
        _setupRole(PAUSER_ROLE, authority);
        _setupRole(MOVER_ROLE, authority);
    }

    function disableAccount(address member) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Caller is not authorized"
        );
        _authorizedAccounts[member] = false;
        emit DisabledAccount(member);
    }

    function enableAccount(address member) public {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Caller is not authorized"
        );
        _authorizedAccounts[member] = true;
        emit EnabledAccount(member);
    }

    function increaseFrozenBalance(address from, uint256 amount) public {
        require(hasRole(MOVER_ROLE, _msgSender()), "Caller is not authorized");
        _frozenBalances[from] += amount;
        emit FrozenBalance(from, _frozenBalances[from]);
    }

    function decreaseFrozenBalance(address from, uint256 amount) public {
        require(hasRole(MOVER_ROLE, _msgSender()), "Caller is not authorized");
        _frozenBalances[from] = _frozenBalances[from] > amount
            ? _frozenBalances[from] - amount
            : 0;
        emit FrozenBalance(from, _frozenBalances[from]);
    }

    function transfer(
        address recipient,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        require(
            _authorizedAccounts[_msgSender()] != false,
            "Sender account is disabled"
        );
        require(
            availableBalanceOf(_msgSender()) >= amount,
            "Transfer amount exceeds available balance"
        );
        return super.transfer(recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        require(
            _authorizedAccounts[sender] != false,
            "Sender account is disabled"
        );
        require(
            availableBalanceOf(sender) >= amount,
            "Transfer amount exceeds available balance"
        );
        return super.transferFrom(sender, recipient, amount);
    }

    function mint(address to, uint256 amount) public {
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "Caller is not authorized to mint"
        );
        _mint(to, amount);
    }

    function burn(uint256 amount) public override {
        require(
            hasRole(BURNER_ROLE, _msgSender()),
            "Caller is not authorized to burn"
        );
        super.burn(amount);
    }

    function pause() public {
        require(
            hasRole(PAUSER_ROLE, _msgSender()),
            "Caller is not authorized to pause"
        );
        _pause();
    }

    function unpause() public {
        require(
            hasRole(PAUSER_ROLE, _msgSender()),
            "Caller is not authorized to unpause"
        );
        _unpause();
    }

    function availableBalanceOf(address account) public view returns (uint256) {
        return balanceOf(account) - frozenBalanceOf(account);
    }

    function frozenBalanceOf(address account) public view returns (uint256) {
        return _frozenBalances[account];
    }

    function authorizedAccount(address account) public view returns (bool) {
        return _authorizedAccounts[account];
    }

    function move(address from, address to, uint256 amount) public {
        require(hasRole(MOVER_ROLE, _msgSender()), "Caller is not authorized");
        _transfer(from, to, amount);
    }

    function moveAndBurn(address from, uint256 amount) public {
        require(hasRole(MOVER_ROLE, _msgSender()), "Caller is not authorized");
        _burn(from, amount);
    }

    function burnFrom(address account, uint256 amount) public override {
        require(hasRole(BURNER_ROLE, _msgSender()), "Caller is not authorized");
        _burn(account, amount);
    }
}
