import React, { useRef, useState } from 'react'
import ravageLogo from '../assets/ravage-logo.png'

export default function Welcome({ onEnter }) {
  const trackRef = useRef(null)
  const knobRef = useRef(null)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [completed, setCompleted] = useState(false)
  const dragState = useRef({ startX: 0, maxX: 0, active: false })

  function getMaxX() {
    if (!trackRef.current || !knobRef.current) return 0
    return trackRef.current.offsetWidth - knobRef.current.offsetWidth - 8
  }

  function handleStart(clientX) {
    if (completed) return
    dragState.current.active = true
    dragState.current.startX = clientX - dragX
    dragState.current.maxX = getMaxX()
    setDragging(true)
  }

  function handleMove(clientX) {
    if (!dragState.current.active) return
    let newX = clientX - dragState.current.startX
    newX = Math.max(0, Math.min(newX, dragState.current.maxX))
    setDragX(newX)

    if (newX >= dragState.current.maxX - 4) {
      dragState.current.active = false
      setCompleted(true)
      setDragging(false)
      setTimeout(() => {
        onEnter()
      }, 250)
    }
  }

  function handleEnd() {
    if (!dragState.current.active) return
    dragState.current.active = false
    setDragging(false)
    if (!completed) setDragX(0)
  }

  return (
    <div className="page welcome-page">
      <div className="welcome-top-label">QR ENTRY SYSTEM</div>

      <div className="welcome-center">
        <img src={ravageLogo} alt="RAVAGE '26" className="welcome-logo" />
        <h1 className="welcome-title">RAVAGE '26</h1>
        <p className="welcome-subtitle">NATIONAL LEVEL TECHNICAL SYMPOSIUM</p>
        <p className="welcome-college">ST. JOSEPH'S COLLEGE OF ENGINEERING &amp; TECHNOLOGY</p>
        <p className="welcome-dept">DEPARTMENT OF INFORMATION TECHNOLOGY</p>
      </div>

      <div className="swipe-wrapper">
        <div
          className={`swipe-track ${completed ? 'swipe-track-complete' : ''}`}
          ref={trackRef}
          onMouseMove={(e) => handleMove(e.clientX)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onTouchEnd={handleEnd}
        >
          <span className="swipe-text">{completed ? 'WELCOME' : 'SWIPE TO ENTER'}</span>
          <div
            className="swipe-knob"
            ref={knobRef}
            style={{ transform: `translateX(${dragX}px)` }}
            onMouseDown={(e) => handleStart(e.clientX)}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
          >
            <span className="swipe-arrow">&#8594;</span>
          </div>
        </div>
      </div>
    </div>
  )
}
