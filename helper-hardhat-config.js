const networkConfig = {
    31337: {
        name: "localhost",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei
        mintFee: "10000000000000000", // 0.01 ETH
        callbackGasLimit: "500000", // 500,000 gas 2,500,000
    },
    // Price Feed Address, values can be obtained at https://docs.chain.link/data-feeds/price-feeds/addresses
    11155111: {
        name: "sepolia",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        vrfCoordinatorV2_5: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
        gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        callbackGasLimit: "500000", // 500,000 gas
        mintFee: "10000000000000000", // 0.01 ETH
        subscriptionId: "100227758497302891325968943671708928181231008768273162037489151182633611379218", // add your ID here!
    },
}

const DECIMALS = "18"
const INITIAL_PRICE = "2000000000000000000000"
const developmentChains = ["hardhat", "localhost"]

const frontEndContractsFile = "../hardhat-nft-marketplace-nextjs-fcc-moralis/constants/networkMapping.json"
const frontEndAbiLocation = "../hardhat-nft-marketplace-nextjs-fcc-moralis/constants/"


module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_PRICE,
    frontEndAbiLocation,
    frontEndContractsFile
}