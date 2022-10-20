import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers';

import { contractAbi, contractAddress } from '../utils/constants';

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(contractAddress, contractAbi, signer);

  // console.log({ provider, signer, transactionContract })
  return transactionContract;
}

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount") ?? 0);
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
  }, [])

  return (
    <TransactionContext.Provider value={{ connectWallet, currentAccount, handleChange, formData, sendTransaction, isLoading }}>
      {children}
    </TransactionContext.Provider>
  )
}