# In production, an escrow account must be newly generated and
# funded to delegate uploading of .txt files. A user must pay
# the fees required to upload the file
# In this demo, a test account is set and is pre-funded
# to show functionality.

from upload import *
from pywebio.input import *
from pywebio.output import *
from pywebio.session import *
from pywebio.platform.tornado import start_server
from qrcode import QRCode, constants
from cv2 import cv2
import base64
import os
from util import TEST_SENDER_PRIVATE_KEY, \
    TEST_SENDER_ADDRESS, search_note_by_txid, get_lines, init_get_client
from checking import check_if_connection_exists
from PIL import Image


class Veritas:
    def __init__(self):
        self.sender_address = None
        self.original_file = None
        self.alpha_fn = None
        self.alpha = None
        self.filename = None
        self.transaction_ids = None
        self.receiver_address = self.sender_address
        self.sender_private_key = TEST_SENDER_PRIVATE_KEY

    @use_scope("upload")
    def to_blockchain(self):
        self.sender_address = TEST_SENDER_ADDRESS
        self.receiver_address = self.sender_address
        # Remove scopes
        remove("download")
        remove("selector")
        remove("manage")
        put_button(
            label="Reload",
            onclick=self.reload_page
        )
        # Show file upload
        file = file_upload(
            label="Find your text file",
            required=True,
            accept=[".txt"]
        )
        # Write
        self.filename = file['filename']
        open(self.filename, 'wb').write(file['content'])
        obtained_from_local = open(self.filename, 'rb').read()
        while True:
            if (self.filename and obtained_from_local) is not None:
                break
        # Await payment from user before uploading
        # Compute cost - A payment of choice can also
        # be included on top of the base cost
        cost = self.compute_cost(self.filename)
        put_text(f"Estimated Cost: {round(cost, 5)} ALGO")
        # Start upload
        file_id = self.custom_upload(
            filename=self.filename,
            sender_address=self.sender_address,
            receiver_address=self.receiver_address,
            sender_private_key=self.sender_private_key
        )
        put_html(
            f"""
            <h5>
                Successfully made {self.filename} permanent. <br>
                Scan this QR Code to get the file. <br>
                Transaction: {file_id}
            </h5>
            """
        )
        # Add data to QR Code and make
        basewidth = 100
        choice_logo = Image.open("choice_logo.jpg")

        wpercent = (basewidth / float(choice_logo.size[0]))
        hsize = int((float(choice_logo.size[1]) * float(wpercent)))
        choice_logo = choice_logo.resize((basewidth, hsize))
        qrc = QRCode(
            error_correction=constants.ERROR_CORRECT_H
        )

        qrc.add_data(file_id)
        qrc.make()
        qrimg = qrc.make_image(
            fill_color="black", back_color="white").convert('RGB')
        pos = ((qrimg.size[0] - choice_logo.size[0]) // 2,
               (qrimg.size[1] - choice_logo.size[1]) // 2)

        qrimg.paste(choice_logo, pos)

        # Save QR Code
        qr_code_saved_fname = f"{self.filename}-QR.png"
        qrimg.save(qr_code_saved_fname)

        # Open QR Code and display
        with open(qr_code_saved_fname, 'rb') as qrimg_:
            __qr__ = qrimg_.read()
            if __qr__ is not None:
                put_image(
                    src=__qr__,
                    format="png",
                    title="QR Code",
                    width="185",
                    height="185",
                )
                put_file(
                    name=qr_code_saved_fname,
                    content=__qr__,
                    label=f"Download QR"
                )
                put_link(
                    name="See on Algoexplorer",
                    url=f"https://testnet.algoexplorer.io/tx/{file_id}",
                    new_window=True
                )
        os.remove(self.filename)
        os.remove(qr_code_saved_fname)

    @use_scope("download")
    def from_blockchain(self):
        # Remove scopes
        remove("upload")
        remove("selector")
        remove("manage")
        put_button(
            label="Reload",
            onclick=self.reload_page,
            position=0
        )
        # Get output
        qrcode = file_upload(
            label="Locate QR Code.",
            accept=".png",
            required=True
        )
        pb_download = "downloadprog"
        put_processbar(
            name=pb_download,
            init=0,
            label="Setting the truth free...",
            auto_close=True
        )
        filename = qrcode['filename']
        open(filename, 'wb').write(qrcode['content'])
        obtained_from_local = open(filename, 'rb').read()
        while True:
            if (qrcode and obtained_from_local) is not None:
                break
        # Decode QR
        qr_ = cv2.imread(filename)
        qr__ = cv2.QRCodeDetector()
        file_id, _, _ = qr__.detectAndDecode(qr_)
        # Initiate download
        # Initialize stuff to be used later
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
        set_processbar(
            name=pb_download,
            value=0.25,
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
                    connection = gotten[(len(gotten) - 1) - 51:]
                    actual = gotten[:(len(gotten) - 1) - 51]
                    remnant.append(actual)
                else:
                    actual = gotten[:]
                    remnant.append(actual)
                    break
            else:
                break
        # Arrange the reference line
        # to link other Transaction IDs
        set_processbar(
            name=pb_download,
            value=0.25,
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
        set_processbar(
            name=pb_download,
            value=0.50,
            label=f"Getting {file_name_decoded}..."
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
        while True:
            try:
                # Get Transaction IDs from the
                # Transaction IDs obtained from the File ID
                txn_ids = get_txn_ids_from_txn_id(
                    __txids=transaction_ids,
                    client=get_client
                )
                set_processbar(
                    name=pb_download,
                    value=0.75,
                    label=f"Getting {file_name_decoded}..."
                )
                # Download the file from the blockchain
                downloaded_file = stitch_records(
                    get_client=get_client,
                    txn_ids=txn_ids
                )
                set_processbar(
                    name=pb_download,
                    value=0.85,
                    label=f"Getting {file_name_decoded}..."
                )
                break
            except Exception as err:
                print(err.args)
        set_processbar(
            name=pb_download,
            value=1,
            label=f"Getting {file_name_decoded}..."
        )
        filedld = downloaded_file
        filedldname = file_name_decoded
        # End download
        put_text(f"Successfully obtained {filedldname}.")
        put_file(
            name=filedldname,
            content=base64.b64decode(filedld).decode().encode("ISO-8859-1"),
            label=f"Download file"
        )
        put_text("Text:")
        put_scrollable(
            base64.b64decode(filedld).decode().encode("ISO-8859-1").decode(),
            height=800
        )
        os.remove(filename)

    @use_scope("selector")
    def selector(self):
        remove("init")
        remove("upload")
        remove("download")
        # Add buttons
        put_button(
            label="Make something permanent",
            onclick=self.to_blockchain,
        )
        put_button(
            label="Retrieve document",
            onclick=self.from_blockchain,
        )

    def root(self):
        remove("main")
        remove("connect")
        remove("init")
        put_scope("main")
        put_scope("connect")
        # Set title
        set_env(title="Choice Texts")
        # Introduction
        choice_logo = open("choice_logo.jpg", "rb").read()
        put_grid(
            [
                [
                    put_html(
                        """
                        <body>
                            <h1>
                                Immutable, transparent <br>
                                records on the blockchain <br>
                            </h1>
                            <h3>
                                <em>Choice Texts</em> allows you <br>
                                to make text files permanent <br>
                                on the Algorand public blockchain. <br> 
                                <br>
                                Now there is a way to preserve <br>
                                our stories for generations <br>
                                and generations to come.
                            </h3>
                        </body> 
                        """,
                    ),
                    put_image(
                        src=choice_logo,
                        format=".jpg",
                        width="250",
                        height="250",
                        title="Choice Logo"
                    )
                ]
            ],
            scope="main"
        )

        with use_scope("init") as init:
            put_button(
                label="Begin",
                onclick=self.selector,
                scope=init
            )

    def custom_upload(
            self,
            filename: str,
            sender_address: str,
            receiver_address: str,
            sender_private_key: str
    ):
        # Init POST Client
        post_client = init_post_client()
        # Init process bar
        process_bar_name = "uploadprog"
        pbvi = 1 / 7
        put_processbar(
            name=process_bar_name,
            init=0,
            label="Making sure things will never change...",
            auto_close=True
        )
        # Open file
        # ( Progress - Task #1 )
        set_processbar(name=process_bar_name, value=pbvi)
        with open(filename, 'rb') as o:
            self.original_file = o.read().decode('ISO-8859-1')
            self.original_file = base64.b64encode(self.original_file.encode()).decode()
        if self.original_file is not None:

            # Get Transaction IDs submitted to the blockchain
            # ( Progress - Task #2 )
            pbvi += pbvi
            set_processbar(
                name=process_bar_name, value=pbvi,
                label="Making sure things will never change..."
            )
            self.transaction_ids = process_publishing(
                feed=self.original_file,
                receiver_address=receiver_address,
                sender_address=sender_address,
                sender_private_key=self.sender_private_key
            )
            # Initialize GET Client
            get_client = init_get_client()
            # Loop until downloaded data is exactly
            # the same with the uploaded data
            # ( Progress - Task #3 )
            pbvi += pbvi
            set_processbar(
                name=process_bar_name, value=pbvi,
                label="Making sure things will never change..."
            )
            while True:
                # Get Transaction IDs from Transaction IDs
                txn_ids = get_txn_ids_from_txn_id(
                    __txids=self.transaction_ids,
                    client=get_client
                )
                # Download the uploaded file from the blockchain
                downloaded_file = stitch_records(
                    get_client=get_client,
                    txn_ids=txn_ids
                )
                # Check if the uploaded file
                # and downloaded file are the same
                # and return Transaction IDs from
                # upload procedure if so
                circular = check_circular(
                    original=self.original_file,
                    stitched=downloaded_file
                )
                if circular:
                    print('File successfully uploaded to blockchain.')
                    break
            # ( Progress - Task #4 )
            # Get File ID and second cost
            pbvi += pbvi
            set_processbar(
                name=process_bar_name, value=pbvi,
                label="Making sure things will never change..."
            )
            print(f"Assigning File ID...Please Wait.")
            alpha_fn = base64.b64encode(filename.encode()).decode()
            alpha = f"<fn>{alpha_fn}</fn>"
            for txid in self.transaction_ids:
                alpha += txid
            # ( Progress - Task #5 )
            pbvi += pbvi
            set_processbar(
                name=process_bar_name, value=pbvi,
                label="Making sure things will never change..."
            )
            feed = get_lines(
                note=alpha,
                max_length=947
            )
            txid = None
            # ( Progress - Task #6 )
            pbvi += pbvi
            set_processbar(
                name=process_bar_name, value=pbvi,
                label="Making sure things will never change..."
            )
            for each in feed:
                if len(each) != 0:
                    if len(feed) > 1:
                        if txid is None:
                            txn = create_transaction(
                                post_client,
                                receiver_address,
                                sender_address,
                                message=each
                            )
                        else:
                            txn = create_transaction(
                                post_client,
                                receiver_address,
                                sender_address,
                                message=each + txid
                            )
                        sgd = txn.sign(sender_private_key)
                        txid = post_client.send_transaction(sgd)
                        transaction.wait_for_confirmation(
                            algod_client=post_client,
                            txid=txid
                        )
                    else:
                        txn = create_transaction(
                            post_client,
                            receiver_address,
                            sender_address,
                            message=each
                        )
                        sgd = txn.sign(sender_private_key)
                        txid = post_client.send_transaction(sgd)
                        transaction.wait_for_confirmation(
                            algod_client=post_client,
                            txid=txid
                        )
            # ( Progress - Task #7 )
            pbvi += pbvi
            set_processbar(
                name=process_bar_name, value=1,
                label="Making sure things will never change..."
            )
            return txid
        else:
            raise Exception("Error: original file is {None}")

    @staticmethod
    def reload_page():
        run_js("window.location.reload();")

    def compute_cost(self, filename):
        with open(filename, 'rb') as o:
            self.original_file = o.read().decode('ISO-8859-1')
            self.original_file = base64.b64encode(self.original_file.encode()).decode()
        lines = get_lines(self.original_file, max_length=947)
        algocost1 = len(lines) * 0.001
        groups = len(lines) / 16
        algocost2 = groups * 0.001
        total_cost = algocost2 + algocost1
        return total_cost


if __name__ == "__main__":
    v = Veritas()
    start_server(
        applications=v.root,
        port=0,
        host="",
        debug=True,
        auto_open_webbrowser=True
    )
