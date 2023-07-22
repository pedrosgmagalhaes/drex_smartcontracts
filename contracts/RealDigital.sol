// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./CBDCAccessControl.sol";

contract RealDigital is ERC20, ERC20Burnable, Pausable, CBDCAccessControl {
    mapping(address => uint256) public frozenBalanceOf;

    event FrozenBalance(address indexed wallet, uint256 amount);

    modifier checkFrozenBalance(address from, uint256 amount) {
        require(
            from == address(0) || balanceOf(from) - frozenBalanceOf[from] >= amount,
            "RealDigital: Insufficient liquid balance"
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _authority,
        address _admin
    ) ERC20(_name, _symbol) CBDCAccessControl(_authority, _admin) {}

    function decimals() public view virtual override returns (uint8) {
        return 2;
    }

    function increaseFrozenBalance(address from, uint256 amount) external whenNotPaused onlyRole(FREEZER_ROLE) {
        frozenBalanceOf[from] += amount;
        emit FrozenBalance(from, frozenBalanceOf[from]);
    }

    function decreaseFrozenBalance(address from, uint256 amount) external whenNotPaused onlyRole(FREEZER_ROLE) {
        require(frozenBalanceOf[from] >= amount, "RealDigital: Insufficient frozen balance");
        frozenBalanceOf[from] -= amount;
        emit FrozenBalance(from, frozenBalanceOf[from]);
    }

    function transfer(
        address recipient,
        uint256 amount
    ) public override whenNotPaused checkAccess(_msgSender(), recipient) returns (bool) {
        return super.transfer(recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override whenNotPaused checkAccess(sender, recipient) returns (bool) {
        require(
            sender == _msgSender() || hasRole(MOVER_ROLE, _msgSender()),
            "RealDigital: msg.sender must be sender or have MOVER_ROLE"
        );
        return super.transferFrom(sender, recipient, amount);
    }

    function mint(address to, uint256 amount) external whenNotPaused onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(uint256 amount) public override whenNotPaused onlyRole(BURNER_ROLE) {
        super.burn(amount);
    }

    function burnFrom(address account, uint256 amount) public override whenNotPaused onlyRole(BURNER_ROLE) {
        super.burnFrom(account, amount);
    }

    function move(address from, address to, uint256 amount) public whenNotPaused onlyRole(MOVER_ROLE) {
        require(hasRole(MOVER_ROLE, _msgSender()), "Caller is not authorized");
        _transfer(from, to, amount);
    }

    function moveAndBurn(address from, uint256 amount) public whenNotPaused onlyRole(MOVER_ROLE){
        _burn(from, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override checkFrozenBalance(from, amount) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
