import ethers from "ethers";

let exports: any = {};

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
  const mnemonic = ethers.utils.entropyToMnemonic(
    ethers.utils.randomBytes(bytescount[mnemoniclength])
  );

  return createWalletFromMnemonic(mnemonic, providerkey);
};

exports.createWallet = createWallet;

const createWalletFromMnemonic = async (
  mnemonic: string,
  providerkey: string
) => {
  const wallet = ethers.Wallet.fromMnemonic(mnemonic);
  const provider = new ethers.providers.JsonRpcProvider(providerkey);
  return wallet.connect(provider);
};

exports.createWalletFromMnemonic = createWalletFromMnemonic;

const createWalletFromPrivateKey = async (
  privateKey: string,
  providerkey: string
) => {
  const wallet = new ethers.Wallet(privateKey);
  const provider = new ethers.providers.JsonRpcProvider(providerkey);
  return wallet.connect(provider);
};

exports.createWalletFromPrivateKey = createWalletFromPrivateKey;

const transferEther = async (wallet: any, to: string, amount: string) => {
  const tx = {
    to: to,
    value: ethers.utils.parseEther(amount),
  };
  const result = await wallet.sendTransaction(tx);
  return result;
};

exports.transferEther = transferEther;

const getEtherBalance = async (wallet: any) => {
  const balance = await wallet.getBalance();
  return parseFloat(ethers.utils.formatEther(balance));
};

exports.getEtherBalance = getEtherBalance;

const estimateGas = async (wallet: any, to: string, amount: string) => {
  const tx = {
    to: to,
    value: ethers.utils.parseEther(amount),
  };
  const gasPrice = await wallet.provider.getGasPrice();
  const gas = ethers.utils.formatEther(
    gasPrice.mul(await wallet.estimateGas(tx))
  );
  return gas;
};

exports.estimateGas = estimateGas;

const symbolToName = async (symbol: string) => {
  const response = await ethers.utils.fetchJson(
    "https://api.coingecko.com/api/v3/coins/list"
  );
  const json = await response;
  for (let i = 0; i < json.length; i++) {
    if (json[i].symbol == symbol) {
      return json[i].name;
    }
  }
  return null;
};

exports.symbolToName = symbolToName;

const getPrice = async (amount: number, symbol: string) => {
  const name = await symbolToName(symbol.toLowerCase());
  if (name == null) {
    return null;
  } else {
    const response = await ethers.utils.fetchJson(
      "https://api.coingecko.com/api/v3/simple/price?ids=" +
        name +
        "&vs_currencies=usd"
    );
    const json = await response;
    return json[name.toLowerCase()].usd * amount;
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
  const result = await contract.transfer(to, ethers.utils.parseUnits(amount));
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
  return parseFloat(ethers.utils.formatEther(balance));
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
  const gasPrice = await wallet.provider.getGasPrice();
  const gas = ethers.utils.formatEther(
    gasPrice.mul(
      await contract.estimateGas.transfer(to, ethers.utils.parseUnits(amount))
    )
  );
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
  const provider = new ethers.providers.InfuraProvider("mainnet");
  return "https://" + network + ".infura.io/v3/" + provider.apiKey;
};

exports.getProvider = getProvider;

const getChainId = async (providerkey: string) => {
  const provider = new ethers.providers.JsonRpcProvider(providerkey);
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
