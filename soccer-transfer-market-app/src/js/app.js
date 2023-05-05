// const { createPlayer } = require("../../apis/player");

(
    function() {

        var model = {
            url: 'https://4ff3-2620-cc-8000-1c83-4473-d707-219f-c4c.ngrok-free.app',
            web3: null,
            currentAccount: null,
            currentBalance: "",
            owner: null,
            currentId: null,
            contracts: {},
            userType: null,
            currentPage: "",
            pageTitleMap: {
              clubs: {
                home: 'Home',
                marketplace: 'Marketplace',
                bidsreceived: 'Bids Received',
                yourplayers: 'Your Players',
              },
              players: {
                home: 'Home',
                contractdetails: 'Contract Details',
              },
            },

            data: {
                clubs: {
                  home: [],
                  marketplace: [],
                  bidsreceived: [],
                  yourplayers: [],
                },
                players: {
                    home: [],
                    contractdetails: [],
                },
            }
        }

        var controller = {
            init: async function() {
                console.log("Controller init");

                this.showSpinner()
                this.initOptions()
                await this.initWeb3()
                await this.initContract()
                this.addListeners()
                await this.getViewProps()
                view.renderPage(model.userType, 'home');
            },

            initWeb3: async function() {
                console.log("Initialising Web3");
                web3 = new Web3(new Web3.providers.HttpProvider(model.url));
                web3 = web3
                await ethereum.enable();
                if (window.ethereum) {
                    let accounts = await ethereum.request({ method: 'eth_requestAccounts' })
                    model.currentAccount = web3.utils.toChecksumAddress(accounts[0]);;
                    console.log('Current account:', model.currentAccount);
                } else {
                    console.error('No MetaMask Ethereum provider found!');
                }
            },

            initContract: async function() {
                console.log("Initialising contracts");
                web3Provider = new Web3.providers.HttpProvider(model.url);
                model.contracts.PlayerNFT = await this.loadContract();
                model.contracts.PlayerNFT.setProvider( web3Provider);
            },

            initOptions: function() {
                toastr.options = {
                    "showDuration": "500",
                    "positionClass": "toast-top-right",
                    "preventDuplicates": true,
                    "closeButton": true
                };
            },

            addListeners: function() {
                let pageLinks = document.querySelectorAll(".nav-link");
                pageLinks.forEach((link) => {
                    link.addEventListener("click", (event) => {
                        event.preventDefault();
                        let pageName = link.getAttribute("href");
                        var current = document.getElementsByClassName("active");
                        current[0].className = current[0].className.replace(" active", "");
                        link.className += " active";
                        view.renderPage(model.userType, pageName);
                    });
                });

                window.ethereum.on('accountsChanged', function (){
                    console.log("changes");
                    location.reload();
                })
            },

            addButtonEvents: function() {
                let yourBidsButtons = document.getElementsByClassName("your-bid-button")
                let responseBidsButtons = document.getElementsByClassName("response-bid-button")
                let contractBidsButtons = document.getElementsByClassName("contract-bid-button")
                let playerContractBidsButtons = document.getElementsByClassName("player-contract-bid-button")
                let proposeContractSubmit = document.getElementById('proposalForm')

                proposeContractSubmit.onsubmit = controller.proposeContract


                if (yourBidsButtons.length > 0) {
                    Array.from(yourBidsButtons).forEach((button) => {
                        button.onclick = controller.submitBid
                    })
                }

                if (responseBidsButtons.length > 0) {
                    Array.from(responseBidsButtons).forEach((button) => {
                        button.onclick = controller.responseBidClicked
                    })
                }

                if (contractBidsButtons.length > 0) {
                    Array.from(contractBidsButtons).forEach((button) => {
                        button.onclick = controller.contractBidClicked
                    })
                }

                if (playerContractBidsButtons.length > 0) {
                    Array.from(playerContractBidsButtons).forEach((button) => {
                        button.onclick = controller.playerContractBidClicked
                    })
                }
            },

            showEmittedEvents: function (result) {
                let excludeList = ["approval", "transfer"]
                result.logs.forEach((log) => {
                    if (!excludeList.includes(log.event.toLowerCase())) {
                        this.throwToast("EVENT - " + log.event)
                    }
                })
            },

            throwToast: function(msg, type) {
                switch (type) {
                    case TOAST_TYPE.error:
                        toastr.error(msg);
                        break;
                    case TOAST_TYPE.success:
                        toastr.success(msg);
                        break
                    default:
                        toastr.info(msg);
                }
            },

            showSpinner: function() {
                const overlay = document.getElementById("overlay");
                const spinner = document.getElementById("spinner");

                overlay.style.display = "block";
                spinner.style.display = "block";
            },

            hideSpinner: function() {
                const overlay = document.getElementById("overlay");
                const spinner = document.getElementById("spinner");

                overlay.style.display = "none";
                spinner.style.display = "none";
            },

            registerClub: async function(e) {
                e.preventDefault();

                const clubName = document.querySelector('#club-name').value;
                const clubLocation = document.querySelector('#club-location').value;

                let club = new Club(
                    clubName,
                    clubLocation,
                    model.currentAccount
                )
                let response = await sendRequest('clubs', club, 'POST')
                if (response.error) {
                    this.throwToast('Unable to register Club ' + ' ' + response.error, TOAST_TYPE.error)
                    return
                }

                const playerNft = await model.contracts.PlayerNFT.deployed();
                let errorMsg = null
                let result = await playerNft.registerClub(
                    {from: model.currentAccount}
                ).catch((e) => errorMsg = e)

                if (result && result.logs.length > 0) {
                    this.showEmittedEvents(result)
                }

                if (errorMsg == null) {
                    model.userType = USER_TYPE.club
                    await this.setCurrentId()
                    this.throwToast("Created Club Successfully", TOAST_TYPE.success)
                    view.renderPage(model.userType, 'home')
                } else {
                    this.throwToast('Unable to register Club ' + ' ' + errorMsg, TOAST_TYPE.error)
                }
            },

            registerPlayer: async function(e) {
                e.preventDefault();

                const playerName = document.querySelector('#player-name').value;
                const playerAge = document.querySelector('#player-age').value;
                const playerContractLength = document.querySelector('#player-contract-length').value;
                const playerSalary = document.querySelector('#player-salary').value;
                const playerRating = document.querySelector('#player-rating').value;
                const playerForm = document.querySelector('#player-form-value').value;
                const playerSellingPrice = document.querySelector('#player-selling-price').value;

                let player = new Player(
                    playerName,
                    playerAge,
                    playerContractLength,
                    playerSalary,
                    playerRating,
                    playerForm,
                    playerSellingPrice,
                    model.currentAccount
                )
                let response = await sendRequest('players', player, 'POST')
                if (response.error) {
                    this.throwToast('Unable to register player ' + ' ' + response.error, TOAST_TYPE.error)
                    return
                }

                const playerNft = await model.contracts.PlayerNFT.deployed();
                let errorMsg = null
                let result = await playerNft.registerPlayer(
                    model.currentAccount,
                    response.id,
                    {from:model.currentAccount}
                ).catch((e) => errorMsg = e)

                if (result && result.logs.length > 0) {
                    this.showEmittedEvents(result)
                }

                if (errorMsg == null) {
                    model.userType = USER_TYPE.player
                    await this.setCurrentId()
                    this.throwToast("Created Player Successfully", TOAST_TYPE.success)
                    view.renderPage(model.userType, 'home')
                } else {
                    this.throwToast('Unable to register player ' + ' ' + errorMsg, TOAST_TYPE.error)
                }
            },

            createPlayerObj: function(data) {
                return new Player(
                    data.name,
                    data.age,
                    data.contract_length,
                    data.salary,
                    data.player_rating,
                    data.form,
                    data.base_selling_price,
                    model.currentAccount
                )
            },

            createClubObj: function(data) {
                return new Club (
                    data.name,
                    data.location,
                    model.currentAccount
                )
            },

            setCurrentId: async function() {
                model.currentId = await sendRequest(`${model.userType}/address/${model.currentAccount}`)
                console.log(model.currentId);
            },

            getViewProps: async function() {
                const playerNft = await model.contracts.PlayerNFT.deployed();
                // await playerNft.putPlayerOnSale(10, {from: model.currentAccount})
                // await playerNft.putPlayerOnSale(10, {from: "0x76B90D572e47e974EA794cd3b51dc7f5f702A611"})
                // await playerNft.placeBid(10, {from: model.currentAccount, value: web3.utils.toWei('0', 'ether')})
                // let result = await playerNft.methods['bids(uint256,uint256)'].call(10, 0)
                // await playerNft.acceptBid(10, "0xBFf81b126876fAdadf69378d8856a28FdC554Dc0", web3.utils.toWei('0', 'ether'), {from:"0x76B90D572e47e974EA794cd3b51dc7f5f702A611"})
                // await playerNft.acceptBid(10, "0x76B90D572e47e974EA794cd3b51dc7f5f702A611", web3.utils.toWei('0', 'ether'), {from:model.currentAccount})
                // console.log(result);
                // await playerNft.unregisterClub(model.currentAccount, {from: "0xBFf81b126876fAdadf69378d8856a28FdC554Dc0"})
                // await playerNft.unRegisterPlayer(model.currentAccount, {from: "0xBFf81b126876fAdadf69378d8856a28FdC554Dc0"})
                let player = await playerNft.methods['registeredPlayers(address)']
                                    .call(model.currentAccount)
                                    .catch(() => null)

                if (player == true) {
                    model.userType = USER_TYPE.player
                    await this.setCurrentId()
                    return
                }

                let club = await playerNft.methods['registeredClubs(address)']
                                    .call(model.currentAccount)
                                    .catch(() => null)

                if (club == true) {
                    model.userType = USER_TYPE.club
                    await this.setCurrentId()
                    return
                }

                model.userType = null

            },

            getHomeViewData: async function(pageName) {
                let userType = model.userType
                let endpoint = `${userType}/${model.currentId}`
                let userData = await sendRequest(endpoint)
                let bids = await sendRequest(`/bids/club/${model.currentId}`)
                await controller.getCurrentWalletBalance()
                delete userData.contract_length
                delete userData.salary

                let pageData = [{
                    title: userData.name,
                    content: userData,
                    classNames: "title"
                }]
                pageData.push({
                    title: "Wallet Address",
                    value: model.currentAccount
                },
                {
                    title: "Wallet Balance",
                    value: model.currentBalance
                }
                )

                if (userType == USER_TYPE.club) {
                    let allPlayers = await sendRequest(`/players/club/${model.currentId}`)
                    pageData.push({
                        title: "Total Players",
                        value: allPlayers.length || 0
                    },
                    {
                        title: "Pending Bids",
                        value: bids.length || 0
                    }
                    )
                }

                if (userType == USER_TYPE.player) {
                    const playerNft = await model.contracts.PlayerNFT.deployed();
                    model.owner = await playerNft.getPlayerOwner(model.currentId)
                    pageData.push({
                        title: "NFT Status",
                        value: "Created"
                    },
                    {
                        title: "Owner",
                        value: model.owner || 'NA'
                    })
                }
                model.data[userType][pageName] = pageData;
            },

            getMarketPlaceData: async function(pageName) {
                let userType = model.userType
                let endpoint = `players/not-in-club/${model.currentId}`
                let userData = await sendRequest(endpoint)
                let pageData = []

                userData.forEach((user) => {
                    let content = {
                        id: user.id,
                        player_name: user.name,
                        club: user.club_name,
                        age: user.age,
                        form: user.form,
                        player_rating: user.player_rating,
                        market_value: user.base_selling_price + " ETH"
                    }

                    pageData.push({
                        content: content
                    })

                })

                model.data[userType][pageName] = pageData;
            },

            getBidsReceivedData: async function(pageName) {
                let userType = model.userType
                let endpoint = `bids/club/${model.currentId}`
                let pageData = []
                let bids = await sendRequest(endpoint)

                bids.forEach((bid) => {
                    let content = {
                        bid_id: bid.id,
                        id: bid.player_id,
                        player_name: bid.name,
                        club_id: bid.from_club_id,
                        club: bid.from_club_name,
                        age: bid.age,
                        form: bid.form,
                        market_value: bid.base_selling_price,
                        bid_value: bid.bid_amount,
                    }

                    pageData.push({
                        content: content
                    })
                })

                model.data[userType][pageName] = pageData;
            },

            getYourPlayersData: async function(pageName) {
                let userType = model.userType
                let endpoint = `players/club/${model.currentId}`
                let userData = await sendRequest(endpoint)
                let pageData = []

                if (userData[0] == null) {
                    model.data[userType][pageName] = []
                    return
                }

                userData.forEach((user) => {
                    let content = {
                        id: user.id,
                        player_name: user.name,
                        form: user.form,
                        age: user.age,
                        market_value: user.base_selling_price,
                        salary: user.salary,
                        contract_length: user.contract_length
                    }

                    pageData.push({
                        content: content
                    })

                })

                model.data[userType][pageName] = pageData;
            },

            getContractDetails: async function(pageName) {
                let userType = model.userType
                let endpoint = `${userType}/${model.currentId}`
                let userData = await sendRequest(endpoint)
                let pageData = []

                let newContractData = []

                if (userData.club_id != null) {
                    pageData.push({
                        title: "Current Contract Details",
                        content: {
                            length: userData.contract_length,
                            salary: userData.salary
                        }
                    })

                    let endpoint = `extension/${model.currentId}`
                    let contractData = await sendRequest(endpoint)
                    if (contractData.length > 0) {
                        contractData.forEach((contract) => {
                            newContractData.push({
                                contract_id: contract.id,
                                club: contract.club_name,
                                length: contract.length,
                                salary: contract.salary_increase
                            })
                        })
                    }

                } else {
                    let bidsData = await sendRequest(`/bids/player/${model.currentId}`)
                    if (bidsData.length != 0) {
                        bidsData.forEach((bid) => {
                            newContractData.push({
                                bid_id: bid.id,
                                club_id: bid.from_club_id,
                                club_name: bid.from_club_name,
                                length: userData.contract_length,
                                salary: userData.salary,
                                bid_value: bid.bid_amount,
                            })
                        })
                    }
                    pageData.push({
                        title: "Current Contract Details",
                        value: "Not part of any club yet!"
                    })
                }

                if (newContractData.length == 0) {
                    pageData.push({
                        title: "Proposed Contract Details",
                        value: "No contract proposed yet!"
                    })
                } else {
                    newContractData.forEach ((contract) => {
                        pageData.push({
                            title: "Proposed Contract Details",
                            content: contract,
                        })
                    })
                }
                model.data[userType][pageName] = pageData;
            },
 
            getViewData: async function(pageName) {
                if (pageName == PAGE_NAME.home) {
                    await this.getHomeViewData(pageName)
                } else if (pageName == PAGE_NAME.marketplace) {
                    await this.getMarketPlaceData(pageName)
                } else if (pageName == PAGE_NAME.bidsreceived) {
                    await this.getBidsReceivedData(pageName)
                } else if (pageName == PAGE_NAME.yourplayers) {
                    await this.getYourPlayersData(pageName)
                } else {
                    await this.getContractDetails(pageName)
                }
            },

            loadContract: async function() {
                try {
                    const response = await fetch(GENERIC_CONSTANTS.playerNFTJson);
                    const data = await response.json();
                    const playerNFT = TruffleContract(data);
                    return playerNFT
                } catch (error) {
                  console.error('Error loading contract JSON file:', error);
                }
            },

            getCurrentWalletBalance: async function () {
                try {
                    let result = await web3.eth.getBalance(model.currentAccount)
                    model.currentBalance = web3.utils.fromWei(result, "ether").substring(0,6) + " ETH"
                } catch (error) {
                    this.throwToast(error, TOAST_TYPE.error)
                }
            },

            submitBid: async function(e) {
                console.log(e);
                let id = e.target.id.split("-").pop()
                let bidContainer = e.target.parentElement.parentElement
                let playerId = parseInt(bidContainer.querySelector("#id-value").innerText)
                let bidValue = document.getElementById("bid-" + id).value

                const playerNft = await model.contracts.PlayerNFT.deployed();
                try {
                    let result = await playerNft.placeBid(playerId,
                        {from: model.currentAccount,
                            value: web3.utils.toWei(bidValue, 'ether')
                        })

                    let endpoint = `/bid`
                    let body = {
                        "bid_amount": bidValue,
                        "player_id": playerId,
                        "from_club_id": model.currentId
                    }

                    controller.showEmittedEvents(result)
                    await sendRequest(endpoint, body, "POST")
                    controller.throwToast("Placed bid successfully", TOAST_TYPE.success)
                    view.reload()
                } catch (error) {
                    controller.throwToast("unable to place bid" + error, TOAST_TYPE.error)
                }
            },

            responseBidClicked: async function(e) {
                let id = e.target.id.split("-").pop()
                let title = e.target.innerHTML
                let bidContainer = e.target.parentElement.parentElement
                let playerId = parseInt(bidContainer.querySelector("#id-value").innerText)
                let bidId = parseInt(bidContainer.querySelector("#bid_id-value").innerText)
                let bidValue = bidContainer.querySelector("#bid_value-value").innerText
                let buyerId = bidContainer.querySelector("#club_id-value").innerText
                let buyerAddress = await sendRequest(`club_addresses/${buyerId}`)
                console.log(playerId, bidValue, buyerId, buyerAddress);
                await controller.sendResponseToBid(title, playerId, bidValue, buyerId, buyerAddress, bidId)
            },

            sendResponseToBid: async function(title, playerId, bidValue, buyerId, buyerAddress, bidId) {
                const playerNft = await model.contracts.PlayerNFT.deployed();
                if (title.toLowerCase().includes("accept")) {
                    try {
                        let result = await playerNft.acceptBid(playerId, 
                            buyerAddress, 
                            web3.utils.toWei(bidValue, 'ether'), 
                            {from:model.currentAccount}
                        )
                        await sendRequest(`players/${playerId}`, {"club_id":buyerId, "base_selling_price":bidValue}, "PUT")
                        await sendRequest(`/bids/make-bids-inactive/${playerId}`, {}, "PUT")
                        controller.showEmittedEvents(result)
                        controller.throwToast("Player Sold!", TOAST_TYPE.success)
                        view.reload()
                    } catch (error) {
                        controller.throwToast("Unable to accept bid" + error, TOAST_TYPE.error)
                    }
                } else {
                    try {
                        let result = await playerNft.rejectBid(playerId, 
                            buyerAddress, 
                            web3.utils.toWei(bidValue, 'ether'), 
                            {from:model.currentAccount}
                        )
                        await sendRequest(`/bids/make-bid-inactive/${bidId}`, {}, "PUT")
                        controller.showEmittedEvents(result)
                        controller.throwToast("Bid Rejected!", TOAST_TYPE.success)
                        view.reload()
                    } catch (error) {
                        controller.throwToast("Unable to reject bid" + error, TOAST_TYPE.error)
                    }
                }
            },

            contractBidClicked: async function(e) {
                let title = e.target.innerHTML
                let bidContainer = e.target.parentElement.parentElement
                let playerId = parseInt(bidContainer.querySelector("#id-value").innerText)

                if (title == "Terminate Contract") {
                    const playerNft = await model.contracts.PlayerNFT.deployed();
                    try {
                        let result = await playerNft.transferOwnership(playerId, {from:model.currentAccount})
                        await sendRequest(`players/${playerId}`, {club_id: null}, "PUT")
                        controller.showEmittedEvents(result)
                        controller.throwToast("PLayer contract terminated successfully! The player is no longer part of the club!", TOAST_TYPE.success)
                        view.reload()
                    } catch (error) {
                        controller.throwToast("Unable to Terminate Contract " + error, TOAST_TYPE.error)
                    }

                } else if (title == "Propose New Contract") {
                    let proposeContractSubmit = document.getElementById('submitProposalBtn')
                    proposeContractSubmit.setAttribute("data-player-id", playerId)
                } else {
                    // Put player for Sale
                    const playerNft = await model.contracts.PlayerNFT.deployed();
                    try {
                        let result = await playerNft.putPlayerOnSale(playerId, {from: model.currentAccount})
                        controller.showEmittedEvents(result)
                        controller.throwToast("Player put on for Sale!", TOAST_TYPE.success)
                    } catch (error) {
                        controller.throwToast("Unable to put player for sale " + error, TOAST_TYPE.error)
                    }
                }
            },

            playerContractBidClicked: async function(e) {
                let title = e.target.innerHTML
                let bidContainer = e.target.parentElement.parentElement
                let playerId = model.currentId
                let bidElement = bidContainer.querySelector("#bid_value-value")
                if (bidElement) {
                    let bidId = parseInt(bidContainer.querySelector("#bid_id-value").innerText)
                    let bidValue = bidContainer.querySelector("#bid_value-value").innerText
                    let buyerId = bidContainer.querySelector("#club_id-value").innerText
                    let buyerAddress = await sendRequest(`club_addresses/${buyerId}`)
                    console.log(playerId, bidValue, buyerId, buyerAddress);
                    await controller.sendResponseToBid(title, playerId, bidValue, buyerId, buyerAddress, bidId)
                } else {
                    // It is a contract extension
                    let contractId = parseInt(bidContainer.querySelector("#contract_id-value").innerText)
                    if (title.toLowerCase() == "accept") {
                        let length = parseInt(bidContainer.querySelector("#length-value").innerText)
                        let salary = parseInt(bidContainer.querySelector("#salary-value").innerText)
                        let playerEndpoint = `players/${model.currentId}`
                        let contractEndpoint = `extension/${contractId}`
                        let playerBody = {
                            contract_length: length,
                            salary: salary
                        }

                        let contractBody = {
                            active: false
                        }

                        try {
                            await sendRequest(playerEndpoint, playerBody, "PUT")
                            await sendRequest(contractEndpoint, contractBody, "PUT")
                            controller.throwToast("Contract Accepted!", TOAST_TYPE.success)
                            view.reload()
                        } catch (error) {
                            controller.throwToast("Unable to accept contract " + error , TOAST_TYPE.error)
                        }
                    } else {
                        let contractEndpoint = `extension/${contractId}`
                        let contractBody = {
                            active: false
                        }
                        try {
                            await sendRequest(contractEndpoint, contractBody, "PUT")
                            controller.throwToast("Contract Rejected!", TOAST_TYPE.success)
                            view.reload()
                        } catch (error) {
                            controller.throwToast("Unable to reject contract " + error , TOAST_TYPE.error)
                        }
                    }
                }
            },

            proposeContract: async function (e) {
                e.preventDefault()
                let closeButton = document.getElementById("closeProposalBtn")
                let proposeContractSubmit = document.getElementById('submitProposalBtn')
                let playerId = proposeContractSubmit.getAttribute('data-player-id');
                const salary = document.getElementById("salaryInput").value;
                const length = document.getElementById("lengthInput").value;
                console.log("Player ID: " + playerId + ", Salary: " + salary + ", Length: " + length);

                let endpoint = `extension`
                let body = {
                    player_id: playerId,
                    club_id: model.currentId,
                    length: length,
                    salary_increase: salary
                }

                try {
                    await sendRequest(endpoint, body, "POST")
                    controller.throwToast("Contract proposed! Waiting for player to accept!", TOAST_TYPE.success)
                    closeButton.click()
                    document.getElementById('proposalForm').reset();
                } catch (error) {
                    controller.throwToast("Unable to propose contract + " + error, TOAST_TYPE.error)
                }
            }
        }

        var view = {

            reload: function() {
                this.renderPage(model.userType, model.currentPage)
            },

            renderRegisterView: function() {
                const registerOptionsContainer =  document.querySelector('#register-option-container');
                registerOptionsContainer.style.display = "flex"

                this.addRegisterListeners()
                controller.hideSpinner()

            },

            hideRegisterView: function() {
                const registerOptionsContainer =  document.querySelector('#register-option-container');
                registerOptionsContainer.style.display = "none"
            },

            renderForm: function( e ) {
                const formContainer = document.querySelector('#form-container');
                const clubFormContainer = document.querySelector('#club-form');
                const playerFormContainer = document.querySelector('#player-form');
                e.preventDefault()
                this.hideRegisterView()
                this.addFormEvents()

                type = e.target.textContent
                if (type.toLowerCase() == "club") {
                    clubFormContainer.style.display = 'block'
                    playerFormContainer.style.display = 'none'
                } else {
                    clubFormContainer.style.display = 'none'
                    playerFormContainer.style.display = 'block'
                }

                formContainer.style.display = 'block'
                controller.hideSpinner()
            },

            hideForm: function() {
                const formContainer = document.querySelector('#form-container');
                formContainer.style.display = 'none'
            },

            renderPlayerView: function() {
                this.hideRegisterView()
                const homeLink = document.querySelector('.navbar-nav .nav-link[href="home"]');
                const marketplaceLink = document.querySelector('.navbar-nav .nav-link[href="marketplace"]');
                const bidsReceivedLink = document.querySelector('.navbar-nav .nav-link[href="bidsreceived"]');
                const yourPlayersLink = document.querySelector('.navbar-nav .nav-link[href="yourplayers"]');
                const contractDetailsLink = document.querySelector('.navbar-nav .nav-link[href="contractdetails"]');

                homeLink.style.display = 'block';
                contractDetailsLink.style.display = 'block';
                marketplaceLink.style.display = 'none'
                bidsReceivedLink.style.display = 'none'
                yourPlayersLink.style.display = 'none'
            },

            renderClubView: function() {
                this.hideRegisterView()
                const homeLink = document.querySelector('.navbar-nav .nav-link[href="home"]');
                const marketplaceLink = document.querySelector('.navbar-nav .nav-link[href="marketplace"]');
                const bidsReceivedLink = document.querySelector('.navbar-nav .nav-link[href="bidsreceived"]');
                const yourPlayersLink = document.querySelector('.navbar-nav .nav-link[href="yourplayers"]');
                const contractDetailsLink = document.querySelector('.navbar-nav .nav-link[href="contractdetails"]');

                homeLink.style.display = 'block';
                marketplaceLink.style.display = 'block'
                bidsReceivedLink.style.display = 'block'
                yourPlayersLink.style.display = 'block'
                contractDetailsLink.style.display = 'none';
                controller.hideSpinner()
            },

            addRegisterListeners: function() {
                const playerBtn = document.querySelector("#player-btn")
                const clubBtn = document.querySelector("#club-btn")

                playerBtn.addEventListener('click', this.renderForm.bind(this))
                clubBtn.addEventListener('click', this.renderForm.bind(this))
            },

            addFormEvents: function() {
                const clubForm = document.querySelector('#club-form');
                const playerForm = document.querySelector('#player-form');
                clubForm.addEventListener('submit', controller.registerClub.bind(controller));
                playerForm.addEventListener('submit', controller.registerPlayer.bind(controller));
            },

            renderPage: async function(userType, pageName) {
                controller.showSpinner()
                this.hideForm()
                if (userType == null) {
                    this.renderRegisterView()
                    return
                }

                await controller.getViewData(pageName)

                if (userType == USER_TYPE.player) {
                    this.renderPlayerView()
                    // let player = controller.createPlayerObj(data)
                    // if (data.club != null) {
                    //     let club = controller.createClubObj(data.club)
                    // }
                } else {
                    this.renderClubView()
                    // let club = controller.createClubObj(data)
                    // controller.generateViewData(data, 'home')
                }

                controller.hideSpinner()

                const pageData = model.data[userType][pageName];

                // Set the page title
                const pageTitle = model.pageTitleMap[userType][pageName];
                document.title = `Soccer Marketplace - ${pageTitle}`;

                // Render the cards
                let cardHtml = pageData.map((cardData, ind) => {
                  let buttonsHtml = '';
                  if (pageName === PAGE_NAME.marketplace) {
                    buttonsHtml = `
                        <div class = "your-bid-container">
                            <label>Your Bid (in ETH): </label>
                            <input id="bid-${ind}" type="number" step="0.001" name="player-bid" required>
                            <button id="submit-${ind}" class="your-bid-button btn btn-primary" type="button" class="btn btn-success">Submit</button>
                        </div>
                    `;
                  } else if (pageName === PAGE_NAME.bidsreceived) {
                    buttonsHtml = `
                        <div class = "response-bid-container">
                            <button id="accept-${ind}" type="button" class="response-bid-button btn btn-success">Accept Bid</button>
                            <button id="reject-${ind}" type="button" class="response-bid-button btn btn-danger">Reject Bid</button>
                        </div>
                    `;
                  } else if (pageName === 'yourplayers') {
                    buttonsHtml = `
                        <div class = "contract-bid-container">
                            <button id="contract-accept-${ind}" type="button"  class="contract-bid-button btn btn-success" data-bs-toggle="modal" data-bs-target="#proposalModal">Propose New Contract</button>
                            <button id="contract-sale-${ind}" type="button" class="contract-bid-button btn btn-warning">Place Player for Sale</button>
                            <button id="contract-reject-${ind}" type="button" class="contract-bid-button btn btn-danger">Terminate Contract</button>
                        </div>
                    `;
                  } else if (pageName === PAGE_NAME.contractdetails) {
                    if (cardData.title == "Proposed Contract Details" && cardData.content != null) {
                        buttonsHtml = `
                            <div class = "player-contract-bid-container">
                                <button id="player-accept-${ind}" type="button" class="player-contract-bid-button btn btn-success">Accept</button>
                                <button id="player-reject-${ind}" type="button" class="player-contract-bid-button btn btn-danger">Reject</button>
                            </div>
                        `;
                    }
                  }

                  return `
                    <div class="card mx-auto mb-3 ${cardData.classNames ? cardData.classNames : ''}">
                      <div class="card-body">
                        ${cardData.title ? `<div class="card-title">${cardData.title}</div>` : ''}
                        ${
                            `<div class="card-text">
                            ${
                                // cardData.content ? cardData.content : cardData.value
                                (() => {
                                    if (cardData.content != null) {
                                        let titleContent = ''
                                        Object.entries(cardData.content).forEach(([key, value]) => {
                                            excludeList = ["id", "name", "club_id", "bid_id", "contract_id"]
                                            if (value != null && !excludeList.includes(key)) {
                                                titleContent += `<div class="title-container">`
                                                titleContent += (`<div id=${key}-label  class="title-label">
                                                    ${KEY_LABEL_MAP[key]}:
                                                </div>
    
                                                <div id=${key}-value class="title-value">
                                                    ${value}
                                                </div>
                                                `)
                                            } else {
                                                titleContent += `<div class="title-container" style="display:none;">`
                                                titleContent += (`<div id=${key}-label class="title-label" style="display:none;">${key}</div>
                                                    <div id=${key}-value class="title-value" style="display:none;">${value}</div>
                                            `)
                                            }
                                            titleContent += `</div>`
                                        })
                                        return titleContent
                                    }
                                    return cardData.value
                                })()
                            }
                            </div>`
                        }
                        ${buttonsHtml}
                      </div>
                    </div>
                  `;
                });

                if (pageData.length == 0) {
                    cardHtml = ['<div class="empty-container">No data to display</div>']
                }

                // Render the page content
                const pageContentHtml = `
                  ${cardHtml.join('')}
                `;
                document.querySelector('.page-content').innerHTML = pageContentHtml;
                controller.addButtonEvents()
                model.currentPage = pageName

            }

        }

        controller.init()
    }
)();