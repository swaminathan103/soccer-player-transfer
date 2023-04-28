const PlayerAuction = artifacts.require("PlayerAuction");

module.exports = function(deployer) {
  deployer.deploy(PlayerAuction);
};
