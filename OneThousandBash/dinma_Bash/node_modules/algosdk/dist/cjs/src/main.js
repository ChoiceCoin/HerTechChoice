"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogicTemplates = exports.tealSignFromProgram = exports.tealSign = exports.logicSigFromByte = exports.signLogicSigTransactionObject = exports.signLogicSigTransaction = exports.makeLogicSig = exports.LogicSigAccount = exports.assignGroupID = exports.computeGroupID = exports.INVALID_MICROALGOS_ERROR_MSG = exports.algosToMicroalgos = exports.microalgosToAlgos = exports.mnemonicFromSeed = exports.seedFromMnemonic = exports.mnemonicToSecretKey = exports.secretKeyToMnemonic = exports.masterDerivationKeyToMnemonic = exports.mnemonicToMasterDerivationKey = exports.modelsv2 = exports.generateAccount = exports.decodeUint64 = exports.encodeUint64 = exports.getApplicationAddress = exports.decodeAddress = exports.encodeAddress = exports.isValidAddress = exports.Indexer = exports.IntDecoding = exports.Kmd = exports.Algodv2 = exports.ERROR_INVALID_MICROALGOS = exports.ERROR_MULTISIG_BAD_SENDER = exports.decodeObj = exports.encodeObj = exports.multisigAddress = exports.appendSignMultisigTransaction = exports.mergeMultisigTransactions = exports.signMultisigTransaction = exports.verifyBytes = exports.signBytes = exports.signBid = exports.signTransaction = exports.MULTISIG_BAD_SENDER_ERROR_MSG = void 0;
const nacl = __importStar(require("./nacl/naclWrappers"));
const address = __importStar(require("./encoding/address"));
const encoding = __importStar(require("./encoding/encoding"));
const txnBuilder = __importStar(require("./transaction"));
const multisig = __importStar(require("./multisig"));
const LogicTemplatesCommonJSExport = __importStar(require("./logicTemplates"));
const bid_1 = __importDefault(require("./bid"));
const convert = __importStar(require("./convert"));
const utils = __importStar(require("./utils/utils"));
const SIGN_BYTES_PREFIX = Buffer.from([77, 88]); // "MX"
// Errors
exports.MULTISIG_BAD_SENDER_ERROR_MSG = 'The transaction sender address and multisig preimage do not match.';
/**
 * signTransaction takes an object with either payment or key registration fields and
 * a secret key and returns a signed blob.
 *
 * Payment transaction fields: from, to, amount, fee, firstRound, lastRound, genesisHash,
 * note(optional), GenesisID(optional), closeRemainderTo(optional)
 *
 * Key registration fields: fee, firstRound, lastRound, voteKey, selectionKey, voteFirst,
 * voteLast, voteKeyDilution, genesisHash, note(optional), GenesisID(optional)
 *
 * If flatFee is not set and the final calculated fee is lower than the protocol minimum fee, the fee will be increased to match the minimum.
 * @param txn - object with either payment or key registration fields
 * @param sk - Algorand Secret Key
 * @returns object contains the binary signed transaction and its txID
 */
function signTransaction(txn, sk) {
    if (typeof txn.from === 'undefined') {
        // Get pk from sk if no sender specified
        const key = nacl.keyPairFromSecretKey(sk);
        // eslint-disable-next-line no-param-reassign
        txn.from = address.encodeAddress(key.publicKey);
    }
    const algoTxn = txnBuilder.instantiateTxnIfNeeded(txn);
    return {
        txID: algoTxn.txID().toString(),
        blob: algoTxn.signTxn(sk),
    };
}
exports.signTransaction = signTransaction;
/**
 * signBid takes an object with the following fields: bidder key, bid amount, max price, bid ID, auctionKey, auction ID,
 * and a secret key and returns a signed blob to be inserted into a transaction Algorand note field.
 * @param bid - Algorand Bid
 * @param sk - Algorand secret key
 * @returns Uint8Array binary signed bid
 */
function signBid(bid, sk) {
    const signedBid = new bid_1.default(bid);
    return signedBid.signBid(sk);
}
exports.signBid = signBid;
/**
 * signBytes takes arbitrary bytes and a secret key, prepends the bytes with "MX" for domain separation, signs the bytes
 * with the private key, and returns the signature.
 * @param bytes - Uint8array
 * @param sk - Algorand secret key
 * @returns binary signature
 */
function signBytes(bytes, sk) {
    const toBeSigned = Buffer.from(utils.concatArrays(SIGN_BYTES_PREFIX, bytes));
    const sig = nacl.sign(toBeSigned, sk);
    return sig;
}
exports.signBytes = signBytes;
/**
 * verifyBytes takes array of bytes, an address, and a signature and verifies if the signature is correct for the public
 * key and the bytes (the bytes should have been signed with "MX" prepended for domain separation).
 * @param bytes - Uint8Array
 * @param signature - binary signature
 * @param addr - string address
 * @returns bool
 */
