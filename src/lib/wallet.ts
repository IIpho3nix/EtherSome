import { ethers } from "ethers";

let exports: any = {};
let cachedCoinlist: any = null;
let cachedTokens: any = {};

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const createWallet = async (
  providerkey: string,
  mnemoniclength: 12 | 15 | 18 | 21 | 24 | null
) => {
  if (mnemoniclength == null) {
    mnemoniclength = 12;
  }
  const bytescount = { 12: 16, 15: 20, 18: 24, 21: 28, 24: 32 };
  const mnemonic = ethers.Mnemonic.entropyToPhrase(
    ethers.randomBytes(bytescount[mnemoniclength])
  );

  return createWalletFromMnemonic(mnemonic, providerkey);
};

exports.createWallet = createWallet;

const createWalletFromMnemonic = async (
  mnemonic: string,
  providerkey: string
) => {
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  const provider = new ethers.JsonRpcProvider(providerkey);
  
  return wallet.connect(provider);
};

exports.createWalletFromMnemonic = createWalletFromMnemonic;

const createWalletFromPrivateKey = async (
  privateKey: string,
  providerkey: string
) => {
  const wallet = new ethers.Wallet(privateKey);
  const provider = new ethers.JsonRpcProvider(providerkey);
  return wallet.connect(provider);
};

exports.createWalletFromPrivateKey = createWalletFromPrivateKey;

const transferEther = async (wallet: any, to: string, amount: string) => {
  const tx = {
    to: to,
    value: ethers.parseEther(amount),
  };
  const result = await wallet.sendTransaction(tx);
  return result;
};

exports.transferEther = transferEther;

const getEtherBalance = async (wallet: any) => {
  const balance = await wallet.provider.getBalance(wallet.address);
  return parseFloat(ethers.formatEther(balance));
};

exports.getEtherBalance = getEtherBalance;

const estimateGas = async (wallet: any, to: string, amount: string) => {
  const tx = {
    to: to,
    value: ethers.parseEther(amount),
  };  

  const feeData = await wallet.provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  const gasEstimate = await wallet.estimateGas(tx);
  
  const gas = ethers.formatEther(gasEstimate * gasPrice);
  return gas;
};

exports.estimateGas = estimateGas;

const symbolToId = async (symbol: string) => {
    if (symbol === "eth" || symbol === "ETH") {
      return "Ethereum";
    }

    if (cachedCoinlist == null) {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/list"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch coin list");
      }
      
      const fetchedCoinlist = await response.json();
      cachedCoinlist = fetchedCoinlist;
    }

    const json = cachedCoinlist;
    for (let i = 0; i < json.length; i++) {
      if (json[i].symbol === symbol) {
        return json[i].id;
      }
    }
    return null;
};

exports.symbolToId = symbolToId;

const getPrice = async (amount: number, symbol: string) => {
  const id = await symbolToId(symbol.toLowerCase());
  if (id == null) {
    return null;
  } else {
    if (cachedTokens[id] == null) {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch price for ${id}`);
      }
      
      const json = await response.json();
      cachedTokens[id] = {
        usd: json[id.toLowerCase()].usd,
        cacheTime: Date.now(),
      };
    }else if (Date.now() - cachedTokens[id].cacheTime > 10000) {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch price for ${id}`);
      }
      
      const json = await response.json();
      cachedTokens[id] = {
        usd: json[id.toLowerCase()].usd,
        cacheTime: Date.now(),
      };
    }

    return cachedTokens[id].usd * amount;
  }
};

exports.getPrice = getPrice;

const transferToken = async (
  wallet: any,
  to: string,
  amount: string,
  token: any
) => {
  const contract = new ethers.Contract(
    token.tokenAddress,
    token.tokenABI,
    wallet
  );
  const decimals = await contract.decimals();
  const result = await contract.transfer(to, ethers.parseUnits(amount, decimals));
  return result;
};

exports.transferToken = transferToken;

const getTokenBalance = async (wallet: any, token: any) => {
  const contract = new ethers.Contract(
    token.tokenAddress,
    token.tokenABI,
    wallet
  );
  const balance = await contract.balanceOf(wallet.address);
  const decimals = await contract.decimals();
  return parseFloat(ethers.formatUnits(balance, decimals));
};

exports.getTokenBalance = getTokenBalance;

const estimateTokenGas = async (
  wallet: any,
  to: string,
  amount: string,
  token: any
) => {
  const contract = new ethers.Contract(
    token.tokenAddress,
    token.tokenABI,
    wallet
  );
  const feeData = await wallet.provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  const decimals = await contract.decimals();
  const gasEstimate = await contract.transfer.estimateGas(to, ethers.parseUnits(amount, decimals));
  
  const gas = ethers.formatEther(gasEstimate * gasPrice);
  return gas;
};

exports.estimateTokenGas = estimateTokenGas;

const getTokenSymbol = async (token: any, wallet: any) => {
  const contract = new ethers.Contract(
    token.tokenAddress,
    token.tokenABI,
    wallet
  );
  const symbol = await contract.symbol();
  return symbol;
};

exports.getTokenSymbol = getTokenSymbol;

const getProvider = (network: string) => {
  const provider = new ethers.InfuraProvider("mainnet");
  return "https://" + network + ".infura.io/v3/" + provider.projectId;
};

exports.getProvider = getProvider;

const getChainId = async (providerkey: string) => {
  const provider = new ethers.JsonRpcProvider(providerkey);
  return (await provider.getNetwork()).chainId;
};

exports.getChainId = getChainId;

class token {
  tokenAddress: string;
  tokenSymbol: string;
  tokenABI: string;

  constructor(tokenAddress: string, tokenIdentifier: string) {
    this.tokenAddress = tokenAddress;
    this.tokenSymbol = tokenIdentifier;
    this.tokenABI = require("human-standard-token-abi");
  }
}

exports.token = token;

export default exports;
