import React, { useRef, useState } from 'react'
import ravageBlack from '../assets/ravage-black.png'
import { getEventTickets, getEntryTickets, deleteEventTicket, deleteEntryTicket } from '../data/store'
import Ticket from '../components/Ticket'


// Ticket owner phone numbers are stored in the Excel data as plain local
// numbers (e.g. "9876543210" or "09876543210"), sometimes already with a
// country code or a leading "+". wa.me links only work reliably when given
// the FULL international number (country code + subscriber number, no "+",
// no leading "0"). Without that, WhatsApp can't resolve the contact and
// falls back to asking for the number manually — which is the exact
// behaviour we don't want. This normalizes whatever is stored into that
// format, defaulting to India's country code ("91") since that's what the
// registration data uses, without requiring any change to the Excel import
// or the stored phone fields themselves.
const DEFAULT_COUNTRY_CODE = '91'

function whatsappNumber(phone) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''

  // Strip a leading trunk "0" some local numbers are entered with (e.g. "09876543210").
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  // Already has the country code (e.g. "919876543210") — use as-is.
  if (digits.length === 12 && digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    return digits
  }

  // Bare 10-digit local mobile number — prepend the country code.
  if (digits.length === 10) {
    return DEFAULT_COUNTRY_CODE + digits
  }

  // Anything else (already-international number with a different country
  // code, etc.) — pass through untouched rather than guessing.
  return digits
}

