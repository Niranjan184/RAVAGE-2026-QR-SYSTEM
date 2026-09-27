import React from 'react'
import ravageBlack from '../assets/ravage-black.png'
import { isEntryTicketUsed, isTicketUsed, isFoodUsed } from '../data/store'

export default function TeamDetails({ ticket, onBack, backLabel = 'BACK TO EVENT' }) {
  if (!ticket) {
    return (
      <div className="page details-page">
        <p className="empty-state">No ticket selected.</p>
        <button className="btn btn-navy" onClick={onBack}>
          BACK
        </button>
      </div>
    )
  }

  const used = ticket.ticketKind === 'ENTRY'
    ? isEntryTicketUsed(ticket.ticketId)
    : isTicketUsed(ticket.ticketId)

  return (
    <div className="page details-page">
      <header className="light-header">
        <img src={ravageBlack} alt="RAVAGE '26" className="light-header-logo" />
        <div className="light-header-text">
          <div className="light-header-title">TEAM DETAILS</div>
        </div>
        <button className="btn btn-outline" onClick={onBack}>
          {backLabel}
        </button>
      </header>

      <div className="team-details-card">
        <div className="team-details-row">
          <div className="team-details-label">STATUS</div>
          <div className={`team-details-value ${used ? 'text-used' : 'text-notused'}`}>
            {used ? 'USED' : 'NOT USED'}
          </div>
        </div>

        <div className="team-details-row">
          <div className="team-details-label">TEAM NAME</div>
          <div className="team-details-value">{ticket.teamName}</div>
        </div>

        <div className="team-details-row">
          <div className="team-details-label">REGISTRATION ID</div>
          <div className="team-details-value">{ticket.ticketId}</div>
        </div>

        <div className="team-details-row">
          <div className="team-details-label">COLLEGE</div>
          <div className="team-details-value">{ticket.collegeName}</div>
        </div>

        <div className="team-details-row">
          <div className="team-details-label">TEAM MEMBERS</div>
          <div className="team-details-value">
            <ol className="member-list">
              {ticket.participants.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ol>
          </div>
        </div>

        {ticket.groups && (
          <div className="team-details-row">
            <div className="team-details-label">GROUPS</div>
            <div className="team-details-value">
              <div>Group 1: {ticket.groups.g1.join(', ') || '—'}</div>
              <div>Group 2: {ticket.groups.g2.join(', ') || '—'}</div>
            </div>
          </div>
        )}

        {ticket.participatingEvents && ticket.participatingEvents.length > 0 && (
          <div className="team-details-row">
            <div className="team-details-label">PARTICIPATING EVENTS</div>

            <div className="team-details-value">
              <ul className="member-list">
                {ticket.participatingEvents.map((event) => (
                  <li key={event}>{event}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="team-details-row">
          <div className="team-details-label">TICKET TYPE</div>
          <div className="team-details-value">
            {ticket.isMain ? 'MAIN (FOOD ELIGIBLE)' : 'EVENT ONLY'}
          </div>
        </div>

        {ticket.isMain && (
          <div className="team-details-row">
            <div className="team-details-label">FOOD QR</div>
            <div className={`team-details-value ${isFoodUsed(ticket.ticketId) ? 'text-used' : 'text-notused'}`}>
              {isFoodUsed(ticket.ticketId) ? 'USED' : 'NOT USED'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
