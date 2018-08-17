pragma solidity ^0.4.18;

contract CampaignFactory {
    address[] public deployedCampaigns;
    
    function createCampaign(uint _minimumContribution) public {
        address newCampaign = new Campaign(_minimumContribution, msg.sender);
        deployedCampaigns.push(newCampaign);
    }
}

contract Campaign {
    struct Request {
        string description;
        uint amount;
        address vendor;
        bool complete;
        mapping(address => bool) approvals;
        uint approvalCount;
    }
    
    address public manager;
    uint public minimumContribution;
    mapping(address => bool) public contributors;
    Request[] public requests;
    uint public contributerCount = 0;
    
    constructor(uint _minimumContribution, address _manager) public {
        manager = _manager;
        minimumContribution = _minimumContribution;
    }
    
    function contribute() public payable {
        require(msg.value >= minimumContribution, "Value must be more than minimun contribition");
        
        contributors[msg.sender] = true;
        contributerCount++;
    }
    
    modifier onlyManagerCanCall() {
        require(msg.sender == manager, "Only manager cann call");
        _;
    }
    
    function createRequest(string _description, uint _amount, address _vendor) public onlyManagerCanCall {
        Request memory newRequest = Request({
            description: _description,
            amount: _amount,
            vendor: _vendor,
            complete: false,
            approvalCount: 0
        });
        
        requests.push(newRequest);
    }
    
    function approveRequest(uint requestIndex) public {
        Request storage request = requests[requestIndex];
        
        require(contributors[msg.sender], "Must be contributor");
        require(!request.approvals[msg.sender], "Request must be un-approval");
        
        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }
    
    function finalizeRequest(uint requestIndex) public onlyManagerCanCall {
        Request storage request = requests[requestIndex];
        
        require(!request.complete, "Request is not complete");
        require(request.approvalCount > (contributerCount / 2), "Number of approvals must be more than half");
        
        request.vendor.transfer(request.amount);
        request.complete = true;
    }
}
