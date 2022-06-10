# Choice Flash

# Overview
# This tutorial is a guide to using Algofi for Flash Loans. 
# Flash loans allow individuals in the Algorand Ecosystem to obtain any asset through flash loan directly through their terminal.
# The purpose of the flash loan is to correct for arbitrage opportunities in the market.
# Flash loans will only be approved by the Algorand protocol if they produce a profitable trade.

# Requirements
##################################
# All requirements for this Tutorial can be found in the requirements.txt file on the Choice Coin GitHub. 
# To install the requirements run: pip install requirements.txt

# Steps 
##################################

# 1. Import the necessary modules and Algofi Client for Mainnet
import os
from dotenv import dotenv_values
from algosdk import mnemonic
from algofi_amm.v0.asset import Asset
from algofi_amm.v0.client import AlgofiAMMTestnetClient, AlgofiAMMMainnetClient
from algofi_amm.v0.config import PoolType, PoolStatus
from algofi_amm.utils import get_payment_txn, get_params, send_and_wait

# 2. Copy your address and mnemonic here, which can be found in your Algorand Wallet.
sender = ""
key = mnemonic.to_private_key("")

# 3.  Setup Algofi AMM Clients to Mainnet or Testnet
IS_MAINNET = True
if IS_MAINNET:
    amm_client = AlgofiAMMMainnetClient(user_address=sender)
else:
    amm_client = AlgofiAMMTestnetClient(user_address=sender)

# 4. Set the assets.
# The default is Algo, which is ASA ID = 1. 
# For Choice the ASA ID = 297995609.
asset1_id = 1
asset2_id = 297995609

# 5. Define the swap asset and amount.
swap_input_asset = Asset(amm_client, asset2_id)
swap_asset_amount = 10000

# 6. Set the flash loan asset and amount.
flash_loan_asset = swap_input_asset
flash_loan_amount = 10000   
min_amount_to_receive = 2  

# 7. Gets Asset-Pair details.
asset1 = Asset(amm_client, asset1_id)
asset2 = Asset(amm_client, asset2_id)

# 8. Call the pool.
#  You can borrow up to 10% of asset in a pool.

pool = amm_client.get_pool(PoolType.CONSTANT_PRODUCT_75BP_FEE, asset1_id, asset2_id)
lp_asset_id = pool.lp_asset_id
lp_asset = Asset(amm_client, lp_asset_id)

# 9. Confirm transaction validity.
if amm_client.get_user_balance(swap_input_asset) < swap_asset_amount:
    raise Exception(sender + " has insufficient amount of " + swap_input_asset.name + " to pool")
if pool.pool_status == PoolStatus.UNINITIALIZED:
    print("Pool has not been created + initialized")
else:
    swap_exact_for_txn = pool.get_swap_exact_for_txns(
        sender,
        swap_input_asset,
        swap_asset_amount,
        min_amount_to_receive=min_amount_to_receive,
    )
    # Algofi Flash loan Transaction
    flash_loan_txn = pool.get_flash_loan_txns(
        sender,
        swap_input_asset,
        flash_loan_amount,
        group_transaction=swap_exact_for_txn,
    )
    flash_loan_txn.sign_with_private_key(sender, key)
    flash_loan_txn.submit(amm_client.algod, wait=True)

# 10. Collect the value for the swaps.
print(swap_input_asset, min_amount_to_receive)
print("Choice Flash Successful")