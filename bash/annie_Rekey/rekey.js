//importing the neccesary modules
const algosdk = require("algosdk");
//This helps in connecting the client with the algorand network
const baseServer = "https://testnet-algorand.api.purestake.io/ps2";
const port = "";
const token = {
  "X-API-Key": "", //Your APi key here
};
let algodClient = new algosdk.Algodv2(token, baseServer, port);
const CHOICE_ASSET_ID = 21364625;

const main_wallet = ""; //your wallet
const main_mnemonic = ""; //phrase
const encoder = new TextEncoder();

//wait for confirmation
const waitForConfirmation = async (algodClient, txId, timeout) => {
  if (algodClient == null || txId == null || timeout < 0) {
    throw new Error("Bad arguments");
  }

  const status = await algodClient.status().do();
  if (status === undefined) {
    throw new Error("Unable to get node status");
  }

  const startround = status["last-round"] + 1;
  let currentround = startround;

  while (currentround < startround + timeout) {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do();
    if (pendingInfo !== undefined) {
      if (
        pendingInfo["confirmed-round"] !== null &&
        pendingInfo["confirmed-round"] > 0
      ) {
        //Got the completed Transaction
        return pendingInfo;
      } else {
        if (
          pendingInfo["pool-error"] != null &&
          pendingInfo["pool-error"].length > 0
        ) {
          // If there was a pool error, then the transaction has been rejected!
          throw new Error(
            "Transaction " +
              txId +
              " rejected - pool error: " +
              pendingInfo["pool-error"]
          );
        }
      }
    }
    await algodClient.statusAfterBlock(currentround).do();
    currentround++;
  }
  throw new Error(
    "Transaction " + txId + " not confirmed after " + timeout + " rounds!"
  );
};

const rekeySingle = async () => {
  try {
    let secret_key = algosdk.mnemonicToSecretKey(main_mnemonic);
    let keys = algosdk.generateAccount(); // generates an acct
    let mnemonic = algosdk.secretKeyToMnemonic(keys.sk); // displays the mnemonic
    let secret_key = algosdk.mnemonicToSecretKey(mnemonic); //Displays the secret key [addr, sk]
    let isValid = algosdk.isValidAddress(secret_key.addr); // checks if generated address is valid (this will most  likely be true)
    const accountInfo = await algodClient.accountInformation(keys.addr).do(); // Gets the acct info
    const startingAmount = accountInfo.amount;
    console.log(startingAmount); // displays the amt of algo
    const suggestedParams = await algodClient.getTransactionParams().do();
    if (isValid) {
      //...
      let txn = algosdk.makePaymentTxnWithSuggestedParams(
        main_wallet, //There is no need to specify the from address, it is computed directly from the secretKey
        main_wallet,
        1,
        undefined,
        encoder.encode("Rekeyed"),
        suggestedParams
      );
      // From now, every transaction needs to be sign the SK of the following address
      txn.addRekey(keys.sk);
      let signedTxn = txn.signTxn(secret_key.sk);
      const tx = await algodClient.sendRawTransaction(signedTxn).do();
      const confirmTxn = await waitForConfirmation(algodClient, tx.txId, 4);
      //Get the completed Transaction
      console.log(
        "Transaction " +
          tx.txId +
          " confirmed in round " +
          confirmTxn["confirmed-round"]
      );
      //...
    }
  } catch (error) {
    console.log("error rekeying");
  }
};

