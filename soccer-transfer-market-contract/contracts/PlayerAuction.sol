// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract PlayerAuction is ERC721 {

enum BidState {Bidded, Accepted, Rejected}

event ClubRegistered(address indexed club);
event PlayerRegistered(address indexed player, uint256 indexed playerId);
event PlayerUnregistered(address indexed player);
event PlayerPutOnSale(uint256 indexed playerId);
event BidPlaced(address indexed bidder, uint256 indexed playerId, uint256 amount);
event BidAccepted(address indexed seller, address indexed buyer, uint256 indexed playerId, uint256 amount);
event BidRejected(address indexed seller, address indexed buyer, uint256 indexed playerId, uint256 amount);



address public owner;
mapping(address => bool) public registeredClubs;
mapping(address => bool) public registeredPlayers;
mapping(uint256 => address) public playerAddress;
mapping(uint256 => uint256) public playerPrices;
mapping(uint256 => address) public playerOwners;
mapping(uint256 => bool) public playerOnSale;
mapping(uint256 => bool) public playerTransferred;
mapping(uint256 => Bid[]) public bids;
uint256 public numPlayers;

struct Bid {
    address bidder;
    uint256 amount;
    BidState bidStatus; 
}

constructor() ERC721("Soccer Player", "SP") {
    owner = msg.sender;
}



modifier onlyOwner() {
    require(msg.sender == owner, "Only contract owner can call this function.");
    _;
}

modifier onlyClub() {
    require(registeredClubs[msg.sender], "Only registered clubs can call this function.");
    _;
}

modifier onlyPlayer() {
    require(registeredPlayers[msg.sender], "Only registered players can call this function.");
    _;
}

modifier onlyPlayerOnSale(uint256 playerId) {
    require(playerOnSale[playerId], "This player is not on sale.");
    _;
}

modifier onlyPlayerOrClub(uint256 playerId) {
    require(registeredPlayers[msg.sender] || registeredClubs[msg.sender], 
    "This player is not on sale.");
    _;
}

modifier onlyPlayerNotTransferred(uint256 playerId) {
    require(!playerTransferred[playerId], "This player has already been transferred.");
    _;
}

modifier onlyOwnerOf(uint256 playerId) {
    require(msg.sender == playerOwners[playerId], "Not owner of the player");
    _;
}

function registerClub() external {
    registeredClubs[msg.sender] = true;
}

function registerPlayer(address playerAdd, uint256 playerId) external  {
    require(!registeredPlayers[playerAdd], "Player already registered.");
    require(playerAddress[playerId] == address(0), "Key already exist");
    registeredPlayers[playerAdd] = true;
    numPlayers++;
    playerAddress[playerId] = playerAdd;
    playerOwners[playerId] = msg.sender;
    _safeMint(msg.sender, playerId);
    playerOnSale[playerId] = true;
}

function unRegisterPlayer(address player) external onlyOwner  {
    require(registeredPlayers[player] ," Not a registered player");
    numPlayers--;
    registeredPlayers[player] = false;
}

function putPlayerOnSale(uint256 playerId) external  {
    require(registeredPlayers[playerAddress[playerId]], "Player not registered.");
    require(msg.sender == playerOwners[playerId], "You are not the owner of this player.");
    playerOnSale[playerId] = true;
}

function placeBid(uint256 playerId) external payable onlyPlayerOnSale(playerId) {
    require(msg.sender != playerOwners[playerId], "Player owner cant place bid");
    bids[playerId].push(Bid(msg.sender, msg.value, BidState.Bidded));
}

function acceptBid(uint256 playerId, address buyer, uint256 amount) external  onlyPlayerOnSale(playerId) onlyOwnerOf(playerId) {
    address payable buyerAdd = payable(address(buyer));
    address seller = msg.sender;
    uint256 bidIndex = findBidIndex(buyer, playerId, amount);
    bids[playerId][bidIndex].bidStatus = BidState.Accepted;
    transferFrom(playerOwners[playerId], buyerAdd, playerId);
    if(amount != 0) {
     payable(seller).transfer(amount);
    }
    playerOwners[playerId] = buyerAdd;
    playerOnSale[playerId] = false;
    sendRefundtoAddresses(playerId);
}

function rejectBid(uint256 playerId, address buyer, uint256 amount) external onlyPlayerOnSale(playerId) onlyOwnerOf(playerId) {
    uint256 bidIndex = findBidIndex(buyer, playerId, amount);
    bids[playerId][bidIndex].bidStatus = BidState.Rejected;
    payable(bids[playerId][bidIndex].bidder).transfer(amount);
}   


function findBidIndex(address bidder, uint256 playerId, uint256 amt) public view returns (uint256) {
    Bid[] storage bidList = bids[playerId];
    for (uint256 i = 0; i < bidList.length; i++) {
        if (bidList[i].bidder == bidder && bidList[i].amount == amt) {
            return i;
        }
    }
    revert("Bid not found");
}




    function sendRefundtoAddresses(uint256 playerId) internal {
        for (uint i = 0; i < bids[playerId].length; i++) {
            if( bids[playerId][i].bidStatus == BidState.Bidded)
            payable(bids[playerId][i].bidder).transfer(bids[playerId][i].amount);
        }
        delete bids[playerId];
    }


    function getPlayerOwner(uint256 playerId) external view returns (address) {
        return playerOwners[playerId];
    }

    function getAllBids(uint256 playerId) public view returns (Bid[] memory) {
        return bids[playerId];
    }
    
    
   

    
}