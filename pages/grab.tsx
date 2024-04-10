import type { NextPage } from 'next';
import { useEffect, useMemo, useState } from "react"
import { useAccount, useBalance, useWriteContract, useTransactionReceipt, useChainId, useReadContract } from "wagmi"
import { ethers } from 'ethers'
import { abi } from '../utils/abi.json'
import { addressAbbreviation } from "../utils/wallet"
import Link from "next/link"

const GrabPage: NextPage = () => {

  const chainId = useChainId()
  const [id, setId] = useState(0)
  const { data: hash, writeContract, status, variables, error } = useWriteContract()
  const { data: records, refetch: getRecordRefetch } = useReadContract({
    address: '0x4e7271c13A3EdE905C72034F6b117F6e57A1A72B',
    abi,
    args: [id],
    functionName: 'getRecord',
  })

  useEffect(() => {
    if (id) {
      getRecordRefetch()
    }
  }, [id])

  const errMsg = useMemo(() => {
    if (error) {
      const regex = /reason:([\s\S]*)Contract Call/m ;
      const match = error.message.match(regex);
      return match ? match[1] : '';
    }
  }, [error])

  const { data: txData } = useTransactionReceipt({
    hash,
    chainId
  })

  const { address } = useAccount()
  const balance = useBalance({ address })

  const loading = useMemo(() => status === 'pending', [status])

  const parseLog = () => {
    if (txData) {
      const iface = new ethers.Interface(abi);
      const log = txData.logs[0]
      const parseLog = iface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (parseLog?.name === 'Receive') {
        return {
          amount: parseLog.args[2]
        } as {
          amount: bigint
        }
      }
    }
  }

  const transactionEventLog = useMemo(() => {
    return parseLog()
  }, [txData, hash])

  const handleGrab = () => {
    writeContract({
      address: '0x4e7271c13A3EdE905C72034F6b117F6e57A1A72B',
      abi,
      functionName: 'grab',
      args: [
        id
      ],
    })
  }

  return (
    <div>
      <div className="card card-compact bg-gray-50 shadow-sm mt-10 p-4" style={{ width: '450px', height: '300px' }}>
        <span className='text-gray-500 text-lg'>Envelope ID</span>
        <div className="card-body w-full flex items-center justify-center">
          <div className='w-full flex flex-col items-center'>
            <input type="text" className='bg-transparent outline-none text-6xl text-center' placeholder='0' style={{ maxWidth: '400px' }} onChange={(e) => setId(Number(e.target.value || '0'))} />
          </div>
        </div>
      </div>

      {
        (records as any)?.length ? <div className="card card-compact bg-gray-50 shadow-sm mt-4 p-4" style={{ width: '450px', }}>
          <span className='text-gray-500 text-lg'>Records</span>
          <div className="card-body w-full flex items-center justify-center">
            <div className="overflow-x-auto w-full">
              <table className="table">
                {/* head */}
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {/* row 1 */}
                  {
                    (records as any[])?.map((item, index) => {
                      return (
                        <tr key={index}>
                          <td>{addressAbbreviation(item.receiver)}</td>
                          <td>{ethers.formatEther(item.amount)}ETH</td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div> : ''
      }

      {
        transactionEventLog && <div className="card card-compact bg-gray-50 shadow-sm mt-4 p-4" style={{ width: '450px', }}>
          <span className='text-gray-500 text-lg'>Result</span>
          <div className="card-body w-full flex items-center justify-center">
            TX Hash: <Link href={`https://sepolia.etherscan.io/tx/${hash}`} className='text-blue-500'>{addressAbbreviation(hash || '')}</Link>
            Amount: {ethers.formatEther(transactionEventLog.amount)} ETH<br />
          </div>
        </div>
      }
      <div className="w-full flex items-center justify-center mt-6">
        <button className={`btn btn-primary w-full ${loading ? 'btn-disabled' : ''}`} onClick={() => { handleGrab() }}>
          {loading ? <>
            Grabing... <span className="loading loading-ring loading-xs"></span>
          </> : 'Grab'}
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

export default GrabPage;
