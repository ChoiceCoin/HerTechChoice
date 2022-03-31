# WHAT IS AN ALGORAND SMART CONTRACT

Algorand Smart Contracts (ASC1) are small programs that serve various functions on the blockchain and operate on layer-1. Smart contracts are separated into two main categories, smart contracts, and smart signatures. These types are also referred to as stateful and stateless contracts respectively. The type of contract that is written will determine when and how the logic of the program is evaluated. Both types of contracts are written in the Transaction Execution Approval Language (TEAL), which is an assembly-like language that is interpreted by the Algorand Virtual Machine (AVM) running within an Algorand node. TEAL programs can be written by hand or by using the Python language with the PyTEAL compiler.

# WHAT IS PYTEAL

PYTEAL is a python language binding for Algorand Smart Contracts (ASC) that abstracts away the complexities of writing smart contracts. PyTeal allows smart contracts and smart signatures to be written in Python and then compiled to TEAL. Note that the TEAL code is not automatically compiled to byte code, but that can be done with any of the SDKs, including Python. The TEAL code can also be compiled using the goal command-line tool or submitted to the blockchain to allow the node to compile it.

# How to install PYTEAL

Open up your terminal and install pyteal using ("pip3 install pyteal")

# Problem

Create an algorand smart contract using TEAL to slove voting issues: 1. Voting more than once(key issue)

# Solution

Voting allows accounts to register and vote for arbitrary candiates.

This example has a registration period which is defined as regbegin and regend, that defines when a registration starts and when it ends.
it also has a voting period i defined by global state votestart and voteend this controls how long the voting process lasts

An account must register in order to vote. Accounts cannot vote more than once, and if an account opts out of the application before the voting period has concluded, their vote is discarded. The results are visible in the global state of the application, and the winner is the candidate with the highest number of votes.

# HOW TO RUN PROGRAM

install pyteal ("pip3 install pyteal")
install algosdk ("pip3 install py-algorand-sdk")
then simply run the program in your terminal