function verifyBytes(bytes, signature, addr) {
    const toBeVerified = Buffer.from(utils.concatArrays(SIGN_BYTES_PREFIX, bytes));
    const pk = address.decodeAddress(addr).publicKey;
    return nacl.verify(toBeVerified, signature, pk);
}
exports.verifyBytes = verifyBytes;
/**
 * signMultisigTransaction takes a raw transaction (see signTransaction), a multisig preimage, a secret key, and returns
 * a multisig transaction, which is a blob representing a transaction and multisignature account preimage. The returned
 * multisig txn can accumulate additional signatures through mergeMultisigTransactions or appendMultisigTransaction.
 * @param txn - object with either payment or key registration fields
 * @param version - multisig version
 * @param threshold - multisig threshold
 * @param addrs - a list of Algorand addresses representing possible signers for this multisig. Order is important.
 * @param sk - Algorand secret key. The corresponding pk should be in the pre image.
 * @returns object containing txID, and blob of partially signed multisig transaction (with multisig preimage information)
 * If the final calculated fee is lower than the protocol minimum fee, the fee will be increased to match the minimum.
 */
function signMultisigTransaction(txn, { version, threshold, addrs }, sk) {
    // check that the from field matches the mSigPreImage. If from field is not populated, fill it in.
    const expectedFromRaw = address.fromMultisigPreImgAddrs({
        version,
        threshold,
        addrs,
    });
    if (!Object.prototype.hasOwnProperty.call(txn, 'from')) {
        // eslint-disable-next-line no-param-reassign
        txn.from = expectedFromRaw;
    }
    // build pks for partialSign
    const pks = addrs.map((addr) => address.decodeAddress(addr).publicKey);
    // `txn` needs to be handled differently if it's a constructed `Transaction` vs a dict of constructor args
    const txnAlreadyBuilt = txn instanceof txnBuilder.Transaction;
    let algoTxn;
    let blob;
    if (txnAlreadyBuilt) {
        algoTxn = txn;
        blob = multisig.MultisigTransaction.prototype.partialSignTxn.call(algoTxn, { version, threshold, pks }, sk);
    }
    else {
        algoTxn = new multisig.MultisigTransaction(txn);
        blob = algoTxn.partialSignTxn({ version, threshold, pks }, sk);
    }
    return {
        txID: algoTxn.txID().toString(),
        blob,
    };
}
exports.signMultisigTransaction = signMultisigTransaction;
/**
 * mergeMultisigTransactions takes a list of multisig transaction blobs, and merges them.
 * @param multisigTxnBlobs - a list of blobs representing encoded multisig txns
 * @returns blob representing encoded multisig txn
 */
function mergeMultisigTransactions(multisigTxnBlobs) {
    return multisig.mergeMultisigTransactions(multisigTxnBlobs);
}
exports.mergeMultisigTransactions = mergeMultisigTransactions;
/**
 * appendSignMultisigTransaction takes a multisig transaction blob, and appends our signature to it.
 * While we could derive public key preimagery from the partially-signed multisig transaction,
 * we ask the caller to pass it back in, to ensure they know what they are signing.
 * @param multisigTxnBlob - an encoded multisig txn. Supports non-payment txn types.
 * @param version - multisig version
 * @param threshold - multisig threshold
 * @param addrs - a list of Algorand addresses representing possible signers for this multisig. Order is important.
 * @param sk - Algorand secret key
 * @returns object containing txID, and blob representing encoded multisig txn
 */
function appendSignMultisigTransaction(multisigTxnBlob, { version, threshold, addrs }, sk) {
    const pks = addrs.map((addr) => address.decodeAddress(addr).publicKey);
    // obtain underlying txn, sign it, and merge it
    const multisigTxObj = encoding.decode(multisigTxnBlob);
    const msigTxn = multisig.MultisigTransaction.from_obj_for_encoding(multisigTxObj.txn);
    const partialSignedBlob = msigTxn.partialSignTxn({ version, threshold, pks }, sk);
    return {
        txID: msigTxn.txID().toString(),
        blob: mergeMultisigTransactions([multisigTxnBlob, partialSignedBlob]),
    };
}
exports.appendSignMultisigTransaction = appendSignMultisigTransaction;
/**
 * multisigAddress takes multisig metadata (preimage) and returns the corresponding human readable Algorand address.
 * @param version - mutlisig version
 * @param threshold - multisig threshold
 * @param addrs - list of Algorand addresses
 */
function multisigAddress({ version, threshold, addrs, }) {
    return address.fromMultisigPreImgAddrs({ version, threshold, addrs });
}
exports.multisigAddress = multisigAddress;
/**
 * encodeObj takes a javascript object and returns its msgpack encoding
 * Note that the encoding sorts the fields alphabetically
 * @param o - js obj
 * @returns Uint8Array binary representation
 */
function encodeObj(o) {
    return new Uint8Array(encoding.encode(o));
}
exports.encodeObj = encodeObj;
/**
 * decodeObj takes a Uint8Array and returns its javascript obj
 * @param o - Uint8Array to decode
 * @returns object
 */
