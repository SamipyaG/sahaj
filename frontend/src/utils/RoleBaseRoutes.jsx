import React, { useEffect } from 'react'
import { useAuth } from '../context/authContext'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

const RoleBaseRoutes = ({ children, requiredRole }) => {
    const { user, loading } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        // Check if the stored role matches the current user's role
        const storedRole = sessionStorage.getItem('userRole')
        if (user && storedRole !== user.role) {
            // If roles don't match, clear the session and redirect
            localStorage.removeItem('token')
            sessionStorage.removeItem('userRole')
            navigate('/login', { replace: true })
            return
        }

        // Check if user has required role
        if (user && !requiredRole.includes(user.role)) {
            navigate('/unauthorized', { replace: true })
        }
    }, [user, requiredRole, navigate])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (!requiredRole.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />
    }

    return children
}

export default RoleBaseRoutes