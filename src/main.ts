import chalk from "chalk";

import fs from "fs";

import question from "./lib/question.js";
import wallet from "./lib/wallet.js";
import config from "./lib/config.js";

let userWallet: any = null;

let provider: string = "";

let symbol: string = "ETH";

let tokens: Array<any> = [];

let tokenstrings: Array<string> = [];

let chainId: number = 0;

let error: boolean = false;

let loop: boolean = true;

const updatetokenSymbols = () => {
  tokenstrings = [];
  for (let i = 0; i < tokens.length; i++) {
    tokenstrings.push(tokens[i].tokenSymbol);
  }
};

const showBanner = () => {
  console.clear();
  console.log(
    chalk.blue(
      " ____       __       __\n/\\  _`\\    /\\ \\__   /\\ \\\n\\ \\ \\L\\_\\  \\ \\ ,_\\  \\ \\ \\___       __    _ __    ____    ___     ___ ___       __\n \\ \\  _\\L   \\ \\ \\/   \\ \\  _ `\\   /\'__`\\ /\\`\'__\\ /\',__\\  / __`\\ /\' __` __`\\   /\'__`\\\n  \\ \\ \\L\\ \\  \\ \\ \\_   \\ \\ \\ \\ \\ /\\  __/ \\ \\ \\/ /\\__, `\\/\\ \\L\\ \\/\\ \\/\\ \\/\\ \\ /\\  __/\n   \\ \\____/   \\ \\__\\   \\ \\_\\ \\_\\\\ \\____\\ \\ \\_\\ \\/\\____/\\ \\____/\\ \\_\\ \\_\\ \\_\\\\ \\____\\\n    \\/___/     \\/__/    \\/_/\\/_/ \\/____/  \\/_/  \\/___/  \\/___/  \\/_/\\/_/\\/_/ \\/____/" +
        "\n                                                                              v" +
        process.env.npm_package_version
    )
  );
};

const save = async () => {
  const doesWantToSaveWallet = (
    await question.YorN("Do you want to save your wallet")
  ).answer;
  showBanner();
  if (doesWantToSaveWallet) {
    const path = (
      await question.askQuestion(
        "Where do you want to save your wallet",
        ".",
        "Please enter a valid Path",
        false
      )
    ).answer;
    showBanner();
    const password = (
      await question.askQuestion(
        "Please enter a password for your wallet",
        "",
        "Please enter a valid password",
        true
      )
    ).answer;
    config.saveWallet(userWallet, path, password, tokens);
    showBanner();
    console.log(chalk.green("Wallet Saved"));
  }
};

