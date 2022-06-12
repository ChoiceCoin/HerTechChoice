from util import init_get_client, search_note_by_txid, get_lines, get_txn_ids_from_txn_id
import base64
from checking import check_if_connection_exists
from stitching import stitch_records
from pywebio.output import set_processbar, put_processbar


# Main download procedure
def download(file_id: str):
    """
    Download file from blockchain using the
    File ID generated from upload procedure

    :param file_id: The link which is a File ID generated from upload.
    :return: None, after downloading, the downloaded file will be in the same directory.
    """
    # Initialize stuff to be used later
    process_bar_name = "downloadprog"
    put_processbar(
        name=process_bar_name,
        init=0,
        label="Setting the truth free...",
        auto_close=True
    )
    pbd = 1/4
    set_processbar(
        name=process_bar_name,
        value=pbd,
        label="Setting the truth free..."
    )
    get_client = init_get_client()
    remnant = []
    first = True
    connection = None
    fno = None
    file_name_decoded = None
    # Repeat until there is no Connection left.
    # A Connection is the Transaction ID
    # included at the end of a note to serve as
    # a link to the preceding note.
    pbd += pbd
    set_processbar(
        name=process_bar_name,
        value=pbd,
        label="Setting the truth free..."
    )
    while True:
        if first:
            gotten = search_note_by_txid(
                get_client=get_client,
                txid=file_id
            )
            first = False
        else:
            gotten = search_note_by_txid(
                get_client=get_client,
                txid=connection
            )
        if gotten != "":
            has_connection = check_if_connection_exists(gotten)
            # Check if a Transaction ID is
            # expected to be found in the note,
            # thus hinting that there is a preceding
            # note. if "<fn>" is found in the note,
            # it means that the there are no more
            # preceding notes.
            if has_connection and not ("<fn>" in gotten):
                connection = gotten[(len(gotten)-1)-51:]
                actual = gotten[:(len(gotten)-1)-51]
                remnant.append(actual)
            else:
                actual = gotten[:]
                remnant.append(actual)
                break
        else:
            break
    # Arrange the reference line
    # to link other Transaction IDs
    pbd += pbd
    set_processbar(
        name=process_bar_name,
        value=pbd,
        label="Setting the truth free..."
    )
    remnant.reverse()
    omega = ""
    for particle in remnant:
        omega += particle
        if "<fn>" in particle:
            sidx = particle.index("<fn>")
            idxstart_of_fn = sidx + 4
            idxend_of_fn = idxstart_of_fn
            # Get index of end of filename
            while particle[idxend_of_fn] != "<":
                idxend_of_fn += 1
            # Get filename
            fno = particle[idxstart_of_fn:idxend_of_fn]
            file_name_decoded = base64.b64decode(fno.encode()).decode('iso-8859-1')
            print(f"File name: {file_name_decoded} ")
            print(f"File ID: {file_id}")
            print(f"File description: ")
        # An algorithm can be inserted here to get
        # the file description if there is one included
    pbd += pbd
    set_processbar(
        name=process_bar_name,
        value=pbd,
        label="Setting the truth free..."
    )
    filename_whole = f"<fn>{fno}</fn>"
    if filename_whole in omega:
        omega = omega.replace(filename_whole, "")
    else:
        print("Cannot edit omega")
    transaction_ids = get_lines(
        note=omega,
        max_length=52
    )
    pbd += pbd
    set_processbar(
        name=process_bar_name,
        value=pbd,
        label="Setting the truth free..."
    )
    while True:
        try:
            # Get Transaction IDs from the
            # Transaction IDs obtained from the File ID
            txn_ids = get_txn_ids_from_txn_id(
                __txids=transaction_ids,
                client=get_client
            )
            # Download the file from the blockchain
            downloaded_file = stitch_records(
                get_client=get_client,
                txn_ids=txn_ids
            )
            # Return if finished
            return downloaded_file, file_name_decoded
        except Exception as err:
            print(err.args)


# Writes data to disk
def write_to_file(input_data: str, file_name_out: str):
    """
    Write the downloaded file from blockchain to disk.

    :param input_data: The downloaded data from blockchain
    :param file_name_out: Filename of output file
    """
    with open(file_name_out, 'wb') as f:
        to_be = base64.b64decode(input_data).decode()
        f.write(to_be.encode("ISO-8859-1"))
        print(f'\nDownloaded {file_name_out} to current directory')
