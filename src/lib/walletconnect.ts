import WalletConnect from "@walletconnect/client";

import sigutil, { MessageTypes, TypedMessage } from "@metamask/eth-sig-util";

import chalk from "chalk";

import ethers from "ethers";

import question from "./question.js";

let doloop = false;

let requests: any[] = [];

let exports: any = {};

const showBanner = () => {
  console.clear();
  console.log(
    chalk.blue(
      ` _____   _     _                     ____                             
| ____| | |_  | |__     ___   _ __  / ___|    ___    _ __ ___     ___ 
|  _|   | __| | '_ \\   / _ \\ | '__| \\___ \\   / _ \\  | '_ ` +
        "`" +
        ` _ \\   / _ \\
| |___  | |_  | | | | |  __/ | |     ___) | | (_) | | | | | | | |  __/
|_____|  \\__| |_| |_|  \\___| |_|    |____/   \\___/  |_| |_| |_|  \\___|
    ` +
        "                                                                  v" +
        process.env.npm_package_version
    )
  );
};

const manageRequests = async (connector: any, wallet: any) => {
  const strings: string[] = [];
  for (let i = 0; i < requests.length; i++) {
    strings.push(requests[i].method + " - " + requests[i].id);
  }

  await question
    .pickList("Which Request Would You Like To Manage", strings)
    .then(async (value: any) => {
      const payload = requests[strings.indexOf(value.answer)];
      showBanner();
      console.log(payload);
      await handleApprove(payload, connector, wallet);
    });
};

const loop = async (connector: any, wallet: any) => {
  await question
    .pickList("What Would You Like To Do", ["Manage Requests", "Quit"])
    .then(async (value: any) => {
      showBanner();
      switch (value.answer) {
        case "Quit":
          connector.killSession().catch(() => {});
          connector = null;
          doloop = false;
          break;
        case "Manage Requests":
          if (requests.length > 0) {
            await manageRequests(connector, wallet);
          } else {
            console.log(chalk.red("No Requests To Manage"));
          }
      }
    });

  if (doloop) {
    loop(connector, wallet);
  }
};

