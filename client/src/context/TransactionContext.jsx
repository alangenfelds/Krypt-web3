import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers';

import { contractABI, contractAddress } from '../utils/constants';

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);

  // console.log({ provider, signer, transactionContract })
  return transactionContract;
}

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState();
  const [isLoading, setIsLoading] = useState(false);

  const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount") ?? 0);
  const [transactions, setTransactions] = useState([]);

  const [formData, setFormData] = useState({
    addressTo: '',
    amount: '',
    keyword: '',
    message: ''
  })

  const handleChange = (e, inputName) => {
    setFormData((prevState) => ({
      ...prevState,
      [inputName]: e.target.value
    }));
  }

  const getAllTransactions = async () => {
    try {
      if (ethereum) {
        const transactionsContract = getEthereumContract();

        const availableTransactions = await transactionsContract.getAllTransactions();

        const structuredTransactions = availableTransactions.map((transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount._hex) / (10 ** 18)
        }));

        console.log(structuredTransactions);

        setTransactions(structuredTransactions);
      } else {
        console.log("Ethereum is not present");
      }
    } catch (error) {
      console.log(error);
    }
  };


  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) {
      return alert('Please install MetaMask!')
    }

    try {
      const accounts = await ethereum.request({
        method: 'eth_accounts'
      })

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log('No accounts found!')
      }

    } catch (error) {
      console.log('Error getting accounts: ', error)
    }
  }

  const checkIfTransactionsExists = async () => {
    try {
      if (window.ethereum) {
        const transactionsContract = getEthereumContract();
        const currentTransactionCount = await transactionsContract.getAllTransactionCount();

        window.localStorage.setItem("transactionCount", currentTransactionCount);
      }
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        return alert('Please install MetaMask!')
      }
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
      }

    } catch (error) {
      console.log('Error connecting to wallet: ', error);

      throw new Error('No ethereum object.')
    }
  }

  const sendTransaction = async () => {
    try {
      if (!window.ethereum) {
        return alert('Please install MetaMask!')
      }

      const { addressTo, amount, keyword, message } = formData;
      const transactionContract = await getEthereumContract();

      // convert to hex WEI
      const parsedAmount = ethers.utils.parseEther(amount);

      await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: currentAccount,
          to: addressTo,
          gas: "0x5208", // hex of 21000 WEI amount
          value: parsedAmount._hex  // hex of WEI
        }]
      });

      const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

      setIsLoading(true);
      console.log('Loading - ', + transactionHash);

      await transactionHash.wait();
      setIsLoading(false);
      console.log('Success - ', + transactionHash);

      const transactionsCount = await transactionContract.getAllTransactionCount();

      setTransactionCount(transactionsCount.toNumber());
      localStorage.setItem("transactionCount", transactionsCount.toNumber())

      window.location.reload();

    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExists();
  }, [])

  return (
    <TransactionContext.Provider value={{ connectWallet, currentAccount, handleChange, formData, sendTransaction, isLoading, transactions }}>
      {children}
    </TransactionContext.Provider>
  )
}