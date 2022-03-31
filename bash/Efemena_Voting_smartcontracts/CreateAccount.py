from algosdk import account, encoding, mnemonic

privatekey, address = account.generate_account()

if encoding.is_valid_address(address):
    print("The address is valid!")
    print("Address: ", address)
    print("Private key: ", privatekey)
    print("Mnemonics: ", mnemonic.from_private_key(privatekey))
else:
    print("The address is invalid.")