import React from 'react'
import { useAuth } from '../../context/authContext'

const Navbar = () => {
    const { user, logout } = useAuth()
  return (
    <div className='flex items-center justify-between h-16 bg-blue-600 text-white px-6 shadow-md'>
        <p className='text-lg font-semibold'>Welcome, {user.name}</p>
        <button 
          className='px-5 py-2 bg-orange-500 text-white rounded-lg 
                     hover:bg-orange-600 transition-all duration-300
                     shadow-md hover:shadow-lg'
          onClick={logout}
        >
          Logout
        </button>
    </div>
  )
}

export default Navbar