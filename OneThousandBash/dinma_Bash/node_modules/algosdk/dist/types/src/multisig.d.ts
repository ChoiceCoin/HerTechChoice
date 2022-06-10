import * as txnBuilder from './transaction';
import { EncodedTransaction } from './types/transactions';
import { MultisigMetadata } from './types/multisig';
import { EncodedMultisig } from './types/transactions/encoded';
/**
 Utilities for manipulating multisig transaction blobs.
 */
export declare const MULTISIG_MERGE_LESSTHANTWO_ERROR_MSG = "Not enough multisig transactions to merge. Need at least two";
export declare const MULTISIG_MERGE_MISMATCH_ERROR_MSG = "Cannot merge txs. txIDs differ";
export declare const MULTISIG_MERGE_MISMATCH_AUTH_ADDR_MSG = "Cannot merge txs. Auth addrs differ";
export declare const MULTISIG_MERGE_WRONG_PREIMAGE_ERROR_MSG = "Cannot merge txs. Multisig preimages differ";
export declare const MULTISIG_MERGE_SIG_MISMATCH_ERROR_MSG = "Cannot merge txs. subsigs are mismatched.";
export declare const MULTISIG_NO_MUTATE_ERROR_MSG = "Cannot mutate a multisig field as it would invalidate all existing signatures.";
export declare const MULTISIG_USE_PARTIAL_SIGN_ERROR_MSG = "Cannot sign a multisig transaction using `signTxn`. Use `partialSignTxn` instead.";
interface MultisigMetadataWithPks extends Omit<MultisigMetadata, 'addrs'> {
    pks: Uint8Array[];
}
/**
 * MultisigTransaction is a Transaction that also supports creating partially-signed multisig transactions.
 */
export declare class MultisigTransaction extends txnBuilder.Transaction {
    /**
     * Override inherited method to throw an error, as mutating transactions are prohibited in this context
     */
    addLease(): void;
    /**
     * Override inherited method to throw an error, as mutating transactions are prohibited in this context
     */
    addRekey(): void;
    /**
     * Override inherited method to throw an error, as traditional signing is not allowed
     */
    signTxn(sk: Uint8Array): Uint8Array;
    /**
     * partialSignTxn partially signs this transaction and returns a partially-signed multisig transaction,
     * encoded with msgpack as a typed array.
     * @param version - multisig version
     * @param threshold - multisig threshold
     * @param pks - multisig public key list, order is important.
     * @param sk - an Algorand secret key to sign with.
     * @returns an encoded, partially signed multisig transaction.
     */
    partialSignTxn({ version, threshold, pks }: MultisigMetadataWithPks, sk: Uint8Array): Uint8Array;
    static from_obj_for_encoding(txnForEnc: EncodedTransaction): MultisigTransaction;
}
/**
 * mergeMultisigTransactions takes a list of multisig transaction blobs, and merges them.
 * @param multisigTxnBlobs - a list of blobs representing encoded multisig txns
 * @returns typed array msg-pack encoded multisig txn
 */
export declare function mergeMultisigTransactions(multisigTxnBlobs: Uint8Array[]): Uint8Array;
export declare function verifyMultisig(toBeVerified: Uint8Array, msig: EncodedMultisig, publicKey: Uint8Array): boolean;
export default MultisigTransaction;
