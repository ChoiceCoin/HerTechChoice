const { AlgoSigner } = window;

const noInput = document.getElementById("no"); 
const yesInput = document.getElementById("yes"); 
const getTotalChoice2 = document.getElementById("choice_value"); 
const get_address_history2 = document.getElementById("notify"); 
const submit2 = document.getElementById("submit"); 
const connectedWallet = document.getElementById("dropdownMenu2"); 
const mainWalletAddress = document.getElementById("wallet_value"); 
const disconnect = document.getElementById("disconnect");
let committed2 = document.getElementById("committed2");

const server = "https://testnet-algorand.api.purestake.io/ps2";
const token = {
  "X-API-Key": "N4Kcpuyrax1L5ZsCYsOxQ5kI8gJk98Sc8H4uFUZN",
};

const port = "";
const algoClient = new algosdk.Algodv2(token, server, port);

const indexer = new algosdk.Indexer(
  token,
  "https://testnet-algorand.api.purestake.io/idx2",
  port
);



const ASSET_ID = 21364625;

const address_one =
  "KOXLGEBRWPXOJ4OOZYEBOBP77DCLY63EHODYGPWNPLL7ALWWIYWID75AVI";
const address_two =
  "EN7X2JIPUXC4WYOJCDJDU5ITR5KWWZQ5PCJ3B6HWLGHBCWTJKBJGN7IH64";

const myAlgoSignerConnect = async () => {
  if (!AlgoSigner) {
    return alert("Please install AlgoSigner");
  }
  try {
    await AlgoSigner.connect();
    console.log(AlgoSigner);
    const address = await AlgoSigner.accounts({
      ledger: "TestNet",
    })
      .then((value) => value[0])
      .then((result) => {
        const { address } = result;
        return address;
      })
      .catch((e) => console.log("cannot retrieve accounts"));

    //get the last 5 transaction history of the connected address
    let transaction_history = await indexer
      .searchForTransactions()
      .address(address)
      .assetID(ASSET_ID)
      .limit(5)
      .do();

    let total = 0;
    const history = transaction_history["transactions"];
    history.forEach((item) => {
      total += item["asset-transfer-transaction"]["amount"] / 100;
    });

    disconnect.innerHTML = `Disconnect Wallet here`;
    get_address_history2.classList.remove("d-none");
    mainWalletAddress.innerHTML = `${address}`;

    committed.innerHTML = `Amount Commited to the Voting Process: $${total} Choice`;
    getTotalChoice2.innerHTML += ` ${total.toFixed(2)} CHOICE`;
    connectedWallet.classList.add("d-none");
  } catch (error) {
    console.error(error);
  }
};

const algoSigner = async () => {
  if (blueInput2.checked) {
    const Address = walletAddress.innerHTML; 
    let value = blueInput2.value;
    let Amount = Number(document.getElementById("option-input").value); 
    try {
      let response = await algoSignerSend(value, Address, Amount);
      if (response) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (redInput2.checked) {
    const Address = walletAddress.innerHTML; 
    let value = redInput2.value;
    let Amount = Number(document.getElementById("option-input").value); 
    try {
      let response = await algoSignerSend(value, Address, Amount); 
      if (response) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error(error);
    }
  }
};

const algoSignerSend = async (opt, walletAddress, amount) => {
  let params = await algoClient.getTransactionParams().do();
  let encoder = new TextEncoder();

  if (opt == "blue") {
    try {
      let txn = await algosdk.makeAssetTransferTxnWithSuggestedParams(
        walletAddress,
        address_one,
        undefined,
        undefined,
        amount * 100,
        encoder.encode("Vote with Choice coin"),
        ASSET_ID,
        params
      );

      
      const txn_b64 = AlgoSigner.encoding.msgpackToBase64(txn.toByte());

      let signedTxn = await AlgoSigner.signTxn([{ txn: txn_b64 }]);

      let sendTxn = await AlgoSigner.send({
        ledger: "TestNet",
        tx: signedTxn[0].blob,
      });

      return sendTxn;
    } catch (error) {
      console.error(error);
    }
  } else {
    try {
      let txn = await algosdk.makeAssetTransferTxnWithSuggestedParams(
        walletAddress,
        address_two,
        undefined,
        undefined,
        amount * 100,
        encoder.encode("Vote with Choice coin"),
        ASSET_ID,
        params
      );
      const txn_b64 = AlgoSigner.encoding.msgpackToBase64(txn.toByte());

      let signedTxn = await AlgoSigner.signTxn([{ txn: txn_b64 }]);

      let sendTxn = await AlgoSigner.send({
        ledger: "TestNet",
        tx: signedTxn[0].blob,
      });

      return sendTxn;
    } catch (error) {
      console.error(error);
    }
  }
};
