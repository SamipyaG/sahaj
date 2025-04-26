import React from 'react'
import { FaUser } from 'react-icons/fa'
import { useAuth } from '../../context/authContext'

const SummaryCard = () => {
    const { user } = useAuth()
  return (
    <div className='p-6'>
      <div className="rounded-xl flex bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
        <div className={`text-4xl flex justify-center items-center bg-blue-600 text-white px-6 py-8 rounded-l-xl`}>
            <FaUser className="min-w-[40px]" />
        </div>
        <div className="pl-6 py-3 flex flex-col justify-center">
            <p className="text-lg font-semibold text-blue-800">Welcome Back</p>
            <p className="text-2xl font-bold text-orange-600">{user.name}</p>
        </div>
      </div>
    </div>
  )
}
export default SummaryCard