import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { findEntryTicketById, isFoodUsed, markFoodUsed } from '../data/store'

const READER_ID = 'food-qr-reader'

function safeStopAndClear(instance) {
  if (!instance) return
  let state
  try { state = instance.getState() } catch { return }
  if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
    instance.stop().catch(() => { }).finally(() => {
      try { instance.clear() } catch { }
    })
  } else {
    try { instance.clear() } catch { }
  }
}

export default function FoodScanner({ onBack, onOpenDetails }) {
  const scannerRef = useRef(null)
  const lockRef = useRef(false)
  const [cameraError, setCameraError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    lockRef.current = false
    setCameraError('')
    setResult(null)

    const reader = document.getElementById(READER_ID)
    if (!reader) return undefined

    const secureEnough = window.isSecureContext || ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
    if (!secureEnough) {
      setCameraError('CAMERA REQUIRES HTTPS. For local testing use http://localhost:5173.')
      return undefined
    }

    const scanner = new Html5Qrcode(READER_ID)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
      onScanSuccess,
      () => { },
    ).catch((error) => {
      if (cancelled) return
      const message = String(error?.message || error || '')
      if (/permission|notallowed|denied/i.test(message)) setCameraError('CAMERA ACCESS DENIED. Please allow camera permission and try again.')
      else if (/notfound|no camera|device/i.test(message)) setCameraError('CAMERA NOT FOUND. Connect a camera and try again.')
      else setCameraError('UNABLE TO START CAMERA. Check browser camera permission and HTTPS/localhost access.')
    })

    return () => {
      cancelled = true
      safeStopAndClear(scannerRef.current)
      scannerRef.current = null
    }
  }, [])

  function onScanSuccess(decodedText) {
    if (lockRef.current) return
    lockRef.current = true

    let data = null
    try { data = JSON.parse(decodedText) } catch { data = null }

    // Food QR is the same ENTRY TICKET QR — food eligibility and usage are
    // tracked separately (foodEligible / isFoodUsed) from entry usage, so
    // this reuses the entry ticket lookup rather than a different QR type.
    if (!data || data.type !== 'ENTRY' || !data.ticketId) {
      setResult({ status: 'INVALID_FOOD' })
      return
    }

    const ticket = findEntryTicketById(data.ticketId)
    if (!ticket) {
      setResult({ status: 'INVALID_FOOD' })
      return
    }
    if (!ticket.foodEligible) {
      setResult({ status: 'NOT_ELIGIBLE', ticket })
      return
    }
    if (isFoodUsed(ticket.ticketId)) {
      setResult({ status: 'ALREADY_USED', ticket })
      return
    }

    setResult({ status: 'READY_TO_ACCEPT', ticket })
  }

  function acceptFood() {
    if (!result?.ticket || result.status !== 'READY_TO_ACCEPT') return
    markFoodUsed(result.ticket.ticketId)
    setResult({ status: 'ALLOWED', ticket: result.ticket })
  }

  function scanNext() {
    setResult(null)
    lockRef.current = false
  }

  const statusConfig = {
    READY_TO_ACCEPT: { text: 'VALID FOOD TICKET', className: 'scan-result-allowed' },
    ALLOWED: { text: 'FOOD ACCEPTED', className: 'scan-result-allowed' },
    ALREADY_USED: { text: 'FOOD ALREADY USED', className: 'scan-result-used' },
    NOT_ELIGIBLE: { text: 'NOT FOOD ELIGIBLE', className: 'scan-result-invalid' },
    INVALID_FOOD: { text: 'INVALID FOOD QR', className: 'scan-result-invalid' },
  }

  return (
    <div className="page scanner-page">
      <header className="scanner-header">
        <button className="btn btn-outline-dark" onClick={onBack} type="button">BACK TO DASHBOARD</button>
        <button
          className="btn btn-outline-dark"
          onClick={() => onOpenDetails?.()}
          type="button"
        >
          DETAILS →
        </button>
      </header>

      <h2 className="scanner-title">FOOD SCANNER</h2>
      <p className="scanner-event-name">Accepts ENTRY TICKET QR for food redemption</p>

      <div className="scanner-frame">
        <div id={READER_ID} className="scanner-reader" />
        <div className="scan-corner scan-corner-tl" />
        <div className="scan-corner scan-corner-tr" />
        <div className="scan-corner scan-corner-bl" />
        <div className="scan-corner scan-corner-br" />
        {!result && !cameraError && <div className="scan-line" />}
      </div>

      {cameraError && <div className="scanner-error">{cameraError}</div>}
      {!result && !cameraError && <div className="scan-ready-label">READY TO SCAN</div>}

      {result && (
        <div className={`scan-result ${statusConfig[result.status].className}`}>
          <div className="scan-result-text">{statusConfig[result.status].text}</div>
          {result.ticket && (
            <div className="scan-result-details">
              <div>{result.ticket.teamName}</div>
              <div className="scan-result-ticket-id">{result.ticket.ticketId}</div>
            </div>
          )}
          {result.status === 'READY_TO_ACCEPT' ? (
            <div className="scan-result-actions">
              <button className="btn btn-navy" onClick={acceptFood} type="button">ACCEPT FOOD</button>
              <button className="btn btn-outline-dark" onClick={scanNext} type="button">SCAN NEXT</button>
            </div>
          ) : (
            <button className="btn btn-navy" onClick={scanNext} type="button">SCAN NEXT</button>
          )}
        </div>
      )}
    </div>
  )
}
