const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const { resolve } = require("path")
const { EthersIgnitionHelper } = require("@nomicfoundation/hardhat-ignition-ethers/dist/src/ethers-ignition-helper")
const { isTypedArray } = require("util/types")


!developmentChains.includes(network.name)
?describe.skip:
describe("NftMarketplace", () => {
    let nftMarketplace,basicNft,deployer,player,nftMarketplaceConnected,tokenId,price
    
    beforeEach(async () => {
        deployer=(await getNamedAccounts()).deployer
        player=(await ethers.getSigners())[1]
        await deployments.fixture("all")
        nftMarketplace=await ethers.getContract("NftMarketplace")
        basicNft=await ethers.getContract("BasicNft")
        nftMarketplaceConnected=await ethers.getContract("NftMarketplace",player.address)
        tokenId=0
        price=ethers.parseEther("1")
        basicNft.mintNft()
    })

    describe("listItem",async () => {
       it("should list and buy a nft",async () => {
            await basicNft.approve(nftMarketplace.target,tokenId)
            await nftMarketplace.listItem(basicNft.target,tokenId,price)
            const oldOwner=await basicNft.ownerOf(tokenId)
            await nftMarketplaceConnected.buyItem(basicNft.target,tokenId,{value:price})
            const proceeds=await nftMarketplace.getProceeds(deployer)
            assert.equal(proceeds.toString(),price)
            const newOwner=await basicNft.ownerOf(tokenId)
            assert.equal(oldOwner,deployer)
            // console.log(player.address)
            assert.equal(newOwner,player.address)
            assert.notEqual(oldOwner,newOwner)
       })

       it("only nft owner can list it to marketplace",async () => {
        await basicNft.approve(nftMarketplace.target,tokenId)
        await expect(nftMarketplaceConnected.listItem(basicNft.target,tokenId,price)).to.be.revertedWithCustomError(
            nftMarketplace,
            "NotOwner"
        )
       })

       it("only notListed items can be listed",async () => {
        await basicNft.approve(nftMarketplace.target,tokenId)
        await nftMarketplace.listItem(basicNft.target,tokenId,price)
        await expect(nftMarketplace.listItem(basicNft.target,tokenId,price)).to.be.revertedWithCustomError(
            nftMarketplace,
            "AlreadyListed"
        )
       })

       it("price shouldn't below zero, and should be approve for marketplace",async () => {
            await expect(nftMarketplace.listItem(basicNft.target,tokenId,price)).to.be.revertedWithCustomError(
                nftMarketplace,
                "NotApprovedForMarketplace"
            )
            await basicNft.approve(nftMarketplace.target,tokenId)
            await expect(nftMarketplace.listItem(basicNft.target,tokenId,0)).to.be.revertedWithCustomError(
                nftMarketplace,
                "PriceMustBeAboveZero"
            )
       })

    })

    describe("buyItem",async () => {
        it("only listed item can be bought",async () => {
            await expect(nftMarketplace.buyItem(basicNft.target,tokenId)).to.be.revertedWithCustomError(
                nftMarketplace,
                "NotListed"
            )
        })
        it("can't be bought with price less than listed price",async () => {
            await basicNft.approve(nftMarketplace.target,tokenId)
            await nftMarketplace.listItem(basicNft.target,tokenId,price)
            const buyPrice=ethers.parseEther("0.9")
            await expect(nftMarketplace.buyItem(basicNft.target,tokenId,{value:buyPrice}))
            .to.be.revertedWithCustomError(
                nftMarketplace,
                "PriceNotMet"
            )
        })
    })

    describe("updateListing",async () => {
        it("should update the price of listing",async () => {
            await basicNft.approve(nftMarketplace.target,tokenId)
            await nftMarketplace.listItem(basicNft.target,tokenId,price)
            const updateListPrice=ethers.parseEther("3")
            // console.log((await nftMarketplace.getListing(basicNft.target,0)).price)
            const oldListPrice=(await nftMarketplace.getListing(basicNft.target,tokenId)).price.toString()
            await nftMarketplace.updateListing(basicNft.target,tokenId,updateListPrice)
            const newListPrice=(await nftMarketplace.getListing(basicNft.target,tokenId)).price.toString()
            assert.equal(oldListPrice,price.toString())
            assert.equal(newListPrice,updateListPrice.toString())
        })
    })

    describe("cancelListing",async () => {
        it("canceled listed item can't be bought",async () => {
            await basicNft.approve(nftMarketplace.target,tokenId)
            await nftMarketplace.listItem(basicNft.target,tokenId,price)
            await basicNft.mintNft()
            await basicNft.approve(nftMarketplace.target,tokenId+1)
            await nftMarketplace.listItem(basicNft.target,tokenId+1,price)
            await nftMarketplace.cancelListing(basicNft.target,tokenId+1)
            await expect(nftMarketplace.buyItem(basicNft.target,tokenId,{value:price})).to.emit(
                nftMarketplace,
                "ItemBought"
            )
            await expect(nftMarketplace.buyItem(basicNft.target,tokenId+1,{value:price})).to.be.revertedWithCustomError(
                nftMarketplace,
                "NotListed"
            )
        })
    })

    describe("withdrawProceeds",async () => {
        it("seller should be able to withdraw its proceeds",async () => {
            await basicNft.approve(nftMarketplace.target,tokenId)
            await nftMarketplace.listItem(basicNft.target,tokenId,price)
            await nftMarketplaceConnected.buyItem(basicNft.target,tokenId,{value:price})
            const startingNftMarketplaceBalance=
                await nftMarketplace.runner.provider.getBalance(nftMarketplace.target)
                const startingDeployerBalance=
                await nftMarketplace.runner.provider.getBalance(deployer)
                const transactionResponse=await nftMarketplace.withdrawProceeds()
                const transactionReceipt=await transactionResponse.wait(1)

                const { gasUsed, gasPrice } = transactionReceipt
                const withdrawGasCost = gasUsed*gasPrice

            const endingNftMarketplaceBalance=
            await nftMarketplace.runner.provider.getBalance(nftMarketplace.target)
            const endingDeployerBalance=
            await nftMarketplace.runner.provider.getBalance(deployer)

            assert.equal(startingNftMarketplaceBalance,price)
            assert.equal(endingNftMarketplaceBalance,0)
            assert.equal(startingDeployerBalance+startingNftMarketplaceBalance,
                endingDeployerBalance+withdrawGasCost
            )

            await expect(nftMarketplaceConnected.withdrawProceeds()).to.be.revertedWithCustomError(
                nftMarketplaceConnected,
                "NoProceeds"
            )
        })
    })
    
})