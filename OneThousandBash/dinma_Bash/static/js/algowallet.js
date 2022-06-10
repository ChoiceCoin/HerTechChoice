const host = "https://testnet-algorand.api.purestake.io/ps2";

const noInput = document.getElementById("no"); 
const yesInput = document.getElementById("yes"); 
const getTotalChoice = document.getElementById("choice_value"); 
const get_address_history = document.getElementById("notify"); 
const submit = document.getElementById("submit"); 
const connectWallet = document.getElementById("dropdownMenu2"); 
const walletAddress = document.getElementById("wallet_value"); 
let committed = document.getElementById("committed2");
let primaryText = document.querySelector("primary-text");

const Token = {
  "X-API-Key":"N4Kcpuyrax1L5ZsCYsOxQ5kI8gJk98Sc8H4uFUZN",
};

const address_1 = "KOXLGEBRWPXOJ4OOZYEBOBP77DCLY63EHODYGPWNPLL7ALWWIYWID75AVI";
const address_2 = "EN7X2JIPUXC4WYOJCDJDU5ITR5KWWZQ5PCJ3B6HWLGHBCWTJKBJGN7IH64";

const CHOICE_ASSET_ID = 21364625;
const Port = "";
const algodClient = new algosdk.Algodv2(Token, host, Port);
const indexerClient = new algosdk.Indexer(
  Token,
  "https://testnet-algorand.api.purestake.io/idx2",
  Port
);


const myAlgoConnect = new MyAlgoConnect();

const myAlgoWalletConnect = async () => {
  try {
    let response = await myAlgoConnect.connect();
    const { address, name } = response[0]; 

    

    let transaction_history = await indexerClient
      .searchForTransactions()
      .address(address)
      .assetID(CHOICE_ASSET_ID)
      .limit(5)
      .do();

    let total = 0;
    const history = transaction_history["transactions"];
    history.forEach((item) => {
      total += item["asset-transfer-transaction"]["amount"] / 100;
    });

    get_address_history.classList.remove("d-none");
    walletAddress.innerHTML = `${address}`;
    getTotalChoice.innerHTML += ` ${total.toFixed(2)} CHOICE`;
    committed.innerHTML = `Amount Commited to the Voting Process in the last five transactions: $${total} Choice`;
    console.log(committed);
    connectWallet.classList.add("d-none");
    document.body.classList.remove("primary-text");
    disconnect.innerHTML = `Disconnect Wallet here`;
    console.log(walletAddress.innerHTML);
  } catch (error) {
    console.error(error);
  }
};

const myAlgoWalletSign = async () => {
  
  if (yesInput.checked) {
    const Address = walletAddress.innerHTML; 
    let value = yesInput.value;
    let Amount = Number(document.getElementById("option-input").value); 
    try {
      let response = await algoWalletSend(value, Address, Amount);
      if (response) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error(error);
    }
  }

 
  if (noInput.checked) {
    const Address = walletAddress.innerHTML; 
    let value = noInput.value;
    let Amount = Number(document.getElementById("option-input").value); 
    try {
      let response = await algoWalletSend(value, Address, Amount); 
      if (response) {
        window.location.href = "/"; 
      }
    } catch (error) {
      console.error(error);
    }
  }
};

const algoWalletSend = async (input, from, amount) => {
  let params = await algodClient.getTransactionParams().do();
  let encoder = new TextEncoder();
  if (input == "blue") {
    try {
      let txn = await algosdk.makeAssetTransferTxnWithSuggestedParams(
        from,
        address_1,
        undefined,
        undefined,
        amount * 100,
        encoder.encode("Vote with Choice coin"),
        CHOICE_ASSET_ID,
        params
      );
      const signedTxn = await myAlgoConnect.signTransaction(txn.toByte());
      const response = await algodClient
        .sendRawTransaction(signedTxn.blob)
        .do();
      return response;
    } catch (error) {
      console.error(error);
    }
  } else {
    try {
      let txn = await algosdk.makeAssetTransferTxnWithSuggestedParams(
        from,
        address_2,
        undefined,
        undefined,
        amount * 100,
        encoder.encode("Vote with Choice coin"),
        CHOICE_ASSET_ID,
        params
      );
      const signedTxn = await myAlgoConnect.signTransaction(txn.toByte());
      const response = await algodClient
        .sendRawTransaction(signedTxn.blob)
        .do();
      return response;
    } catch (error) {
      console.error(error);
    }
  }
};