const keypress = async () => {
  process.stdin.setRawMode(true);
  return new Promise((resolve) =>
    process.stdin.once("data", () => {
      process.stdin.setRawMode(false);
      resolve();
    })
  );
};
////
//Multisig with generated accounts
const multiSig = async () => {
  try {
    let firstAct = algosdk.generateAccount();
    let secAct = algosdk.generateAccount();
    let thirdAct = algosdk.generateAccount();
    let account1_mnemonic = algosdk.secretKeyToMnemonic(firstAct.sk);
    let account2_mnemonic = algosdk.secretKeyToMnemonic(secAct.sk);
    let account3_mnemonic = algosdk.secretKeyToMnemonic(thirdAct.sk);

    let account1 = algosdk.mnemonicToSecretKey(account1_mnemonic);
    let account2 = algosdk.mnemonicToSecretKey(account2_mnemonic);
    let account3 = algosdk.mnemonicToSecretKey(account3_mnemonic);
    console.log(account1.addr);
    console.log(account2.addr);
    console.log(account3.addr);
    console.log(
      "Dispense funds to this account on TestNet https://bank.testnet.algorand.network/"
    );
    await keypress();
    // Setup the parameters for the multisig account
    const mparams = {
      version: 1,
      threshold: 1,
      addrs: [account1.addr, account2.addr],
    };
    let multsigaddr = algosdk.multisigAddress(mparams);
    let params = await algodClient.getTransactionParams().do();
    const receiver = account3.addr;
    let text = "{lets goooo}";
    const enc = new TextEncoder();
    const note = enc.encode(text);

    let txn = algosdk.makePaymentTxnWithSuggestedParams(
      receiver,
      main_wallet,
      0,
      undefined,
      note,
      params,
      multsigaddr
    );
    // Sign with first signature

    let rawSignedTxn = algosdk.signMultisigTransaction(
      txn,
      mparams,
      account1.sk
    ).blob;
    //sign with second account
    let twosigs = algosdk.appendSignMultisigTransaction(
      rawSignedTxn,
      mparams,
      account2.sk
    ).blob;
    //submit the transaction
    await algodClient.sendRawTransaction(twosigs).do();
    let confirmedTxn = await waitForConfirmation(algodClient, txId, 4);
    //Get the completed Transaction
    console.log(
      "Transaction " +
        txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );
  } catch (error) {
    console.log(error);
  }
};

// Multisig with already existing TestNet acct
const multisigExistingAct = async () => {
  try {
    let multi1 =
      "cupboard excite beef wait include soda deal august put just pony tenant surge access license chicken category earth sketch album sand rival bid absent view"; //phrase1
    let multi2 =
      "street page hammer layer auto skirt symbol rescue camp syrup oval hawk skull general endless cable biology prison badge world ill mobile appear abstract unit"; //phrase2
    let multi3 =
      "major swarm hurry little auto kingdom just math attack entry reject move erosion happy riot there blossom shuffle february forward bleak cushion luggage absorb chimney"; //phrase3
    let seceretKey1 = algosdk.mnemonicToSecretKey(multi1);
    let seceretKey2 = algosdk.mnemonicToSecretKey(multi2);
    let seceretKey3 = algosdk.mnemonicToSecretKey(multi3);
    const accountInfo1 = await algodClient
      .accountInformation(seceretKey1.addr)
      .do();
    const accountInfo2 = await algodClient
      .accountInformation(seceretKey2.addr)
      .do();
    const accountInfo3 = await algodClient
      .accountInformation(seceretKey3.addr)
      .do();
    console.log(accountInfo1);
    console.log(accountInfo2);
    console.log(accountInfo3);
    const mparams = {
      version: 1,
      threshold: 1,
      addrs: [seceretKey3.addr, seceretKey1.addr, seceretKey2.addr],
    };
    let multsigaddr = algosdk.multisigAddress(mparams);
    let params = await algodClient.getTransactionParams().do();
    const receiver = seceretKey1.addr;
    let text = "{lets goooo}";
    const enc = new TextEncoder();
    const note = enc.encode(text);
    let txn = algosdk.makePaymentTxnWithSuggestedParams(
      receiver,
      receiver,
      0,
      undefined,
      note,
      params,
      multsigaddr
    );
    // Sign with first signature

    let rawSignedTxn = algosdk.signMultisigTransaction(
      txn,
      mparams,
      seceretKey3.sk
    ).blob;
    //sign with second account
    let twosigs = algosdk.appendSignMultisigTransaction(
      rawSignedTxn,
      mparams,
      seceretKey2.sk
    ).blob;
    //submit the transaction
    let signedTxnMain = txn.signTxn(seceretKey1.sk);
    await algodClient.sendRawTransaction(signedTxnMain).do();
    let txID = txn.txID().toString();
    let confirmedTxn = await waitForConfirmation(algodClient, txID, 4);
    //Get the completed Transaction
    console.log(
      "Transaction " +
        txID +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );
  } catch (error) {
    console.log(error);
  }
};
