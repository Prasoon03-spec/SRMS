
const contractAddress = "0xB483Ae2a62a8B199dF22afC89D3d1AF131448433";

const contractABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_rollNumber",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_registrationNumber",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_department",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_semester",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_cgpa",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "_walletAddress",
                "type": "address"
            }
        ],
        "name": "addStudent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "string",
                "name": "rollNumber",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "walletAddress",
                "type": "address"
            }
        ],
        "name": "StudentAdded",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_rollNumber",
                "type": "string"
            }
        ],
        "name": "getStudent",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalStudents",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let provider;
let signer;
let contract;


// ==========================================
// NETWORK CONFIGURATION
// ==========================================

const SEPOLIA_CHAIN_ID = 11155111n;


// ==========================================
// CONNECT WALLET
// ==========================================

async function connectWallet() {

    try {

        // Check MetaMask availability
        if (!window.ethereum) {

            throw new Error(
                "MetaMask is not installed. Please install MetaMask."
            );

        }


        // Check Ethers.js availability
        if (typeof ethers === "undefined") {

            throw new Error(
                "Ethers.js library is not loaded. Check your HTML script order."
            );

        }


        // Request wallet connection
        await window.ethereum.request({

            method: "eth_requestAccounts"

        });


        // Create Ethers.js v6 provider
        provider = new ethers.BrowserProvider(

            window.ethereum

        );


        // Get network information
        const network = await provider.getNetwork();

        console.log(
            "Connected Network:",
            network.name
        );

        console.log(
            "Chain ID:",
            network.chainId.toString()
        );


        // Verify Sepolia network
        if (network.chainId !== SEPOLIA_CHAIN_ID) {

            throw new Error(

                "Incorrect network. Please switch MetaMask to Sepolia Test Network."

            );

        }


        // Get connected wallet signer
        signer = await provider.getSigner();


        // Get wallet address
        const walletAddress = await signer.getAddress();


        console.log(
            "Wallet Address:",
            walletAddress
        );


        // Create contract instance
        contract = new ethers.Contract(

            contractAddress,

            contractABI,

            signer

        );


        console.log(
            "Contract Instance Created Successfully"
        );


        console.log(
            "Contract Address:",
            contractAddress
        );


        // Verify contract deployment
        const total = await contract.totalStudents();


        console.log(

            "Total Students on Blockchain:",

            total.toString()

        );


        console.log(
            "Wallet Connected Successfully!"
        );


        // Return success status
        return true;


    } catch (error) {

        console.error(
            "COMPLETE WALLET CONNECTION ERROR:",
            error
        );


        let errorMessage = "Wallet Connection Failed!";


        if (error.reason) {

            errorMessage = error.reason;

        }

        else if (error.shortMessage) {

            errorMessage = error.shortMessage;

        }

        else if (error.message) {

            errorMessage = error.message;

        }


        alert(

            errorMessage

        );


        return false;

    }

}


// ==========================================
// META MASK ACCOUNT CHANGE
// ==========================================

if (window.ethereum) {

    window.ethereum.on(

        "accountsChanged",

        function (accounts) {

            if (accounts.length === 0) {

                console.log(
                    "MetaMask disconnected."
                );

            }

            else {

                console.log(
                    "Account changed:",
                    accounts[0]
                );

            }

        }

    );


    // Handle network changes
    window.ethereum.on(

        "chainChanged",

        function () {

            console.log(
                "Network changed. Reloading page..."
            );

            window.location.reload();

        }

    );

}