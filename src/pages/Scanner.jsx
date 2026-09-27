import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { getEventTickets, isTicketUsed, markTicketUsed } from '../data/store'

const READER_ID = 'event-qr-reader'

function safeStopAndClear(instance) {
  if (!instance) return
  let state = null
  try {
    state = instance.getState()
  } catch {
    return
  }

  if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
    instance.stop().catch(() => {}).finally(() => {
      try { instance.clear() } catch {}
    })
  } else {
    try { instance.clear() } catch {}
  }
}

export default function Scanner({ event, onBack, onOpenDetails }) {
  const scannerRef = useRef(null)
  const startingRef = useRef(false)
  const cancelledRef = useRef(false)
  const scanLockRef = useRef(false)
  const [cameraError, setCameraError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    cancelledRef.current = false
    startingRef.current = false
    scanLockRef.current = false
    setCameraError('')
    setResult(null)

    const reader = document.getElementById(READER_ID)
    if (!reader) return undefined

    // Camera access from a LAN HTTP address is blocked by browsers.
    // localhost is allowed for development; deployed/phone use should be HTTPS.
    const secureEnough = window.isSecureContext || ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
    if (!secureEnough) {
      setCameraError('CAMERA REQUIRES HTTPS. For local testing use http://localhost:5173.')
      return undefined
    }

    const scanner = new Html5Qrcode(READER_ID)
    scannerRef.current = scanner
    startingRef.current = true

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        onScanSuccess,
        () => {},
      )
      .then(() => {
        startingRef.current = false
        if (cancelledRef.current) safeStopAndClear(scanner)
      })
      .catch((error) => {
        startingRef.current = false
        if (cancelledRef.current) return
        console.error('Camera start failed:', error)
        const message = String(error?.message || error || '')
        if (/permission|notallowed|denied/i.test(message)) {
          setCameraError('CAMERA ACCESS DENIED. Please allow camera permission and try again.')
        } else if (/notfound|no camera|device/i.test(message)) {
          setCameraError('CAMERA NOT FOUND. Connect a camera and try again.')
        } else {
          setCameraError('UNABLE TO START CAMERA. Check browser camera permission and HTTPS/localhost access.')
        }
      })

    return () => {
      cancelledRef.current = true
      safeStopAndClear(scannerRef.current)
      scannerRef.current = null
    }
    // event.key intentionally restarts the camera only when switching events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.key])

  function onScanSuccess(decodedText) {
    if (scanLockRef.current) return
    scanLockRef.current = true

    let data = null
    try { data = JSON.parse(decodedText) } catch { data = null }

    if (!data || data.type !== 'EVENT' || !data.ticketId) {
      setResult({ status: 'INVALID_TICKET' })
      return
    }

    const ticket = getEventTickets().find((t) => t.ticketId === data.ticketId)
    if (!ticket) {
      setResult({ status: 'INVALID_TICKET' })
      return
    }
    if (
      ticket.eventKey !== event.key ||
      String(ticket.eventLabel).trim().toLowerCase() !== String(data.event || ticket.eventLabel).trim().toLowerCase()
    ) {
      setResult({ status: 'INVALID_EVENT', ticket })
      return
    }
    if (isTicketUsed(ticket.ticketId)) {
      setResult({ status: 'ALREADY_USED', ticket })
      return
    }

    // Scanning alone never marks the ticket used. The operator must press
    // ACCEPT ENTRY after checking the scanned ticket details.
    setResult({ status: 'READY_TO_ACCEPT', ticket })
  }

  function handleAcceptEntry() {
    if (!result?.ticket || result.status !== 'READY_TO_ACCEPT') return
    markTicketUsed(result.ticket.ticketId)
    setResult({ status: 'ALLOWED', ticket: result.ticket })
  }

  function handleScanNext() {
    setResult(null)
    scanLockRef.current = false
  }

  const statusConfig = {
    READY_TO_ACCEPT: { text: 'VALID TICKET', className: 'scan-result-allowed' },
    ALLOWED: { text: 'ENTRY ACCEPTED', className: 'scan-result-allowed' },
    ALREADY_USED: { text: 'ALREADY USED', className: 'scan-result-used' },
    INVALID_EVENT: { text: 'INVALID EVENT', className: 'scan-result-invalid' },
    INVALID_TICKET: { text: 'INVALID TICKET', className: 'scan-result-invalid' },
  }

  return (
    <div className="page scanner-page">
      <header className="scanner-header">
        <button className="btn btn-outline-dark" onClick={onBack} type="button">BACK TO EVENTS</button>
        <button className="btn btn-outline-dark" onClick={onOpenDetails} type="button">DETAILS &#8594;</button>
      </header>

      <h2 className="scanner-title">EVENT ENTRY SCANNER</h2>
      <p className="scanner-event-name">{event.shortName}</p>

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
              <button className="btn btn-navy" onClick={handleAcceptEntry} type="button">ACCEPT ENTRY</button>
              <button className="btn btn-outline-dark" onClick={handleScanNext} type="button">CANCEL / SCAN NEXT</button>
            </div>
          ) : (
            <button className="btn btn-navy" onClick={handleScanNext} type="button">SCAN NEXT</button>
          )}
        </div>
      )}
    </div>
  )
}
