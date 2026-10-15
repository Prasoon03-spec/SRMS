// =====================================================
// STUDENT RECORD MANAGEMENT SYSTEM
// script.js
// =====================================================


// =====================================================
// HTML ELEMENTS
// =====================================================

// Supports either class="record-form" or id="record-form"
const studentForm = document.querySelector(
    ".record-form, #record-form"
);

const studentName = document.getElementById("studentName");
const rollNumber = document.getElementById("rollNumber");
const registrationNumber =
    document.getElementById("registrationNumber");
const department = document.getElementById("department");
const semester = document.getElementById("semester");
const cgpa = document.getElementById("cgpa");
const walletAddress = document.getElementById("walletAddress");

const studentCount = document.getElementById("studentCount");
const walletStatus = document.getElementById("walletStatus");
const networkName = document.getElementById("networkName");
const contractStatus = document.getElementById("contractStatus");

const studentTableBody =
    document.getElementById("studentTableBody");

const verifyRollNumber =
    document.getElementById("verifyRollNumber");

const verifyBtn = document.getElementById("verifyBtn");

const verificationResult =
    document.getElementById("verificationResult");

const connectWalletBtn =
    document.getElementById("connectWalletBtn");

const connectWalletDashboardBtn =
    document.getElementById("connectWalletDashboardBtn");


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let students = [];


// =====================================================
// HELPER FUNCTION: ESCAPE HTML
// =====================================================

// Prevents unsafe HTML from being inserted into the page.

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// HELPER FUNCTION: FORMAT CGPA
// =====================================================

// The Solidity contract stores CGPA in scaled format.
//
// Example:
// 8.23 is stored as 823
// 9.50 is stored as 950
//
// This function converts the stored value back to normal CGPA.

function formatCGPA(storedCGPA) {

    const cgpaNumber = Number(storedCGPA) / 100;

    return cgpaNumber.toFixed(2);

}


// =====================================================
// CHECK WHETHER CONTRACT IS CONNECTED
// =====================================================

function isContractConnected() {

    if (
        typeof contract === "undefined" ||
        contract === null
    ) {

        return false;

    }

    return true;

}


// =====================================================
// LOAD STUDENTS FROM BLOCKCHAIN
// =====================================================

async function loadStudentsFromBlockchain() {

    if (!isContractConnected()) {

        console.log("Contract is not connected.");

        return;

    }

    if (!studentTableBody) {

        console.log("Student table body not found.");

        return;

    }

    try {

        console.log(
            "Loading student records from blockchain..."
        );

        studentTableBody.innerHTML = `

            <tr>

                <td colspan="6" style="text-align:center;">

                    Loading blockchain records...

                </td>

            </tr>

        `;


        // Get the latest blockchain block

        const latestBlock =
            await provider.getBlockNumber();


        /*
         * Instead of scanning the complete blockchain
         * at once, we scan it in smaller chunks.
         *
         * This prevents queryFilter from taking too long.
         */

        const BLOCK_RANGE = 2000;


        // Search the most recent 100,000 blocks

        let fromBlock = Math.max(
            0,
            latestBlock - 100000
        );


        let loadedStudents = [];


        while (fromBlock <= latestBlock) {

            const toBlock = Math.min(
                fromBlock + BLOCK_RANGE - 1,
                latestBlock
            );


            console.log(
                `Searching blocks ${fromBlock} to ${toBlock}`
            );


            // Find StudentAdded events

            const events = await contract.queryFilter(

                contract.filters.StudentAdded(),

                fromBlock,

                toBlock

            );


            for (const event of events) {

                try {

                    // Get roll number from the event

                    const rollNumberValue =
                        event.args?.rollNumber ??
                        event.args?.[0];


                    if (
                        rollNumberValue === undefined ||
                        rollNumberValue === null
                    ) {

                        continue;

                    }


                    const rollString =
                        rollNumberValue.toString();


                    // Avoid duplicate records

                    const alreadyLoaded =
                        loadedStudents.some(

                            student =>
                                student.roll === rollString

                        );


                    if (alreadyLoaded) {

                        continue;

                    }


                    // Retrieve complete student details

                    const studentData =
                        await contract.getStudent(
                            rollNumberValue
                        );


                    const student = {

                        name: studentData[0],

                        roll: studentData[1].toString(),

                        registration: studentData[2],

                        department: studentData[3],

                        semester: studentData[4].toString(),

                        // Convert scaled CGPA into decimal CGPA

                        cgpa: formatCGPA(studentData[5]),

                        wallet: studentData[6],

                        status: "Stored on Blockchain"

                    };


                    loadedStudents.push(student);


                } catch (error) {

                    console.error(
                        "Error reading student record:",
                        error
                    );

                }

            }


            // Move to the next block range

            fromBlock = toBlock + 1;

        }


        // Save records in the global array

        students = loadedStudents;


        // Clear the table

        studentTableBody.innerHTML = "";


        // Display records

        if (loadedStudents.length === 0) {

            studentTableBody.innerHTML = `

                <tr class="no-record">

                    <td colspan="6" style="text-align:center;">

                        No student records found.

                    </td>

                </tr>

            `;

        } else {

            for (const student of loadedStudents) {

                displayStudent(student);

            }

        }


        // Update total count

        if (studentCount) {

            studentCount.textContent =
                loadedStudents.length.toString();

        }


        console.log(
            `${loadedStudents.length} student records loaded successfully.`
        );


    } catch (error) {

        console.error(
            "Error Loading Student Records:",
            error
        );


        studentTableBody.innerHTML = `

            <tr>

                <td colspan="6"
                    style="text-align:center; color:red;">

                    Failed to load blockchain records.

                </td>

            </tr>

        `;

    }

}


