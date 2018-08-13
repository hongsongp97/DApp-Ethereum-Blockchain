pragma solidity ^0.4.24;

contract CarTrading {
    enum OrderStatus {
        Pending,
        Succeeded,
        Cancelled
    }
    struct Order {
        address buyerAddress;
        uint carId;
        uint value;
        OrderStatus status;
    }

    Order[] public orders;
    address public sellerAddress;

    event OrderCreated(
        uint indexed index,
        address indexed buyerAddress,
        uint indexed carId,
        uint value,
        OrderStatus status
    );

    event OrderCompleted(
        uint indexed index,
        OrderStatus status
    );

    constructor(address _sellerAddress) public {
        require(_sellerAddress != address(0), "Seller address must not be empty.");
        sellerAddress = _sellerAddress;
    }

    modifier verifyIndex(uint index) {
        require(index >= 0 && index < orders.length, "Index was out of range.");
        _;
    }

    modifier orderMustBePending(uint index) {
        require(orders[index].status == OrderStatus.Pending, "Order is already completed.");
        _;
    }

    modifier senderMustBeBuyer(uint index) {
        require(msg.sender == orders[index].buyerAddress, "Function must be called by the buyer.");
        _;
    }

    modifier senderMustBeSeller() {
        require(msg.sender == sellerAddress, "Function must be called by the seller.");
        _;
    }

    function getNumberOfOrders() public view returns (uint) {
        return orders.length;
    }

    function createOrder(uint carId) public payable {
        Order memory newOrder = Order({
            buyerAddress: msg.sender,
            carId: carId,
            value: msg.value,
            status: OrderStatus.Pending
        });
        orders.push(newOrder);
        emit OrderCreated(
            orders.length - 1,
            newOrder.buyerAddress,
            newOrder.carId,
            newOrder.value,
            newOrder.status
        );
    }

    function confirmOrder(uint index) public
            verifyIndex(index) senderMustBeBuyer(index) orderMustBePending(index) {
        sellerAddress.transfer(orders[index].value);
        orders[index].status = OrderStatus.Succeeded;
        emit OrderCompleted(index, OrderStatus.Succeeded);
    }

    function cancelOrder(uint index) public payable
            verifyIndex(index) senderMustBeSeller orderMustBePending(index) {
        orders[index].buyerAddress.transfer(orders[index].value + msg.value);
        orders[index].status = OrderStatus.Cancelled;
        emit OrderCompleted(index, OrderStatus.Cancelled);
    }

    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }
}