export default function TicketGenerator({ onBack }) {
  const [query, setQuery] = useState('')
  const [selectedTicketId, setSelectedTicketId] = useState('')
  const ticketRef = useRef(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const allTickets = [...getEntryTickets(), ...getEventTickets()]

  const filtered = query
    ? allTickets.filter((t) => {
      const q = query.toLowerCase().trim()

      const ticketId = String(t.ticketId || '').toLowerCase()
      const teamName = String(t.teamName || '').toLowerCase()
      const eventName = String(t.eventLabel || '').toLowerCase()

      const participatingEvents = Array.isArray(t.participatingEvents)
        ? t.participatingEvents.join(' ').toLowerCase()
        : ''

      const ticketType = t.ticketKind === 'ENTRY'
        ? 'entry ticket'
        : 'event ticket'

      return (
        ticketId.includes(q) ||
        teamName.includes(q) ||
        eventName.includes(q) ||
        participatingEvents.includes(q) ||
        ticketType.includes(q)
      )
    })
    : allTickets

  const selectedTicket = allTickets.find((t) => t.ticketId === selectedTicketId) || null

  function dataUrlToFile(dataUrl, fileName) {
    const [header, base64] = dataUrl.split(',')
    const mime = header.match(/data:(.*?);base64/)?.[1] || 'image/png'
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return new File([bytes], fileName, { type: mime })
  }

  async function handleShare() {
    if (!selectedTicket || !ticketRef.current) return

    const phone = whatsappNumber(
      selectedTicket.ownerPhone || selectedTicket.phone
    )

    if (!phone) {
      window.alert('No phone number is available for this ticket.')
      return
    }

    const isEntry = selectedTicket.ticketKind === 'ENTRY'

    const eventsText = isEntry
      ? (
        selectedTicket.participatingEvents &&
          selectedTicket.participatingEvents.length
          ? selectedTicket.participatingEvents.join(', ')
          : 'ENTRY TICKET'
      )
      : selectedTicket.eventLabel

    const message = [
      `Dear ${selectedTicket.teamName || 'Participant'},`,
      '',
      "Your RAVAGE '26 event ticket is ready.",
      '',
      `Ticket ID: ${selectedTicket.ticketId}`,
      `Participating Events: ${eventsText}`,
      '',
      'Please keep this ticket available for entry.',
      '',
      "RAVAGE '26",
      "St. Joseph's College of Engineering & Technology",
    ].join('\n')

    try {
      // Get ticket image
      const dataUrl = ticketRef.current.getDataUrl()

      if (!dataUrl) {
        window.alert('Could not generate ticket image.')
        return
      }

      // Convert ticket image to Blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      // Copy ticket image to clipboard
      if (
        navigator.clipboard?.write &&
        window.ClipboardItem
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type || 'image/png']: blob,
          }),
        ])
      } else {
        window.alert(
          'Your browser does not support image clipboard copy.'
        )
        return
      }

      // Open owner's WhatsApp chat with message
      const whatsappUrl =
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

      window.open(
        whatsappUrl,
        '_blank',
        'noopener,noreferrer'
      )

      // Tell user what to do
      setTimeout(() => {
        window.alert(
          'Ticket image copied!\n\n' +
          'WhatsApp opened for the ticket owner.\n\n' +
          'Press Ctrl + V to paste the ticket image, then Send.'
        )
      }, 500)

    } catch (error) {
      console.error('Share failed:', error)

      window.alert(
        'Could not copy the ticket image.\n\n' +
        'Please use DOWNLOAD TICKET and attach it manually.'
      )
    }
  }

  async function handleDownload() {
    if (!ticketRef.current) return
    await ticketRef.current.download()
  }

  function handleDelete() {
    if (!selectedTicket) return

    setDeleteTarget(selectedTicket)
    setShowDeleteModal(true)
  }

  function confirmDelete() {
    if (!deleteTarget) return

    if (deleteTarget.ticketKind === 'ENTRY') {
      deleteEntryTicket(deleteTarget.ticketId)
    } else {
      deleteEventTicket(deleteTarget.ticketId)
    }

    setShowDeleteModal(false)
    setDeleteTarget(null)
    setSelectedTicketId('')
    setQuery('')
    window.location.reload()
  }

  return (
    <div className="page ticketgen-page">
      {showDeleteModal && deleteTarget && (
        <div className="ravage-modal-overlay">
          <div className="ravage-delete-modal">

            <div className="ravage-modal-logo">
              RAVAGE <span>'26</span>
            </div>

            <div className="ravage-modal-line" />

            <div className="ravage-modal-title">
              DELETE TICKET?
            </div>

            <div className="ravage-modal-message">
              Are you sure you want to delete this ticket?
            </div>

            <div className="ravage-modal-ticket">
              {deleteTarget.ticketId}
            </div>

            <div className="ravage-modal-actions">
              <button
                type="button"
                className="ravage-modal-cancel"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteTarget(null)
                }}
              >
                CANCEL
              </button>

              <button
                type="button"
                className="ravage-modal-delete"
                onClick={confirmDelete}
              >
                DELETE
              </button>
            </div>

          </div>
        </div>
      )}
      <header className="light-header no-print">
        <img src={ravageBlack} alt="RAVAGE '26" className="light-header-logo" />
        <div className="light-header-text">
          <div className="light-header-title">TICKET GENERATOR</div>
        </div>
        <button className="btn btn-outline" onClick={onBack} type="button">
          BACK TO DASHBOARD
        </button>
      </header>

      <div className="ticketgen-layout no-print">
        <div className="ticketgen-search-panel">
          <label className="field-label">SEARCH TICKET ID OR TEAM NAME</label>
          <input
            className="field-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. RAVAGE9000TE001PPT or TECH TITANS"
          />

          {allTickets.length === 0 && (
            <p className="empty-state">No tickets imported yet. Import Excel data first.</p>
          )}

          <div className="ticketgen-results">
            {filtered.map((t) => (
              <button
                key={`${t.ticketKind || 'EVENT'}-${t.ticketId}`}
                type="button"
                className={`ticketgen-result-item ${t.ticketId === selectedTicketId ? 'ticketgen-result-active' : ''
                  }`}
                onClick={() => setSelectedTicketId(t.ticketId)}
              >
                <div>{t.teamName}</div>
                <div className="ticketgen-result-sub">
                  {t.ticketId} &middot; {t.ticketKind === 'ENTRY' ? 'ENTRY TICKET' : t.eventLabel}
                  {t.ticketKind === 'ENTRY' && t.participatingEvents && t.participatingEvents.length > 0
                    ? ` · ${t.participatingEvents.join(', ')}`
                    : ''}
                  {t.foodEligible ? ' · FOOD' : ''}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="ticketgen-preview-panel">
          {selectedTicket ? (
            <>
              <Ticket ref={ticketRef} ticket={selectedTicket} />
              <div className="ticket-actions no-print">
                <button className="btn btn-navy ticket-action-btn" onClick={handleDownload} type="button">
                  DOWNLOAD TICKET
                </button>
                <button className="btn btn-outline ticket-action-btn" onClick={handleShare} type="button">
                  SHARE
                </button>
                <button className="btn btn-danger-outline ticket-action-btn" onClick={handleDelete} type="button">
                  DELETE TICKET
                </button>
              </div>
            </>
          ) : (
            <p className="empty-state">Select a ticket to preview it here.</p>
          )}
        </div>
      </div>
    </div>
  )
}