// =====================================================
// ADD STUDENT TO BLOCKCHAIN
// =====================================================

if (studentForm) {

    studentForm.addEventListener(

        "submit",

        async function (event) {

            event.preventDefault();


            // Check whether all fields are filled

            if (

                studentName.value.trim() === "" ||

                rollNumber.value.trim() === "" ||

                registrationNumber.value.trim() === "" ||

                department.value === "" ||

                semester.value === "" ||

                cgpa.value.trim() === "" ||

                walletAddress.value.trim() === ""

            ) {

                alert("Please fill all the fields.");

                return;

            }


            // Validate Ethereum wallet address

            if (

                !ethers.isAddress(
                    walletAddress.value.trim()
                )

            ) {

                alert(
                    "Please enter a valid Ethereum wallet address."
                );

                return;

            }


            // Check contract connection

            if (!isContractConnected()) {

                alert(
                    "Please connect your wallet first."
                );

                return;

            }


            // Convert semester into a number

            const semesterValue =
                Number(semester.value);


            // Convert CGPA input into a number

            const cgpaInput =
                Number(cgpa.value);


            // Validate semester

            if (

                !Number.isInteger(semesterValue) ||

                semesterValue < 1 ||

                semesterValue > 8

            ) {

                alert(
                    "Please enter a valid semester between 1 and 8."
                );

                return;

            }


            // =================================================
            // DECIMAL CGPA VALIDATION
            // =================================================

            /*
             * The Solidity contract stores CGPA in scaled form.
             *
             * Example:
             *
             * User enters 8.23
             * JavaScript converts it into 823
             * Solidity stores 823
             *
             * Maximum CGPA = 10
             */

            if (

                !Number.isFinite(cgpaInput) ||

                cgpaInput < 0 ||

                cgpaInput > 10

            ) {

                alert(
                    "Please enter a valid CGPA between 0 and 10."
                );

                return;

            }


            // Allow a maximum of two decimal places

            const cgpaText =
                cgpa.value.trim();


            if (

                !/^\d+(\.\d{1,2})?$/.test(cgpaText)

            ) {

                alert(
                    "Please enter CGPA with a maximum of two decimal places."
                );

                return;

            }


            /*
             * Convert normal CGPA into scaled CGPA.
             *
             * Example:
             *
             * 8.23 * 100 = 823
             * 9.5  * 100 = 950
             */

            const cgpaValue =
                Math.round(cgpaInput * 100);


            // Create student object

            const student = {

                name: studentName.value.trim(),

                roll: rollNumber.value.trim(),

                registration:
                    registrationNumber.value.trim(),

                department: department.value,

                semester: semesterValue,

                // Store scaled CGPA in the object

                cgpa: cgpaValue,

                wallet: walletAddress.value.trim(),

                status: "Stored on Blockchain"

            };


            try {

                // Disable submit button during transaction

                const submitButton =
                    studentForm.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled = true;

                }


                // Send data to the smart contract

                const transaction =
                    await contract.addStudent(

                        student.name,

                        student.roll,

                        student.registration,

                        student.department,

                        student.semester,

                        student.cgpa,

                        student.wallet

                    );


                alert(

                    "Transaction submitted.\n" +

                    "Please confirm it in MetaMask."

                );


                // Wait for blockchain confirmation

                await transaction.wait();


                alert(
                    "Student Record Successfully Stored on Blockchain!"
                );


                // Reload records from blockchain

                await loadStudentsFromBlockchain();


                // Get updated total student count

                const total =
                    await contract.totalStudents();


                if (studentCount) {

                    studentCount.textContent =
                        total.toString();

                }


                // Reset the form

                studentForm.reset();


            } catch (error) {

                console.error(
                    "Transaction Error:",
                    error
                );


                const errorMessage =
                    error?.message || "";


                const errorReason =
                    error?.reason || "";


                // Handle duplicate student record

                if (

                    errorReason.includes(
                        "Student Record Already Exists"
                    ) ||

                    errorMessage.includes(
                        "Student Record Already Exists"
                    )

                ) {

                    alert(
                        "Student Record Already Exists for this Roll Number."
                    );


                }

                // Handle owner restriction

                else if (

                    errorReason.includes(
                        "Only Admin Can Perform This Action"
                    ) ||

                    errorMessage.includes(
                        "Only Admin Can Perform This Action"
                    )

                ) {

                    alert(
                        "Only the contract owner can add student records."
                    );


                }

                // Handle invalid semester

                else if (

                    errorReason.includes(
                        "Invalid Semester"
                    ) ||

                    errorMessage.includes(
                        "Invalid Semester"
                    )

                ) {

                    alert(
                        "Please enter a valid semester."
                    );


                }

                // Handle invalid CGPA

                else if (

                    errorReason.includes(
                        "Invalid CGPA"
                    ) ||

                    errorMessage.includes(
                        "Invalid CGPA"
                    )

                ) {

                    alert(
                        "Please enter a valid CGPA between 0 and 10."
                    );


                }

                // Handle invalid wallet

                else if (

                    errorReason.includes(
                        "Invalid Wallet Address"
                    ) ||

                    errorMessage.includes(
                        "Invalid Wallet Address"
                    )

                ) {

                    alert(
                        "Please enter a valid wallet address."
                    );


                }

                // Handle rejected transaction

                else if (

                    error?.code === "ACTION_REJECTED" ||

                    error?.code === 4001

                ) {

                    alert(
                        "Transaction rejected in MetaMask."
                    );


                }

                // Handle other errors

                else {

                    alert(

                        "Transaction failed.\n" +

                        "Please check the browser console."

                    );

                }


            } finally {

                // Enable submit button again

                const submitButton =
                    studentForm.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled = false;

                }

            }

        }

    );

}


