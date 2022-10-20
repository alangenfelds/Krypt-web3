import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import { TransactionProvider } from './context/TransactionContext'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TransactionProvider>
      <App />
    </TransactionProvider>
  </React.StrictMode>
)