function decodeObj(o) {
    return encoding.decode(o);
}
exports.decodeObj = decodeObj;
exports.ERROR_MULTISIG_BAD_SENDER = new Error(exports.MULTISIG_BAD_SENDER_ERROR_MSG);
exports.ERROR_INVALID_MICROALGOS = new Error(convert.INVALID_MICROALGOS_ERROR_MSG);
__exportStar(require("./client/algod"), exports);
var algod_1 = require("./client/v2/algod/algod");
Object.defineProperty(exports, "Algodv2", { enumerable: true, get: function () { return __importDefault(algod_1).default; } });
var kmd_1 = require("./client/kmd");
Object.defineProperty(exports, "Kmd", { enumerable: true, get: function () { return __importDefault(kmd_1).default; } });
var intDecoding_1 = require("./types/intDecoding");
Object.defineProperty(exports, "IntDecoding", { enumerable: true, get: function () { return __importDefault(intDecoding_1).default; } });
var indexer_1 = require("./client/v2/indexer/indexer");
Object.defineProperty(exports, "Indexer", { enumerable: true, get: function () { return __importDefault(indexer_1).default; } });
var address_1 = require("./encoding/address");
Object.defineProperty(exports, "isValidAddress", { enumerable: true, get: function () { return address_1.isValidAddress; } });
Object.defineProperty(exports, "encodeAddress", { enumerable: true, get: function () { return address_1.encodeAddress; } });
Object.defineProperty(exports, "decodeAddress", { enumerable: true, get: function () { return address_1.decodeAddress; } });
Object.defineProperty(exports, "getApplicationAddress", { enumerable: true, get: function () { return address_1.getApplicationAddress; } });
var uint64_1 = require("./encoding/uint64");
Object.defineProperty(exports, "encodeUint64", { enumerable: true, get: function () { return uint64_1.encodeUint64; } });
Object.defineProperty(exports, "decodeUint64", { enumerable: true, get: function () { return uint64_1.decodeUint64; } });
var account_1 = require("./account");
Object.defineProperty(exports, "generateAccount", { enumerable: true, get: function () { return __importDefault(account_1).default; } });
exports.modelsv2 = __importStar(require("./client/v2/algod/models/types"));
var mnemonic_1 = require("./mnemonic/mnemonic");
Object.defineProperty(exports, "mnemonicToMasterDerivationKey", { enumerable: true, get: function () { return mnemonic_1.mnemonicToMasterDerivationKey; } });
Object.defineProperty(exports, "masterDerivationKeyToMnemonic", { enumerable: true, get: function () { return mnemonic_1.masterDerivationKeyToMnemonic; } });
Object.defineProperty(exports, "secretKeyToMnemonic", { enumerable: true, get: function () { return mnemonic_1.secretKeyToMnemonic; } });
Object.defineProperty(exports, "mnemonicToSecretKey", { enumerable: true, get: function () { return mnemonic_1.mnemonicToSecretKey; } });
Object.defineProperty(exports, "seedFromMnemonic", { enumerable: true, get: function () { return mnemonic_1.seedFromMnemonic; } });
Object.defineProperty(exports, "mnemonicFromSeed", { enumerable: true, get: function () { return mnemonic_1.mnemonicFromSeed; } });
var convert_1 = require("./convert");
Object.defineProperty(exports, "microalgosToAlgos", { enumerable: true, get: function () { return convert_1.microalgosToAlgos; } });
Object.defineProperty(exports, "algosToMicroalgos", { enumerable: true, get: function () { return convert_1.algosToMicroalgos; } });
Object.defineProperty(exports, "INVALID_MICROALGOS_ERROR_MSG", { enumerable: true, get: function () { return convert_1.INVALID_MICROALGOS_ERROR_MSG; } });
var group_1 = require("./group");
Object.defineProperty(exports, "computeGroupID", { enumerable: true, get: function () { return group_1.computeGroupID; } });
Object.defineProperty(exports, "assignGroupID", { enumerable: true, get: function () { return group_1.assignGroupID; } });
var logicsig_1 = require("./logicsig");
Object.defineProperty(exports, "LogicSigAccount", { enumerable: true, get: function () { return logicsig_1.LogicSigAccount; } });
Object.defineProperty(exports, "makeLogicSig", { enumerable: true, get: function () { return logicsig_1.makeLogicSig; } });
Object.defineProperty(exports, "signLogicSigTransaction", { enumerable: true, get: function () { return logicsig_1.signLogicSigTransaction; } });
Object.defineProperty(exports, "signLogicSigTransactionObject", { enumerable: true, get: function () { return logicsig_1.signLogicSigTransactionObject; } });
Object.defineProperty(exports, "logicSigFromByte", { enumerable: true, get: function () { return logicsig_1.logicSigFromByte; } });
Object.defineProperty(exports, "tealSign", { enumerable: true, get: function () { return logicsig_1.tealSign; } });
Object.defineProperty(exports, "tealSignFromProgram", { enumerable: true, get: function () { return logicsig_1.tealSignFromProgram; } });
exports.LogicTemplates = LogicTemplatesCommonJSExport.default;
__exportStar(require("./makeTxn"), exports);
__exportStar(require("./transaction"), exports);
__exportStar(require("./types"), exports);
//# sourceMappingURL=main.js.map