// =====================================================
// DISPLAY STUDENT IN TABLE
// =====================================================

function displayStudent(student) {

    if (!studentTableBody) {

        return;

    }


    // Remove the "No records" row

    const noRecordRow =
        studentTableBody.querySelector(
            ".no-record"
        );


    if (noRecordRow) {

        studentTableBody.innerHTML = "";

    }


    // Create table row

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td>

            ${escapeHTML(student.roll)}

        </td>


        <td>

            ${escapeHTML(student.name)}

        </td>


        <td>

            ${escapeHTML(student.department)}

        </td>


        <td>

            ${escapeHTML(student.semester)}

        </td>


        <td>

            ${escapeHTML(student.cgpa)}

        </td>


        <td>

            ${escapeHTML(student.status)}

        </td>

    `;


    studentTableBody.appendChild(row);

}


// =====================================================
// VERIFY STUDENT DIRECTLY FROM BLOCKCHAIN
// =====================================================

if (verifyBtn) {

    verifyBtn.addEventListener(

        "click",

        async function () {

            const roll =
                verifyRollNumber.value.trim();


            // Validate roll number

            if (roll === "") {

                alert(
                    "Please enter a Roll Number."
                );

                return;

            }


            // Check contract connection

            if (!isContractConnected()) {

                alert(
                    "Please connect your wallet first."
                );

                return;

            }


            // Display loading message

            verificationResult.innerHTML = `

                <h3>Verification Result</h3>

                <p>

                    Searching for the student record
                    on the blockchain...

                </p>

            `;


            try {

                // Retrieve student data

                const student =
                    await contract.getStudent(roll);


                // Read student information

                const name =
                    student[0];


                const rollNumberValue =
                    student[1].toString();


                const registrationNumberValue =
                    student[2];


                const departmentValue =
                    student[3];


                const semesterValue =
                    student[4].toString();


                // Convert scaled CGPA into decimal CGPA

                const cgpaValue =
                    formatCGPA(student[5]);


                const walletValue =
                    student[6];


                // Display verification result

                verificationResult.innerHTML = `

                    <h3>
                        Verification Successful
                    </h3>


                    <p>

                        <strong>Name:</strong>

                        ${escapeHTML(name)}

                    </p>


                    <p>

                        <strong>Roll Number:</strong>

                        ${escapeHTML(rollNumberValue)}

                    </p>


                    <p>

                        <strong>Registration Number:</strong>

                        ${escapeHTML(
                    registrationNumberValue
                )}

                    </p>


                    <p>

                        <strong>Department:</strong>

                        ${escapeHTML(departmentValue)}

                    </p>


                    <p>

                        <strong>Semester:</strong>

                        ${escapeHTML(semesterValue)}

                    </p>


                    <p>

                        <strong>CGPA:</strong>

                        ${escapeHTML(cgpaValue)}

                    </p>


                    <p>

                        <strong>Wallet:</strong>

                        ${escapeHTML(walletValue)}

                    </p>


                    <p>

                        <strong>Status:</strong>

                        Verified on Blockchain

                    </p>

                `;


            } catch (error) {

                console.error(
                    "Verification Error:",
                    error
                );


                // Display not-found message

                verificationResult.innerHTML = `

                    <h3>
                        Verification Result
                    </h3>


                    <p style="color:red; font-weight:600;">

                        Student Record Not Found

                    </p>

                `;

            }

        }

    );

}


// =====================================================
// CONNECT WALLET
// =====================================================

async function handleWalletConnection() {

    try {

        // Check whether MetaMask is installed

        if (
            typeof window.ethereum === "undefined"
        ) {

            alert(
                "MetaMask is not installed. Please install MetaMask first."
            );

            return;

        }


        // Connect MetaMask wallet

        await connectWallet();


        // Update wallet status

        if (walletStatus) {

            walletStatus.textContent =
                "Connected";

        }


        // Update contract status

        if (contractStatus) {

            contractStatus.textContent =
                "Active";

        }


        // Get current network

        const network =
            await provider.getNetwork();


        // Display network information

        if (networkName) {

            networkName.textContent =

                `${network.name} (Chain ID: ${network.chainId.toString()})`;

        }


        // Check Sepolia network

        if (

            network.chainId !== 11155111n

        ) {

            alert(
                "Please switch MetaMask to the Sepolia test network."
            );

            return;

        }


        // Get total students

        const total =
            await contract.totalStudents();


        if (studentCount) {

            studentCount.textContent =
                total.toString();

        }


        // Load all blockchain records

        await loadStudentsFromBlockchain();


        alert(
            "Wallet Connected Successfully!"
        );


    } catch (error) {

        console.error(
            "Wallet Connection Error:",
            error
        );


        alert(

            "Wallet Connection Failed!\n" +

            "Please check the browser console."

        );

    }

}


// Attach wallet connection to the main button

if (connectWalletBtn) {

    connectWalletBtn.addEventListener(

        "click",

        handleWalletConnection

    );

}


// Attach wallet connection to dashboard button

if (connectWalletDashboardBtn) {

    connectWalletDashboardBtn.addEventListener(

        "click",

        handleWalletConnection

    );

}


// =====================================================
// AUTO-REFRESH WHEN WALLET OR NETWORK CHANGES
// =====================================================

if (window.ethereum) {

    window.ethereum.on(

        "accountsChanged",

        function () {

            window.location.reload();

        }

    );


    window.ethereum.on(

        "chainChanged",

        function () {

            window.location.reload();

        }

    );

}