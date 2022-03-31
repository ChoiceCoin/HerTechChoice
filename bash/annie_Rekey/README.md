# XCITY REKEYING BASH SUBMISSION

Rekeying is a powerful protocol feature which enables an Algorand account holder to maintain a static public address while dynamically rotating the authoritative private spending key(s). This is accomplished by issuing a "rekey-to transaction" which sets the authorized address field within the account object. Future transaction authorization using the account's public address must be provided by the spending key(s) associated with the authorized address which may be a single key address, MultiSig address or LogicSig program address. Key management is an important concept to understand and Algorand provides tools to accomplish relevant tasks securely.

# Key Benefits of REKEYING

- A fast and seamless way to preserve account permanence
- Secure existing accounts with a new Private Spending Key at anytime, including with a hardware wallet,a multi-sig account, or smart contract based key
- Novation with the ability to reassign ownership of a contract

## STEPS TO RUN

- clone my repository

- "npm install" to install dependencies

- 'node rekey.js' to run in terminal

- to make use of multisig with existing wallet run the `multisigExistingAct()` function

- to make use of multisig with generated wallet run the `multiSig()` function

- to make use of singleRekeying with generated wallet run the `rekeySingle()` function

## Functionalities

- [x] User has to add his/her Api key
- [x] User has to add already created wallet address and phrase
- [x] Leave the rest for the PC

## Rekeying

To rekey an account to a new address, simply call the `addRekey` function on any transaction.

```javascript
//...
let txn = algosdk.makePaymentTxnWithSuggestedParams(
  from,
  to,
  amount,
  closeRemainderTo,
  note,
  suggestedParams
);
// From now, every transaction needs to be sign the SK of the following address
txn.addRekey(keys.sk);
//...
```

When submitting a transaction from an account that was rekeying, simply use relevant SK. `algosdk.signTransaction`/`transaction.signTxn` will detect
that the SK corresponding address is different than the sender's and will set the `AuthAddr` accordingly. Alternatively, you can use `kmdclient.signTransactionWithSpecificPublicKey`.

## Technologies and Platform used

- Js
- Algorand
