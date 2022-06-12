const Host = "https://testnet-algorand.api.purestake.io/ps2";
const Puretoken = {
    "X-API-Key": "z6H94GE3sI8w100S7MyY92YMK5WIPAmD6YksRDsC"
}
const Port = "";
const algodClient = new algosdk.Algodv2(Puretoken, Host, Port);

const amountId = document.getElementById("amount"); 
const walletId = document.getElementById("recieverwallet"); 
const remarksId = document.getElementById("note");
const connectWalletDiv = document.getElementById("connectWallet");

const connected = document.getElementById("connection")

const myAlgoConnect = new MyAlgoConnect();
let response;
let finalResponse;
let assetValue;

//connect to AlgoWallet
const connectWallet = async() => {
    try{
        response = await myAlgoConnect.connect();
        if(response){
            connectWalletDiv.hidden = true;
            let str = response[0].address;
            connected.textContent= `${str.slice(0,7)}...Connected`
        }
    }
    catch(err){
        console.log(err);
    }
}

//Collect transaction details
const newPayment = async() => {
    if(!response){
        connectWallet();
    }
    else{
        let amount = Number(amountId.value);
        let reciever = walletId.value;
        let remarks = remarksId.value;
        let transactionId = await processPayment(reciever,amount,remarks);
        if(transactionId) {
            console.log(transactionId.txId);
            finalResponse = {
                reciever : reciever,
                transId : transactionId.txId,
                amt :amount,
                asset : assetValue,
                remark: remarks
            }
            window.localStorage.setItem('Modal', JSON.stringify(finalResponse));
            window.location.assign("/modal");
        }
        else{
            connected.textContent = `Transaction failed`
        }
    }
}

//Send transaction to algo
const processPayment = async (reciever,amount,remarks) => {
        let params = await algodClient.getTransactionParams().do(); //get params
        let sender = response[0].address;
        let encoder = new TextEncoder();  //encode
        try {
            const assetId = document.getElementById("pay_with");
            const asset = assetId.value;
            assetValue = asset;
            if(asset == "Algo"){
                let txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                    from: sender, 
                    to: reciever, 
                    amount: amount, 
                    note: encoder.encode(remarks), 
                    suggestedParams: params
                });
                return signTransfer(txn);
            }
            else {
                if (asset == "Choice"){
                    ASSET_ID = 21364625;
                }
                else {
                    ASSET_ID = 62482362;
                }
                let txn = await algosdk.makeAssetTransferTxnWithSuggestedParams(
                    sender,
                    reciever,
                    undefined,
                    undefined,
                    amount*100,
                    encoder.encode(remarks),
                    ASSET_ID,
                    params
                );
                return signTransfer(txn);
            }
        }catch(err){
            errorMessage(err);
        }
}

//Sign transaction
async function signTransfer (txn) {
    const signedTxn = await myAlgoConnect.signTransaction(txn.toByte());
    const transId = await algodClient.sendRawTransaction(signedTxn.blob).do();
    return transId;
}

//Incorrect wallet address 
function errorMessage (error){
    if (error.message == "address seems to be malformed"){
        connected.textContent = "Invalid wallet address"
        console.log(error.message);
    }
    else{
        connected.textContent = "Transaction failed"
        console.log(error.message);
    }
}

//payment modal
function paymentModal(){
    if (localStorage.getItem("Modal") === null) {
        window.location.assign("/index");
    }
    else{
        let answer = JSON.parse(window.localStorage.getItem('Modal'));
        document.getElementById("type").innerHTML = answer.asset;
        document.getElementById("amt").innerHTML = answer.amt;
        document.getElementById("transId").innerHTML = answer.transId;
        document.getElementById("recepient").innerHTML = answer.reciever;
        document.getElementById("note").innerHTML = answer.remark;
    }
    
}
