import React, { useState } from 'react'
import ravageBlack from '../assets/ravage-black.png'
import { setLoggedIn } from '../data/store'

const VALID_ID = 'ravage'
const VALID_PASSWORD = 'ravage@245'

export default function Login({ onLoginSuccess }) {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (id === VALID_ID && password === VALID_PASSWORD) {
      setError('')
      setLoggedIn(true)
      onLoginSuccess()
    } else {
      setError('Invalid ID or Password')
    }
  }

  return (
    <div className="page login-page">
      <div className="login-card">
        <img src={ravageBlack} alt="RAVAGE '26" className="login-logo" />
        <h2 className="login-heading">QR ENTRY SYSTEM LOGIN</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field-label">LOGIN ID</label>
          <input
            type="text"
            className="field-input"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
          />

          <label className="field-label">PASSWORD</label>
          <input
            type="password"
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-navy login-submit">
            SIGN IN
          </button>
        </form>
      </div>
    </div>
  )
}
