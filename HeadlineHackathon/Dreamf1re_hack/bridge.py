from upload import upload, get_file_id
from download import download
from util import TEST_SENDER_ADDRESS, TEST_SENDER_PRIVATE_KEY, init_post_client


def upload_pdf(filename: str):
    # Upload sample, returns a Transaction ID
    # needed to retrieve the file from the blockchain
    print("Procedure: Upload file to blockchain.")
    txnids = upload(
        filename=filename,
        sender_address=TEST_SENDER_ADDRESS,
        sender_private_key=TEST_SENDER_PRIVATE_KEY
    )
    fid = get_file_id(
        transaction_ids=txnids,
        receiver_address=TEST_SENDER_ADDRESS,
        sender_address=TEST_SENDER_ADDRESS,
        sender_private_key=TEST_SENDER_PRIVATE_KEY,
        post_client=init_post_client(),
        filename=filename
    )
    print(f"File ID: {fid}")
    return fid


def download_pdf(file_id: str):
    # Download sample, saves to current directory
    print("Procedure: Download file from blockchain.")
    filedld, filedldname = download(file_id=file_id)
    return filedld, filedldname