const handleApprove = async (payload: any, connector: any, wallet: any) => {
  showBanner();
  console.log(payload);
  await question
    .pickList("What Do you Want To Do With This Request", ["Approve", "Reject"])
    .then(async (value: any) => {
      switch (value.answer) {
        case "Approve":
          if (payload.method === "personal_sign") {
            try {
              connector.approveRequest({
                id: payload.id,
                result: await wallet.signMessage(
                  ethers.utils.arrayify(payload.params[0])
                ),
              });
              showBanner();
            } catch (e) {
              showBanner();
              console.log(chalk.red("Error Signing Message"));
              connector.rejectRequest({
                id: payload.id,
                error: {
                  code: "ERROR",
                  message: "A Error Occured",
                },
              });
            }
          } else if (payload.method === "eth_sign") {
            try {
              connector.approveRequest({
                id: payload.id,
                result: await wallet.signMessage(
                  ethers.utils.arrayify(payload.params[1])
                ),
              });
              showBanner();
            } catch (e) {
              showBanner();
              console.log(chalk.red("Error Signing Message"));
              connector.rejectRequest({
                id: payload.id,
                error: {
                  code: "ERROR",
                  message: "A Error Occured",
                },
              });
            }
          } else if (payload.method === "eth_signTypedData") {
            try {
              const typedData: TypedMessage<MessageTypes> = JSON.parse(
                payload.params[1]
              );
              const privateKey: Buffer = Buffer.from(
                ethers.utils.arrayify(wallet.privateKey)
              );
              const version = sigutil.SignTypedDataVersion.V4;
              const signature = sigutil.signTypedData({
                privateKey,
                data: typedData,
                version,
              });
              connector.approveRequest({
                id: payload.id,
                result: signature,
              });
              showBanner();
            } catch (e) {
              showBanner();
              console.log(chalk.red("Error Signing Typed Data"));
              connector.rejectRequest({
                id: payload.id,
                error: {
                  code: "ERROR",
                  message: "A Error Occured",
                },
              });
            }
          } else if (payload.method === "eth_sendTransaction") {
            try {
              const tx = {
                to: payload.params[0].to,
                from: payload.params[0].from,
                gasPrice: payload.params[0].gasPrice,
                gasLimit: payload.params[0].gas,
                value: payload.params[0].value,
                data: payload.params[0].data,
                nonce: payload.params[0].nonce,
              };
              const result = await wallet.sendTransaction(tx);
              connector.approveRequest({
                id: payload.id,
                result: result.hash,
              });
              showBanner();
            } catch (e) {
              showBanner();
              console.log(chalk.red("Error Sending Transaction"));
              connector.rejectRequest({
                id: payload.id,
                error: {
                  code: "ERROR",
                  message: "A Error Occured",
                },
              });
            }
          } else if (payload.method === "eth_signTransaction") {
            try {
              const tx = {
                to: payload.params[0].to,
                from: payload.params[0].from,
                gasPrice: payload.params[0].gasPrice,
                gasLimit: payload.params[0].gas,
                value: payload.params[0].value,
                data: payload.params[0].data,
                nonce: payload.params[0].nonce,
              };
              const result = await wallet.signTransaction(tx);
              connector.approveRequest({
                id: payload.id,
                result: result,
              });
              showBanner();
            } catch (e) {
              showBanner();
              console.log(chalk.red("Error Signing Transaction"));
              connector.rejectRequest({
                id: payload.id,
                error: {
                  code: "ERROR",
                  message: "A Error Occured",
                },
              });
            }
          } else if (payload.method === "eth_sendRawTransaction") {
            try {
              const tx = payload.params[0];
              const result = await wallet.provider.sendTransaction(tx);
              connector.approveRequest({
                id: payload.id,
                result: result.hash,
              });
              showBanner();
            } catch (e) {
              showBanner();
              console.log(chalk.red("Error Sending Raw Transaction"));
              connector.rejectRequest({
                id: payload.id,
                error: {
                  code: "ERROR",
                  message: "A Error Occured",
                },
              });
            }
          }
          requests.splice(requests.indexOf(payload), 1);
          showBanner();
          console.log(chalk.green("Approved Request"));
          break;
        case "Reject":
          connector.rejectRequest({
            id: payload.id,
            error: {
              code: "USER_DENIED",
              message: "User Rejected Request",
            },
          });
          showBanner();
          console.log(chalk.green("Rejected Request"));
          requests.splice(requests.indexOf(payload), 1);
          break;
      }
    });
};

const startServer = async (
  uri: string,
  wallet: any,
  chainId: number,
  callback: any
) => {
  // @ts-ignore
  var connector = new WalletConnect.default({
    uri: uri,
    clientMeta: {
      description: "EtherSome A Awesome Ethereum Wallet",
      url: "https://github.com/IIpho3nix/EtherSome",
      icons: ["none"],
      name: "EtherSome",
    },
  });
  connector.on("session_request", async (error: Error | null, payload: any) => {
    if (error != null) {
      showBanner();
      connector.killSession().catch(() => {});
      return;
    }
    showBanner();
    // @ts-ignore
    await question.YorN("Do You Want To Connect").then((value) => {
      const answer = value.answer;
      showBanner();
      if (answer) {
        console.log(chalk.green("Connecting To WalletConnect"));
        connector.approveSession({
          accounts: [wallet.address],
          chainId: chainId,
        });
        showBanner();
        console.log(chalk.green("Connected To WalletConnect"));
        doloop = true;
        loop(connector, wallet);
      } else {
        connector.rejectSession({
          message: "User Rejected Connection",
        });
        connector.killSession().catch(() => {});
        return;
      }
    });
  });

  connector.on("call_request", async (error: Error | null, payload: any) => {
    if (error != null) {
      connector.killSession().catch(() => {});
      return;
    }
    requests.push(payload);
  });

  connector.on("disconnect", async (error: any, payload: any) => {
    callback("Disconnected From WalletConnect");
  });

  console.log(chalk.green("Starting Server"));
  connector.createSession();
};

exports.startServer = startServer;

export default exports;
