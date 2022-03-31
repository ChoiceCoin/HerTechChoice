# Pyteal Smart Contract On Algorand

## BUILD STEPS

1. Adding global variables
2. Using Wallet Connect API for signing transactions
3. Connecting Sandbox and Algorand Testnet
4. Setting EnableDeveloperAPI configuration parameter to true in the node’s configuration.
5. Adding helper functions to: Compile program source Converts a mnemonic passphrase into a private signing key Wait for a given txid to be confirmed by the network Formats global state for printing Read app global state
6. Creating application for submitting transaction
7. Defining Function to call the deployed smart contract

# REQUIREMENTS

Algorand Wallet
Docker
SandBox

# How to Run Locally

- make sure you have python installed (python-v3+) in your terminal
- make sure you have docker installed
- set up a sandbox instance which is a fast way to create and configure an Algorand development environment with Algod and Indexer
- ./sandbox up nightly
- python3 -m venv venv
  Active venv with
- . venv/bin/activate
  When finished, the sandbox can be stopped with ./sandbox down
