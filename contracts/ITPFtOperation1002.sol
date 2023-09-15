// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITPFtOperation1002 {
    enum CallerPart { Sender, Receiver }

    struct TPFtData {
        string acronym;
        string code;
        uint256 maturityDate;
    }

    event CommandEvent(
        uint256 operationId,
        uint256 cnpj8Sender,
        uint256 cnpj8Receiver,
        address sender,
        address receiver,
        CallerPart callerPart,
        TPFtData tpftData,
        uint256 tpftAmount,
        uint256 unitPrice,
        uint256 financialValue,
        string status,
        uint256 timestamp
    );

    event CommandTradeEvent(
        uint256 operationId,
        address sender,
        address receiver,
        CallerPart callerPart,
        TPFtData tpftData,
        uint256 tpftAmount,
        uint256 unitPrice,
        uint256 financialValue,
        string status,
        uint256 timestamp
    );

    event OperationEvent(
        uint256 operationId,
        uint256 cnpj8Sender,
        uint256 cnpj8Receiver,
        address sender,
        address receiver,
        TPFtData tpftData,
        uint256 tpftAmount,
        uint256 unitPrice,
        uint256 financialValue,
        string status,
        uint256 timestamp
    );

    event OperationTradeEvent(
        uint256 operationId,
        address sender,
        address receiver,
        TPFtData tpftData,
        uint256 tpftAmount,
        uint256 unitPrice,
        uint256 financialValue,
        string status,
        uint256 timestamp
    );

    function auctionPlacement(
        uint256 operationId,
        uint256 cnpj8Sender,
        uint256 cnpj8Receiver,
        CallerPart callerPart,
        TPFtData memory tpftData,
        uint256 tpftAmount,
        uint256 unitPrice
    ) external;
}
