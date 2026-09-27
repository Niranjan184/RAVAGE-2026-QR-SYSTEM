import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import QRCode from 'qrcode'
import noFoodTemplate from '../assets/ticket-template-no-food.png'
import foodTemplate from '../assets/ticket-template-food.png'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function fitFont(ctx, text, maxWidth, startSize, minSize, weight = 700, family = 'Arial, sans-serif') {
  let size = startSize
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 1
  }
  return size
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  if (!words.length) return ['']
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawValue(ctx, value, x, y, maxWidth, options = {}) {
  const {
    color = '#ffffff',
    startSize = 24,
    minSize = 13,
    weight = 700,
    family = 'Arial, sans-serif',
    lineHeight = null,
    maxLines = 2,
  } = options

  const text = String(value || '-').trim() || '-'
  const size = options.fixedSize
  ? startSize
  : fitFont(ctx, text, maxWidth, startSize, minSize, weight, family)

ctx.font = `${weight} ${size}px ${family}`
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  const lines = wrapText(ctx, text, maxWidth).slice(0, maxLines)
  const lh = lineHeight || Math.round(size * 1.25)
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lh))
}

// Draws a small AQUA/CYAN label. Used only for fields that have no
// pre-printed label on the template background (Participating Events,
// Year, Phone) — every other field's label already exists on the
// template image itself, so only its value is drawn (via drawValue).
function drawLabel(ctx, text, x, y, options = {}) {
  const { size = 14, weight = 800, family = 'Arial, sans-serif', color = '#11dfff' } = options
  ctx.font = `${weight} ${size}px ${family}`
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

function drawCentered(ctx, text, centerX, centerY, maxWidth, options = {}) {
  const {
    color = '#06111f',
    startSize = 30,
    minSize = 14,
    weight = 800,
    family = 'Arial Narrow, Arial, sans-serif',
  } = options
  const value = String(text || '-').trim() || '-'
  const size = fitFont(ctx, value, maxWidth, startSize, minSize, weight, family)
  ctx.font = `${weight} ${size}px ${family}`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(value, centerX, centerY)
}

async function makeTicketDataUrl(ticket) {
  const isEntryTicket = ticket.ticketKind === 'ENTRY'
  // Food QR belongs ONLY to the Main/Entry ticket (foodEligible is set
  // that way in store.js — always true for ENTRY, always false for
  // per-event tickets). Trust that field directly rather than
  // re-deriving it here.
  const food = Boolean(ticket.foodEligible)
  const templateSrc = food ? foodTemplate : noFoodTemplate

  const eventPayload = isEntryTicket
    ? { ticketId: ticket.ticketId, type: 'ENTRY' }
    : { ticketId: ticket.ticketId, event: ticket.eventLabel, type: 'EVENT' }

  const [template, eventQr, foodQr] = await Promise.all([
    loadImage(templateSrc),
    QRCode.toDataURL(JSON.stringify(eventPayload), {
      margin: 0,
      width: 320,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#ffffff' },
    }),
    food
      ? QRCode.toDataURL(JSON.stringify({ ticketId: ticket.ticketId, type: 'FOOD' }), {
          margin: 0,
          width: 320,
          errorCorrectionLevel: 'H',
          color: { dark: '#000000', light: '#ffffff' },
        })
      : Promise.resolve(''),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = template.naturalWidth
  canvas.height = template.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(template, 0, 0)

  if (food) {
    // Exact FOOD template: 1007 x 1562.
    // The text is kept inside the existing white/dark areas and the QR is
    // reduced slightly so the white quiet-zone remains visible on all sides.
    drawCentered(ctx, isEntryTicket ? 'ENTRY TICKET' : ticket.eventLabel, 732, 418, 440, { startSize: 34, minSize: 18 })

    drawValue(ctx, ticket.ticketId, 280, 490, 300, { startSize: 25, minSize: 14 })
    drawValue(ctx, ticket.teamName, 280, 537, 300, { startSize: 25, minSize: 14 })
    drawValue(ctx, ticket.collegeName, 280, 580, 300, { startSize: 23, minSize: 20, maxLines: 3 })
    drawValue(ctx, (ticket.participants || []).join(', '), 280, 653, 300, {
      startSize: 24,
      minSize: 25,
      maxLines: 3,
      lineHeight: 28,
      fixedSize: true, // don't shrink participants names on food template
    })

    
    const eventQrImg = await loadImage(eventQr)
    // Centered inside the existing white QR panel.
    ctx.drawImage(eventQrImg, 698, 525, 200, 200)

    if (foodQr) {
      const foodQrImg = await loadImage(foodQr)
      ctx.drawImage(foodQrImg, 696, 860, 200, 200)
    }
  } else {
    // Exact NON-FOOD template: 1142 x 1377.
    drawCentered(ctx, isEntryTicket ? 'ENTRY TICKET' : ticket.eventLabel, 799, 448, 475, {
      startSize: 35,
      minSize: 18,
    })

    drawValue(ctx, ticket.ticketId, 312, 538, 345, { startSize: 25, minSize: 14 })
    drawValue(ctx, ticket.teamName, 312, 587, 345, { startSize: 25, minSize: 14 })
    drawValue(ctx, ticket.collegeName, 312, 635, 345, { startSize: 23, minSize: 23, maxLines: 2 })
    drawValue(ctx, (ticket.participants || []).join(', '), 312, 711, 345, {
      startSize: 24,
      minSize: 25,
      maxLines: 3,
      lineHeight: 28,
      fixedSize: true, // don't shrink participants names on non-food template
    })

    
    

    const eventQrImg = await loadImage(eventQr)
    // Medium QR, centered in the existing white QR panel with a clean
    // white quiet-zone around the black QR modules.
    ctx.drawImage(eventQrImg, 805, 580, 205, 205)
  }

  return canvas.toDataURL('image/png')
}

const Ticket = forwardRef(function Ticket({ ticket }, ref) {
  const [dataUrl, setDataUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setDataUrl('')
    setError('')
    if (!ticket) return undefined

    makeTicketDataUrl(ticket)
      .then((url) => alive && setDataUrl(url))
      .catch((err) => {
        console.error(err)
        if (alive) setError('Could not generate the ticket preview.')
      })

    return () => { alive = false }
  }, [ticket])

  useImperativeHandle(ref, () => ({
    async download() {
      if (!dataUrl || !ticket) return
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${ticket.ticketId || 'RAVAGE-ticket'}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
    },
    getDataUrl() {
      return dataUrl
    },
  }), [dataUrl, ticket])

  if (!ticket) return null

  return (
    <div className="exact-ticket-preview">
      {dataUrl ? (
        <img src={dataUrl} alt={`RAVAGE ticket ${ticket.ticketId}`} className="exact-ticket-image" />
      ) : (
        <div className="ticket-render-loading">Generating ticket...</div>
      )}
      {error && <div className="ticket-render-error">{error}</div>}
    </div>
  )
})

export default Ticket
