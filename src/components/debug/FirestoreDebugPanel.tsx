import React, { useState, useEffect } from 'react'
import { firestoreDebugger } from '../../utils/firestoreDebugger'
import { auth } from '../../services/firebase'

const FirestoreDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setDebugData(firestoreDebugger.getDebugReport())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const refreshData = () => {
    setDebugData(firestoreDebugger.getDebugReport())
  }

  const copyToClipboard = () => {
    const report = {
      ...debugData,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    navigator.clipboard.writeText(JSON.stringify(report, null, 2))
    alert('Debug report copied to clipboard!')
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => {
            setIsOpen(true)
            refreshData()
          }}
          className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-mono shadow-lg hover:bg-red-600"
        >
          🐛 Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-green-400 p-4 rounded-lg shadow-xl max-w-md max-h-96 overflow-auto font-mono text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-yellow-400 font-bold">🔍 Firestore Debug</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2 py-1 rounded text-xs ${autoRefresh ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            {autoRefresh ? '⏸️' : '▶️'}
          </button>
          <button
            onClick={refreshData}
            className="bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700"
          >
            🔄
          </button>
          <button
            onClick={copyToClipboard}
            className="bg-purple-600 px-2 py-1 rounded text-xs hover:bg-purple-700"
          >
            📋
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-700"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-yellow-400">Current Auth:</div>
          <div className="pl-2">
            User: {auth.currentUser ? '✅' : '❌'} {auth.currentUser?.uid?.substring(0, 8)}
          </div>
        </div>

        {debugData?.authHistory && (
          <div>
            <div className="text-yellow-400">Auth History ({debugData.authHistory.length}):</div>
            <div className="pl-2 max-h-32 overflow-y-auto">
              {debugData.authHistory.slice(-5).map((entry: any, index: number) => (
                <div key={index} className="text-xs">
                  <span className={entry.ready ? 'text-green-400' : 'text-red-400'}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  {' '}
                  <span className={entry.user ? 'text-green-400' : 'text-red-400'}>
                    {entry.user ? '👤' : '❌'}
                  </span>
                  {' '}
                  <span className={entry.token ? 'text-green-400' : 'text-red-400'}>
                    {entry.token ? '🔑' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-400">
          Auto-refresh: {autoRefresh ? 'ON' : 'OFF'} | 
          Time: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

export default FirestoreDebugPanel