const main = async () => {
  showBanner();
  if (error) {
    console.log(chalk.red("Wallet Not Found"));
    error = false;
  }

  if (provider == "") {
    const answer6 = (
      await question.YorN("Do you want to use a built in Provider")
    ).answer;
    showBanner();
    if (answer6) {
      const providerslisst = [
        "mainnet",
        "arbitrum",
        "polygon",
        "sepolia",
        "holesky",
        "amoy",
        "local:8545"
      ];
      const chainIds = [1, 42161, 137, 11155111, 17000, 80002, 31337];
      const answer7 = (
        await question.pickList("Please select a provider", providerslisst)
      ).answer;
      showBanner();
      chainId = chainIds[providerslisst.indexOf(answer7)];
      if (
        answer7 === "local:8545"
      ) {
        provider = "http://localhost:8545";
      } else if (answer7 === "arbitrum") {
        provider = "https://arb1.arbitrum.io/rpc"
        symbol = "ARB"
      } else if (answer7 === "polygon") {
        provider = "https://polygon-rpc.com"
        symbol = "POL"
      } else if (answer7 === "holesky") {
        provider = "https://holesky.drpc.org"
      } else if (answer7 === "amoy") {
        provider = "https://polygon-amoy.drpc.org"
        symbol = "POL"
      }
      else {
        provider = wallet.getProvider(answer7);
      }
      let chainCheck = await wallet.getChainId(provider);
      if (parseInt(chainCheck) !== chainId) {
        console.log(chalk.red("ChainId Mismatch (something went very wrong)") + " " + chainCheck + " " + chainId);
        process.exit(1);
      }
    } else {
      provider = (
        await question.askQuestion(
          "Please enter your Custom JSON-RPC Provider",
          ".",
          "Please enter a valid Provider",
          false
        )
      ).answer;
      showBanner();
      console.log(chalk.green("Getting ChainId"));
      chainId = await wallet.getChainId(provider);
      showBanner();
      const answer8 = (
        await question.YorN(
          "Do you want to change the chainId (" + chainId + ")"
        )
      ).answer;
      showBanner();
      if (answer8) {
        const answer5 = (
          await question.askQuestion(
            "Please enter the Providers ChainId",
            ".",
            "Please enter a valid chainId",
            false
          )
        ).answer;
        chainId = parseInt(answer5);
      }
      showBanner();
      const answer2 = (
        await question.YorN("Does this Provider use a custom symbol")
      ).answer;
      showBanner();
      if (answer2) {
        const answer3 = (
          await question.askQuestion(
            "Please enter the custom symbol",
            ".",
            "Please enter a valid symbol",
            false
          )
        ).answer;
        showBanner();
        symbol = answer3;
      }
    }
  }

  const answer = (
    await question.pickList("What would You Like To Do", [
      "Create New Wallet",
      "Import A Wallet From Private Key",
      "Import A Wallet From mnemonic (words)",
      "Import A Wallet From File",
      "Quit",
    ])
  ).answer;
  showBanner();
  switch (answer) {
    case "Quit":
      process.exit(0);
      break;
    case "Import A Wallet From File":
      let path = (
        await question.askQuestion(
          "Please enter the path to your file",
          ".",
          "Please enter a valid path",
          false
        )
      ).answer;
      showBanner();
      if (fs.existsSync(path)) {
        console.log(chalk.green("Wallet Found"));
        const pass = (
          await question.askQuestion(
            "Please enter your password",
            ".",
            "Please enter a valid password",
            true
          )
        ).answer;
        showBanner();
        console.log(chalk.green("Wallet Loading..."));
        try {
          const loadedconfig = await config.loadWallet(
            path,
            pass,
            provider,
            tokens
          );
          userWallet = loadedconfig.wallet;
          tokens = loadedconfig.tokens;
          updatetokenSymbols();
          showBanner();
          console.log(chalk.green("Wallet Loaded"));
        } catch (e) {
          showBanner();
          console.log(chalk.red("Error Loading Wallet"));
          error = true;
        }
      } else {
        error = true;
      }
      break;
    case "Import A Wallet From mnemonic (words)":
      let mnemonic = (
        await question.askQuestion(
          "Please enter your mnemonic",
          ".",
          "Please enter a valid mnemonic",
          false
        )
      ).answer;
      showBanner();
      console.log(chalk.green("Wallet loading..."));
      try {
        showBanner();
        userWallet = await wallet.createWalletFromMnemonic(mnemonic, provider);
        console.log(chalk.green("Wallet Loaded"));
        await save();
      } catch (e) {
        showBanner();
        console.log(chalk.red("Error Loading Wallet"));
        error = true;
      }
      break;
    case "Import A Wallet From Private Key":
      let privateKey = (
        await question.askQuestion(
          "Please enter your private key",
          ".",
          "Please enter a valid private key",
          false
        )
      ).answer;
      showBanner();
      console.log(chalk.green("Wallet loading..."));
      try {
        userWallet = await wallet.createWalletFromPrivateKey(
          privateKey,
          provider
        );
        showBanner();
        console.log(chalk.green("Wallet Loaded"));
        await save();
      } catch (e) {
        showBanner();
        console.log(chalk.red("Error Loading Wallet"));
        error = true;
      }
      break;
    case "Create New Wallet":
      const answer4 = (
        await question.pickList("Please select a mnemonic (words) length", [
          "12",
          "15",
          "18",
          "21",
          "24",
        ])
      ).answer;
      showBanner();
      try {
        userWallet = await wallet.createWallet(provider, parseInt(answer4));
        await save();
      } catch (e) {
        showBanner();
        console.log(chalk.red("Error Creating Wallet"));
        error = true;
      }
      break;
  }

  if (userWallet == null || provider == "") {
    main();
  } else {
    const handleAction = async (str: string) => {
      showBanner();
      switch (str) {
        case "Quit":
          await save();
          process.exit(0);
          break;
        case "Check Balance":
          const answer2 = (
            await question.pickList("What would You Like To Check", [
              symbol,
              "Token",
            ])
          ).answer;
          showBanner();
          switch (answer2) {
            case symbol:
              console.log(chalk.green("Checking Balance..."));
              try {
                const balance = await wallet.getEtherBalance(userWallet);
                showBanner();
                console.log(chalk.green("You Have " + balance + " " + symbol));
              } catch (e) {
                showBanner();
                console.log(chalk.red("Error Checking Balance"));
              }
              break;
            case "Token":
              if (tokenstrings.length == 0) {
                console.log(chalk.red("You do not have any tokens"));
              } else {
                const tokenToCheck = (
                  await question.pickList(
                    "Please select the token you want to check",
                    tokenstrings
                  )
                ).answer;
                showBanner();
                const index3 = tokenstrings.indexOf(tokenToCheck);
                console.log(chalk.green("Checking Balance..."));
                try {
                  const balance2 = await wallet.getTokenBalance(
                    userWallet,
                    tokens[index3]
                  );
                  showBanner();
                  console.log(
                    chalk.green(
                      "Your balance is: " +
                        balance2 +
                        " " +
                        tokens[index3].tokenSymbol
                    )
                  );
                } catch (e) {
                  showBanner();
                  console.log(chalk.red("Error Checking Balance"));
                }
              }
              break;
          }
          break;
        case "Recive":
          console.log(
            chalk.green("Your wallet address is: " + userWallet.address)
          );
          break;
        case "Send":
          const answer = (
            await question.pickList(
              "Would you like to send " + symbol + " or Tokens",
              [symbol, "Tokens"]
            )
          ).answer;
          showBanner();
          switch (answer) {
            case symbol:
              const address = (
                await question.askQuestion(
                  "Please enter the address you want to send to",
                  ".",
                  "Please enter a valid address",
                  false
                )
              ).answer;
              showBanner();
              const amount = (
                await question.askQuestion(
                  "Please enter the amount you want to send",
                  ".",
                  "Please enter a valid amount",
                  false
                )
              ).answer;
              showBanner();
              console.log(chalk.green("Checking Balance..."));
              try {
                if (amount > (await wallet.getEtherBalance(userWallet))) {
                  showBanner();
                  console.log(
                    chalk.red(
                      "You do not have enough " +
                        symbol +
                        " to send this amount"
                    )
                  );
                } else {
                  showBanner();
                  console.log(chalk.green("Estimating Gas..."));
                  try {
                    const gascalc = await wallet.estimateGas(
                      userWallet,
                      address,
                      amount
                    );
                    showBanner();
                    const confirmone = (
                      await question.YorN(
                        "This Will Cost Around " +
                          gascalc +
                          " " +
                          symbol +
                          " In Gas, Are You Sure?"
                      )
                    ).answer;
                    showBanner();
                    if (confirmone) {
                      const confirmtwo = (
                        await question.YorN(
                          "Are you sure you want to send " +
                            amount +
                            " " +
                            symbol +
                            " to " +
                            address +
                            ""
                        )
                      ).answer;
                      showBanner();
                      if (confirmtwo) {
                        console.log(
                          chalk.green(
                            "Sending " +
                              amount +
                              " " +
                              symbol +
                              " to " +
                              address
                          )
                        );
                        try {
                          await wallet.transferEther(
                            userWallet,
                            address,
                            amount
                          );
                          showBanner();
                          console.log(chalk.green("Transaction Sent"));
                        } catch (e) {
                          showBanner();
                          console.log(chalk.red("Error Sending Transaction"));
                        }
                      } else {
                        showBanner();
                        console.log(chalk.red("Transaction Canceled"));
                      }
                    } else {
                      showBanner();
                      console.log(chalk.red("Transaction Canceled"));
                    }
                  } catch (e) {
                    showBanner();
                    console.log(chalk.red("Error Estimating Gas"));
                  }
                }
              } catch (e) {
                showBanner();
                console.log(chalk.red("Error Checking Balance"));
              }
              break;
            case "Tokens":
              if (tokenstrings.length == 0) {
                console.log(chalk.red("You do not have any tokens"));
              } else {
                const tokenToSend = (
                  await question.pickList(
                    "Please select the token you want to send",
                    tokenstrings
                  )
                ).answer;
                showBanner();
                const index2 = tokenstrings.indexOf(tokenToSend);
                const token = tokens[index2];
                const address2 = (
                  await question.askQuestion(
                    "Please enter the address you want to send to",
                    ".",
                    "Please enter a valid address",
                    false
                  )
                ).answer;
                showBanner();
                const amount3 = (
                  await question.askQuestion(
                    "Please enter the amount you want to send",
                    ".",
                    "Please enter a valid amount",
                    false
                  )
                ).answer;
                showBanner();
                console.log(chalk.green("Checking Balance..."));
                try {
                  if (
                    amount3 > (await wallet.getTokenBalance(userWallet, token))
                  ) {
                    showBanner();
                    console.log(
                      chalk.red(
                        "You do not have enough " +
                          token.tokenSymbol +
                          " to send this amount"
                      )
                    );
                  } else {
                    showBanner();
                    console.log(chalk.green("Estimating Gas..."));
                    try {
                      const gascalc = await wallet.estimateTokenGas(
                        userWallet,
                        address2,
                        amount3,
                        token
                      );
                      showBanner();
                      const confirmone = (
                        await question.YorN(
                          "This Will Cost Around " +
                          gascalc +
                          " " +
                          symbol +
                          " In Gas, Are You Sure?"
                        )
                      ).answer;
                      showBanner();
                      if (confirmone) {
                        const confirmtwo = (
                          await question.YorN(
                            "Are you sure you want to send " +
                              amount3 +
                              " " +
                              token.tokenSymbol +
                              " to " +
                              address2 +
                              ""
                          )
                        ).answer;
                        showBanner();
                        if (confirmtwo) {
                          console.log(
                            chalk.green(
                              "Sending " +
                                amount3 +
                                " " +
                                token.tokenSymbol +
                                " to " +
                                address2
                            )
                          );
                          try {
                            await wallet.transferToken(
                              userWallet,
                              address2,
                              amount3,
                              token
                            );
                            showBanner();
                            console.log(chalk.green("Transaction Sent"));
                          } catch (e) {
                            showBanner();
                            console.log(chalk.red("Error Sending Transaction"));
                          }
                        } else {
                          showBanner();
                          console.log(chalk.red("Transaction Canceled"));
                        }
                      } else {
                        showBanner();
                        console.log(chalk.red("Transaction Canceled"));
                      }
                    } catch (e) {
                      showBanner();
                      console.log(chalk.red("Error Estimating Gas"));
                    }
                  }
                } catch (e) {
                  console.log(chalk.red("Error Checking Balance"));
                }
              }
              break;
          }
          break;
        case "See Price":
          const answer9 = (
            await question.pickList(
              "Would you like to send " + symbol + " or Tokens",
              [symbol, "Tokens"]
            )
          ).answer;
          showBanner();
          switch (answer9) {
            case symbol:
              showBanner();
              const amounta = (
                await question.askQuestion(
                  "Please enter the amount you want to check",
                  ".",
                  "Please enter a valid amount",
                  false
                )
              ).answer;
              showBanner();
              console.log(chalk.green("Checking Price..."));
              try {
                const price = await wallet.getPrice(
                  parseFloat(amounta),
                  symbol
                );
                showBanner();
                if (price == null) {
                  console.log(chalk.red("Price Not Found"));
                } else {
                  console.log(
                    chalk.green(
                      `the price of ${amounta} ${symbol} is ${price} USD`
                    )
                  );
                }
              } catch (e) {
                showBanner();
                console.log(chalk.red("Error Getting Price"));
              }
              break;
            case "Tokens":
              const coin = (
                await question.pickList(
                  "Please select the token you want to check",
                  tokenstrings
                )
              ).answer;
              showBanner();
              const amountb = (
                await question.askQuestion(
                  "Please enter the amount you want to check",
                  ".",
                  "Please enter a valid amount",
                  false
                )
              ).answer;
              showBanner();
              console.log(chalk.green("Checking Price..."));
              try {
                const price = await wallet.getPrice(parseFloat(amountb), coin);
                showBanner();
                if (price == null) {
                  console.log(chalk.red("Price Not Found"));
                } else {
                  console.log(
                    chalk.green(
                      `the price of ${amountb} ${coin} is ${price} USD`
                    )
                  );
                }
              } catch (e) {
                showBanner();
                console.log(chalk.red("Error Getting Price"));
              }
              break;
          }
          break;
        case "Estimate Gas":
          const answer10 = (
            await question.pickList(
              "Would you like to send " + symbol + " or Tokens",
              [symbol, "Tokens"]
            )
          ).answer;
          showBanner();
          switch (answer10) {
            case symbol:
              const amount2 = (
                await question.askQuestion(
                  "Please enter the amount you want to check",
                  ".",
                  "Please enter a valid amount",
                  false
                )
              ).answer;
              showBanner();
              try {
                console.log(chalk.green("Checking Balance..."));
                if (amount2 > (await wallet.getEtherBalance(userWallet))) {
                  showBanner();
                  console.log(
                    chalk.red(
                      "You do not have enough " +
                        symbol +
                        " to send this amount"
                    )
                  );
                } else {
                  showBanner();
                  console.log(chalk.green("Estimating Gas..."));
                  try {
                    const gascalc2 = await wallet.estimateGas(
                      userWallet,
                      userWallet.address,
                      amount2
                    );
                    showBanner();
                    console.log(
                      chalk.green(
                        "This Will Cost Around " +
                          gascalc2 +
                          " " +
                          symbol +
                          " In Gas"
                      )
                    );
                  } catch (e) {
                    showBanner();
                    console.log(chalk.red("Error Estimating Gas"));
                  }
                }
              } catch (e) {
                showBanner();
                console.log(chalk.red("Error Getting Balance"));
              }
              break;
            case "Tokens":
              const tocheck = (
                await question.pickList(
                  "Please select the tokem you want to check",
                  tokenstrings
                )
              ).answer;
              showBanner();
              const amount3 = (
                await question.askQuestion(
                  "Please enter the amount you want to check",
                  ".",
                  "Please enter a valid amount",
                  false
                )
              ).answer;
              showBanner();
              try {
                const token = tokens[tokenstrings.indexOf(tocheck)];
                console.log(chalk.green("Checking Balance..."));
                if (
                  amount3 > (await wallet.getTokenBalance(userWallet, token))
                ) {
                  showBanner();
                  console.log(
                    chalk.red(
                      "You do not have enough " +
                        token.tokenSymbol +
                        " to send this amount"
                    )
                  );
                } else {
                  showBanner();
                  console.log(chalk.green("Estimating Gas..."));
                  try {
                    const gascalc2 = await wallet.estimateTokenGas(
                      userWallet,
                      userWallet.address,
                      amount3,
                      token
                    );
                    showBanner();
                    console.log(
                      chalk.green(
                        "This Will Cost Around " +
                          gascalc2 +
                          " " +
                          symbol +
                          " In Gas"
                      )
                    );
                  } catch (e) {
                    showBanner();
                    console.log(chalk.red("Error Getting Gas"));
                  }
                }
              } catch (e) {
                showBanner();
                console.log(chalk.red("Error Getting Balance"));
              }
          }
          break;
        case "Learn My mnemonic (words)":
          if (userWallet.mnemonic == null) {
            console.log(chalk.red("This wallet dosent have a mnemonic"));
          } else {
            console.log(
              chalk.green(
                "Your wallet mnemonic is: " + userWallet.mnemonic.phrase
              )
            );
          }
          break;
        case "Learn My Private Key":
          console.log(
            chalk.green("Your private key is: " + userWallet.privateKey)
          );
          break;
        case "Add Token":
          const tokenAddress = (
            await question.askQuestion(
              "Please enter the address of the token you want to add",
              ".",
              "Please enter a valid address",
              false
            )
          ).answer;
          showBanner();
          console.log(chalk.green("Getting Token Information..."));
          const temptoken = new wallet.token(tokenAddress, "TMP");
          try {
            const tokenSymbol = (
              await wallet.getTokenSymbol(temptoken, userWallet)
            ).toUpperCase();
            showBanner();
            tokens.push(new wallet.token(tokenAddress, tokenSymbol));
            updatetokenSymbols();
            console.log(chalk.green("Token Added"));
          } catch (e) {
            showBanner();
            console.log(chalk.red("Error Getting Token Information"));
          }
          break;
        case "Remove Token":
          if (tokenstrings.length == 0) {
            console.log(chalk.red("You do not have any tokens"));
          } else {
            const tokenToRemove = (
              await question.pickList(
                "Please select the token you want to remove",
                tokenstrings
              )
            ).answer;
            showBanner();
            tokens.splice(tokenstrings.indexOf(tokenToRemove), 1);
            updatetokenSymbols();
            console.log(chalk.green("Token Removed"));
          }
          break;
        case "List Token":
          if (tokenstrings.length == 0) {
            console.log(chalk.red("You do not have any tokens"));
          } else {
            console.log(chalk.green("Your tokens are: "));
            for (let i = 0; i < tokenstrings.length; i++) {
              console.log(chalk.gray(tokenstrings[i]));
            }
          }
          break;
        case "Save My Wallet":
          const path = (
            await question.askQuestion(
              "Where do you want to save your wallet",
              ".",
              "Please enter a valid Path",
              false
            )
          ).answer;
          showBanner();
          const password = (
            await question.askQuestion(
              "Please enter a password for your wallet",
              "",
              "Please enter a valid password",
              true
            )
          ).answer;
          config.saveWallet(userWallet, path, password, tokens);
          showBanner();
          console.log(chalk.green("Wallet Saved"));
          break;
      }

      if (loop) {
        askAction();
      }
    };

    const askAction = async () => {
      handleAction(
        (
          await question.pickList("What Would You Like To Do", [
            "Check Balance",
            "Recive",
            "Send",
            "See Price",
            "Estimate Gas",
            "Learn My mnemonic (words)",
            "Learn My Private Key",
            "Add Token",
            "Remove Token",
            "List Token",
            "Save My Wallet",
            "Quit",
          ])
        ).answer
      );
    };

    askAction();
  }
};

main();
