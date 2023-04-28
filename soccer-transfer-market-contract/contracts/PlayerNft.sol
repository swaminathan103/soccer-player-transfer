//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract PlayerNFT is ERC721 {
    address public admin;
    mapping(address => Club) public clubs;
    mapping(address => Player) public players;
    mapping(uint256 => address[]) public tokenRequests;

  
    

    struct Club {
        string name;
        string location;
        address clubAddress;
        address[] playerList;
        bool isRegistered;
    }

    struct Player {
        string name;
        uint256 dateOfBirth;
        uint256 contractLength;
        uint256 salary;
        uint256 playerRating;
        uint256 form;
        address playerAddress;
        uint256 baseSellingPrice;
        address currentClub;
        bool isRegistered;
        NFT nft;
    }
    
    struct NFT {
        bool isNFTforSale;
        uint256 nftTokenId;
        address currentNftOwner;
    }

    constructor() ERC721("PlayerNFT", "PNFT") {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only the admin can perform this action");
        _;
    }


    modifier onlyOwnerOf(uint256 tokenId) {
    require(ownerOf(tokenId) == msg.sender, "ERC721: caller is not the owner of the token");
    _;
   }

    modifier onlyRegisteredClubs() {
    require(clubs[msg.sender].isRegistered, "Not a valid registered club");
    _;
   }

   function sendTradeRequest(uint256 tokenId) public onlyRegisteredClubs {
        bool alreadyExists = false;
        for (uint i = 0; i < tokenRequests[tokenId].length; i++) {
            if (tokenRequests[tokenId][i] == msg.sender) {
                alreadyExists = true;
                break;
            }
        }
        if (!alreadyExists) {
            tokenRequests[tokenId].push(msg.sender);
        }
    }

    function getAllTradeRequests(uint256 tokenId) public view onlyOwnerOf(tokenId) returns (address[] memory) {
        return tokenRequests[tokenId];
    }

    function registerClub(
        string memory name,
        string memory location
    ) public {
        require(!clubs[msg.sender].isRegistered, "Club already registered");
        clubs[msg.sender] = Club(name, location, msg.sender, new address[](0), true);
    }

    function unregisterClub(address clubAddress) public onlyAdmin {
        require(clubs[clubAddress].isRegistered, "Club not registered");
        clubs[clubAddress].isRegistered = false;
    }

    function registerPlayer(
        string memory name,
        uint256 age,
        uint256 contractLength,
        uint256 salary,
        uint256 playerRating,
        uint256 form,
        uint256 baseSellingPrice
    ) public {
        require(!players[msg.sender].isRegistered, "Player already registered");
        players[msg.sender] = Player(
            name,
            age,
            contractLength,
            salary,
            playerRating,
            form,
            msg.sender,
            baseSellingPrice,
            address(0),
            true,
            NFT(false, 0, address(0))
        );
    }

    function unregisterPlayer(address playerAddress) public onlyAdmin {
        require(players[playerAddress].isRegistered, "Player not registered");
        players[playerAddress].isRegistered = false;
    }    

    function createPlayerNFT() public returns (uint256) {
    require(players[msg.sender].isRegistered, "Player not registered");
    require(players[msg.sender].nft.nftTokenId == 0, "NFT already created");

    uint256 tokenId = uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp)));
    _safeMint(msg.sender, tokenId);
    players[msg.sender].nft = NFT(true, tokenId, msg.sender);

    return tokenId;
   }

//   function listPlayerNFTForSale(uint256 tokenId) public {
//     require(players[msg.sender].nft.nftTokenId == tokenId, "Player does not own this NFT");
//     require(players[msg.sender].nft.isNFTforSale == false, "NFT already listed for sale");

//     players[msg.sender].nft.isNFTforSale = true;
//  }

 

 function transferPlayerNFTTo(address clubAddress) public  {
    require(clubs[clubAddress].isRegistered, "Club not registered");
    require(players[msg.sender].nft.isNFTforSale, "NFT not listed for sale");
    
    uint256 tokenId = players[msg.sender].nft.nftTokenId;


    safeTransferFrom( msg.sender, clubAddress, tokenId);
    
    players[msg.sender].nft = NFT(false, 0, address(0));
    players[msg.sender].currentClub = clubAddress;
}



function getNFTOwner(uint256 tokenId) public view returns (address) {
    require(_exists(tokenId), "Invalid NFT ID");
    return ownerOf(tokenId);
}

}
