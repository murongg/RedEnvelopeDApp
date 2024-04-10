import { useMemo, useState } from "react"
import { useAccount, useBalance, useWriteContract, useTransactionReceipt, useChainId } from "wagmi"
import { ethers } from 'ethers'
import { abi } from '../utils/abi.json'
import { addressAbbreviation } from "../utils/wallet"
import Link from "next/link"

export default function Create() {

  const chainId = useChainId()
  const [amount, setAmount] = useState<bigint>(BigInt(0))
  const [receivers, setReceivers] = useState('')
  const { data: hash, writeContract, status, variables } = useWriteContract()

  const { data: txData } = useTransactionReceipt({
    hash,
    chainId
  })

  const { address } = useAccount()
  const balance = useBalance({ address })

  const isEnough = useMemo(() => {
    return amount <= (balance.data?.value || 0)
  }, [amount, balance.data?.value])

  const isAddresses = useMemo(() => {
    const addresses = receivers.split('\n')
    return addresses.some(address => ethers.isAddress(address))
  }, [receivers])

  const loading = useMemo(() => status === 'pending', [status])

  const parseLog = () => {
    if (txData) {
      const iface = new ethers.Interface(abi);
      const log = txData.logs[0]
      const parseLog = iface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if(parseLog?.name === 'Create') {
        console.log(parseLog)
        return {
          id: parseLog.args[0],
          sender: parseLog.args[1],
          receiver: parseLog.args[2],
          amount: parseLog.args[3]
        } as {
          id: bigint
          sender: string
          receiver: string[]
          amount: bigint
        }
      }
    }
  }

  const transactionEventLog = useMemo(() => {
    return parseLog()
  }, [txData, hash])

  const handleCreate = () => {
    if (!isEnough) {
      return
    }
    if (!isAddresses) {
      return
    }
    const addresses = [...new Set(receivers.split('\n'))]
    writeContract({
      address: '0x4e7271c13A3EdE905C72034F6b117F6e57A1A72B',
      abi,
      functionName: 'create',
      args: [
        addresses
      ],
      value: amount
    })
  }

  return (
    <div>
      <div className="card card-compact bg-gray-50 shadow-sm mt-10 p-4" style={{ width: '450px', height: '300px' }}>
        <span className='text-gray-500 text-lg'>You're sending</span>
        <div className="card-body w-full flex items-center justify-center">
          <div className='w-full flex flex-col items-center'>
            <input type="text" className='bg-transparent outline-none text-6xl text-center' placeholder='0' style={{ maxWidth: '400px' }} onChange={(e) => setAmount(ethers.parseEther(e.target.value || '0'))} />
            <span className='mt-2 text-gray-500 text-lg'>ETH</span>
            {!isEnough && <span className='mt-2 text-red-500 text-lg'>Insufficient balance.</span>}
          </div>
        </div>
      </div>

      <div className="card card-compact bg-gray-50 shadow-sm mt-4 p-4" style={{ width: '450px', }}>
        <span className='text-gray-500 text-lg'>Receivers</span>
        <div className="card-body w-full flex items-center justify-center">
          <textarea className="textarea w-full" placeholder="Please separate multiple items using the enter key" style={{ height: '60px' }} onChange={(e) => setReceivers(e.target.value)}></textarea>
          {!isAddresses && receivers !== "" && <span className='mt-2 text-red-500 text-lg'>Invalid address.</span>}
        </div>
      </div>

      {
        transactionEventLog && <div className="card card-compact bg-gray-50 shadow-sm mt-4 p-4" style={{ width: '450px', }}>
          <span className='text-gray-500 text-lg'>Result</span>
          <div className="card-body w-full flex items-center justify-center">
            TX Hash: <Link href={`https://sepolia.etherscan.io/tx/${hash}`}>{addressAbbreviation(hash || '')}</Link> <br />
            Envelope ID: {transactionEventLog.id.toString()} <br />
            Amount: {ethers.formatEther(transactionEventLog.amount)} ETH<br />
          </div>
        </div>
      }

      <div className="w-full flex items-center justify-center mt-6">
        <button className={`btn btn-primary w-full ${loading ? 'btn-disabled' : ''}`} onClick={() => { handleCreate() }}>
          {loading ? <>
            Creating... <span className="loading loading-ring loading-xs"></span>
          </> : 'Create'}
        </button>
      </div>
    </div>
  )
}
