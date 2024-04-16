import type { NextPage } from 'next';
import { useMemo, useState } from "react"
import { useAccount, useBalance, useWriteContract, useTransactionReceipt, useChainId } from "wagmi"
import { ethers } from 'ethers'
import { addressAbbreviation } from "../utils/wallet"
import Link from "next/link"
import Card from '../components/Card';
import { CONTRACT_ABI, CONTRACT_ADDRESS, EnvelopeType } from '../constants/contract';

const CreatePage: NextPage = () => {

  const chainId = useChainId()
  const [amount, setAmount] = useState<bigint>(BigInt(0))
  const [envelopeType, setEnvelopeType] = useState(0)
  const [receivers, setReceivers] = useState('')
  const { data: hash, writeContractAsync, status, error } = useWriteContract()

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

  const errMsg = useMemo(() => {
    console.log(error)
    if (error) {
      const regex = /reason:([\s\S]*)Contract Call/m;
      const match = error.message.match(regex);
      return match ? match[1] : error.message;
    }
  }, [error])


  const parseLog = () => {
    if (txData) {
      const iface = new ethers.Interface(CONTRACT_ABI);
      const log = txData.logs[0]
      const parseLog = iface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (parseLog?.name === 'Create') {
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
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'create',
      args: [
        addresses,
        envelopeType
      ],
      value: amount
    })
  }

  return (
    <div>
      <Card title="You're sending">
        <div className='w-full flex flex-col items-center'>
          <input type="text" className='bg-transparent outline-none text-6xl text-center' placeholder='0' style={{ maxWidth: '400px' }} onChange={(e) => setAmount(ethers.parseEther(e.target.value || '0'))} />
          <span className='mt-2 text-gray-500 text-lg'>ETH</span>
          {!isEnough && <span className='mt-2 text-red-500 text-lg'>Insufficient balance.</span>}
        </div>
      </Card>

      <Card title="Envelope Type">
        <div className='w-full flex flex-col items-center'>
          <select className="select select-bordered w-full max-w-xs" onChange={(e) => setEnvelopeType(parseInt(e.target.value))}>
            {EnvelopeType.map((e) => <option key={e.value} value={e.value}>{e.name}</option>)}
          </select>
        </div>
      </Card>

      <Card title="Receivers">
        <div className='w-full flex flex-col items-center'>
          <textarea className="textarea w-full" placeholder="Please separate multiple items using the enter key" style={{ height: '60px' }} onChange={(e) => setReceivers(e.target.value)}></textarea>
          {!isAddresses && receivers !== "" && <span className='mt-2 text-red-500 text-lg'>Invalid address.</span>}
        </div>
      </Card>


      {
        transactionEventLog && <Card title="Result">
          <div className='w-full flex flex-col items-center'>
            TX Hash: <Link href={`https://sepolia.etherscan.io/tx/${hash}`} className='text-blue-500'>{addressAbbreviation(hash || '')}</Link>
            Envelope ID: {transactionEventLog.id.toString()} <br />
            Amount: {ethers.formatEther(transactionEventLog.amount)} ETH<br />
          </div>
        </Card>
      }

      <div className="w-full flex items-center justify-center mt-6">
        <button className={`btn btn-primary w-full ${loading ? 'btn-disabled' : ''}`} onClick={() => { handleCreate() }}>
          {loading ? <>
            Creating... <span className="loading loading-ring loading-xs"></span>
          </> : 'Create'}
        </button>
      </div>
      {
        error && <div className="w-full flex items-center justify-center mt-6">
          <span className='mt-2 text-red-500 text-lg'>{errMsg}</span>
        </div>
      }
    </div>
  )
};

export default CreatePage;
