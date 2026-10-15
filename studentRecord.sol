// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract StudentRecord {

    struct Student {

        string name;

        string rollNumber;

        string registrationNumber;

        string department;

        uint256 semester;

        // CGPA is stored multiplied by 100.
        // Example: 8.23 is stored as 823.
        uint256 cgpa;

        address walletAddress;

        bool exists;
    }


    mapping(string => Student) private students;


    uint256 public totalStudents;


    address public owner;


    constructor() {

        owner = msg.sender;

    }


    modifier onlyOwner() {

        require(
            msg.sender == owner,
            "Only Admin Can Perform This Action"
        );

        _;

    }


    event StudentAdded(
        string rollNumber,
        string name,
        address walletAddress
    );


    // =====================================================
    // ADD STUDENT
    // =====================================================

    function addStudent(

        string memory _name,

        string memory _rollNumber,

        string memory _registrationNumber,

        string memory _department,

        uint256 _semester,

        uint256 _cgpa,

        address _walletAddress

    ) public onlyOwner {


        require(
            !students[_rollNumber].exists,
            "Student Record Already Exists"
        );


        require(
            _semester >= 1 && _semester <= 8,
            "Invalid Semester"
        );


        require(
            _cgpa <= 1000,
            "Invalid CGPA"
        );


        require(
            _walletAddress != address(0),
            "Invalid Wallet Address"
        );


        students[_rollNumber] = Student({

            name: _name,

            rollNumber: _rollNumber,

            registrationNumber: _registrationNumber,

            department: _department,

            semester: _semester,

            cgpa: _cgpa,

            walletAddress: _walletAddress,

            exists: true

        });


        totalStudents++;


        emit StudentAdded(
            _rollNumber,
            _name,
            _walletAddress
        );

    }


    // =====================================================
    // GET STUDENT
    // =====================================================

    function getStudent(

        string memory _rollNumber

    )

        public

        view

        returns (

            string memory,

            string memory,

            string memory,

            string memory,

            uint256,

            uint256,

            address

        )

    {


        require(
            students[_rollNumber].exists,
            "Student Record Not Found"
        );


        Student memory student =
            students[_rollNumber];


        return (

            student.name,

            student.rollNumber,

            student.registrationNumber,

            student.department,

            student.semester,

            student.cgpa,

            student.walletAddress

        );

    }

}