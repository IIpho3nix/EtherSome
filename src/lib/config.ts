import fs from "fs";

import cryptoutils from "./cryptoutils.js";
import wallet from "./wallet.js";

let exports: any = {};

const saveWallet = (
  wallet: any,
  path: string,
  password: string,
  // @ts-ignore
  tokens: wallet.token[]
) => {
  let tokenString = "";
  for (let i = 0; i < tokens.length; i++) {
    if (i == tokens.length - 1) {
      tokenString += tokens[i].tokenAddress + "." + tokens[i].tokenSymbol;
    } else {
      tokenString += tokens[i].tokenAddress + "." + tokens[i].tokenSymbol + "|";
    }
  }

  let keyandiv = cryptoutils.generateKeyAndIvFromSeed(password);
  if (wallet.mnemonic && wallet.mnemonic.phrase) {
    const encryptedWallet = cryptoutils.encrypt(
      wallet.privateKey + "|" + wallet.mnemonic.phrase,
      keyandiv.split("|")[0],
      cryptoutils.base64ToBuffer(keyandiv.split("|")[1])
    );
    fs.writeFileSync(path, encryptedWallet + "|" + tokenString);
  } else {
    const encryptedWallet = cryptoutils.encrypt(
      wallet.privateKey + "|NULL",
      keyandiv.split("|")[0],
      cryptoutils.base64ToBuffer(keyandiv.split("|")[1])
    );
    fs.writeFileSync(path, encryptedWallet + "|" + tokenString);
  }
};

exports.saveWallet = saveWallet;

const loadWallet = async (
  path: string,
  password: string,
  providerkey: string
) => {
  let cfg = fs.readFileSync(path, "utf8");
  let keyandiv = cryptoutils.generateKeyAndIvFromSeed(password);
  let tokens: any = [];
  let get = cfg.split("|");
  get.shift();

  if (get[0] != "") {
    for (let i = 0; i < get.length; i++) {
      tokens.push(new wallet.token(get[i].split(".")[0], get[i].split(".")[1]));
    }
  }

  let decrypted = cryptoutils.decrypt(
    cfg.split("|")[0],
    keyandiv.split("|")[0],
    cryptoutils.base64ToBuffer(keyandiv.split("|")[1])
  );
  const walletParts = decrypted.split("|");

  const returnwall = (one: any, two: any) => {
    var wallet = one;
    var tokens = two;
    return {
      wallet: wallet,
      tokens: tokens,
    };
  };

  if (walletParts[1] == null || walletParts[1] == "NULL") {
    return returnwall(
      await wallet.createWalletFromPrivateKey(walletParts[0], providerkey),
      tokens
    );
  } else {
    return returnwall(
      await wallet.createWalletFromMnemonic(walletParts[1], providerkey),
      tokens
    );
  }
};

exports.loadWallet = loadWallet;

export default exports;
