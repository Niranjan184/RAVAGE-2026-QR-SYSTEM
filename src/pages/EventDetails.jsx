import React, { useMemo, useState } from 'react'
import ravageBlack from '../assets/ravage-black.png'
import { getTicketsForEvent, isTicketUsed, isFoodUsed } from '../data/store'
import { EVENT_ICONS, IconGeneric } from '../components/icons'

export default function EventDetails({ event, onBack, onOpenTeam }) {
  const tickets = getTicketsForEvent(event.key)
  const EventIcon = EVENT_ICONS[event.key] || IconGeneric

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase()

    const getSerial = (ticketId) => {
      const match = String(ticketId || '').match(/(\d{3})(?=[A-Z]+$)/i)
      return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
    }

    return [...tickets]
      .filter((ticket) => {
        const used = isTicketUsed(ticket.ticketId)

        if (filter === 'USED' && !used) return false
        if (filter === 'NOT_USED' && used) return false

        if (!query) return true

        return (
          String(ticket.ticketId || '').toLowerCase().includes(query) ||
          String(ticket.teamName || '').toLowerCase().includes(query) ||
          String(ticket.collegeName || '').toLowerCase().includes(query)
        )
      })
      .sort((a, b) => {
        const aUsed = isTicketUsed(a.ticketId)
        const bUsed = isTicketUsed(b.ticketId)

        // USED tickets first
        if (aUsed !== bUsed) {
          return aUsed ? -1 : 1
        }

        // Then serial order: 001, 002, 003...
        return getSerial(a.ticketId) - getSerial(b.ticketId)
      })
  }, [tickets, search, filter])

  return (
    <div className="page details-page">
      <header className="light-header">
        <img
          src={ravageBlack}
          alt="RAVAGE '26"
          className="light-header-logo"
        />

        <div className="light-header-text">
          <div className="light-header-title-row">
            <span className="icon-badge icon-badge-sm"><EventIcon /></span>
            <div className="light-header-title">
              {event.shortName}
            </div>
          </div>

          <div className="light-header-subtitle">
            EVENT DETAILS
          </div>
        </div>

        <button
          className="btn btn-outline"
          onClick={onBack}
          type="button"
        >
          BACK TO SCANNER
        </button>
      </header>

      {/* SEARCH + FILTER */}
      <div className="details-tools">

        <input
          className="field-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ticket ID, team name or college..."
        />

        <div className="details-filters">

          <button
            className={`btn ${
              filter === 'ALL' ? 'btn-navy' : 'btn-outline'
            }`}
            onClick={() => setFilter('ALL')}
            type="button"
          >
            ALL
          </button>

          <button
            className={`btn ${
              filter === 'USED' ? 'btn-navy' : 'btn-outline'
            }`}
            onClick={() => setFilter('USED')}
            type="button"
          >
            USED
          </button>

          <button
            className={`btn ${
              filter === 'NOT_USED' ? 'btn-navy' : 'btn-outline'
            }`}
            onClick={() => setFilter('NOT_USED')}
            type="button"
          >
            NOT USED
          </button>

        </div>
      </div>

      {tickets.length === 0 && (
        <p className="empty-state">
          No tickets imported yet for this event.
        </p>
      )}

      {tickets.length > 0 && filteredTickets.length === 0 && (
        <p className="empty-state">
          No matching tickets found.
        </p>
      )}

      <div className="team-list">
        {filteredTickets.map((ticket) => {
          const used = isTicketUsed(ticket.ticketId)

          return (
            <div
              key={ticket.ticketId}
              className="team-list-card"
            >
              <div className="team-list-main">

                <div className="team-list-name">
                  {ticket.teamName}
                </div>

                <div className="team-list-ticket">
                  {ticket.ticketId}
                </div>

                <div className="team-list-college">
                  {ticket.collegeName}
                </div>

                {ticket.isMain && (
                  <span className="badge badge-food">
                    MAIN &middot; FOOD ELIGIBLE
                  </span>
                )}

                {ticket.isMain && (
                  <span
                    className={`badge ${
                      isFoodUsed(ticket.ticketId)
                        ? 'badge-used'
                        : 'badge-not-used'
                    }`}
                  >
                    FOOD{' '}
                    {isFoodUsed(ticket.ticketId)
                      ? 'USED'
                      : 'NOT USED'}
                  </span>
                )}

              </div>

              <div className="team-list-right">

                <span
                  className={`status-pill ${
                    used
                      ? 'status-used'
                      : 'status-not-used'
                  }`}
                >
                  {used ? 'USED' : 'NOT USED'}
                </span>

                <button
                  className="btn btn-outline"
                  onClick={() => onOpenTeam(ticket)}
                  type="button"
                >
                  DETAILS &#8594;
                </button>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}