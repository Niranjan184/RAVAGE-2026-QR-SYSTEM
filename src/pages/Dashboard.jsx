import React, { useEffect, useState } from 'react'
import ravageBlack from '../assets/ravage-black.png'
import { EVENTS } from '../data/eventsConfig'
import { EVENT_ICONS, IconGeneric, IconEntry, IconFood } from '../components/icons'
import {
  getStats,
  getStatsForEvent,
  getEntryTickets,
  isEntryTicketUsed,
  isFoodUsed,
  logout,
} from '../data/store'

export default function Dashboard({
  onLogout,
  onSelectEvent,
  onOpenExcelImport,
  onOpenTicketGenerator,
  onOpenFoodScanner,
  onOpenEntryScanner,
}) {
  const [stats, setStats] = useState({ total: 0, used: 0, notUsed: 0 })
  const [entryStats, setEntryStats] = useState({
    total: 0,
    used: 0,
    notUsed: 0,
  })

  const [foodStats, setFoodStats] = useState({
    total: 0,
    used: 0,
    notUsed: 0,
  })
  useEffect(() => {
    setStats(getStats())

    const entryTickets = getEntryTickets()

    const entryUsed = entryTickets.filter((ticket) =>
      isEntryTicketUsed(ticket.ticketId)
    ).length

    const foodTickets = entryTickets.filter(
      (ticket) => ticket.foodEligible
    )

    const foodUsed = foodTickets.filter((ticket) =>
      isFoodUsed(ticket.ticketId)
    ).length

    setEntryStats({
      total: entryTickets.length,
      used: entryUsed,
      notUsed: entryTickets.length - entryUsed,
    })

    setFoodStats({
      total: foodTickets.length,
      used: foodUsed,
      notUsed: foodTickets.length - foodUsed,
    })
  }, [])
  function handleLogout() {
    logout()
    onLogout()
  }

  return (
    <div className="page dashboard-page">
      <header className="dash-header">
        <img src={ravageBlack} alt="RAVAGE '26" className="dash-logo" />
        <div className="dash-header-text">
          <div className="dash-title">RAVAGE '26</div>
          <div className="dash-subtitle">QR ENTRY SYSTEM</div>
        </div>
        <button className="btn btn-outline dash-logout" onClick={handleLogout}>
          LOGOUT
        </button>
      </header>

      <section className="stats-row">
        <div className="stat-card">
          <div className="stat-label">TOTAL TICKETS</div>
          <div className="stat-value">{String(stats.total).padStart(3, '0')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">USED</div>
          <div className="stat-value">{String(stats.used).padStart(3, '0')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">NOT USED</div>
          <div className="stat-value">{String(stats.notUsed).padStart(3, '0')}</div>
        </div>
      </section>
      <section className="events-section">
  <h3 className="section-heading">ENTRY & FOOD</h3>

  <div className="events-grid">

    <button
      className="event-card"
      onClick={onOpenEntryScanner}
      type="button"
    >
      <div className="event-card-top">
        <span className="icon-badge icon-badge-sm"><IconEntry /></span>
        <div className="event-card-name">ENTRY TICKETS</div>
      </div>

      <div className="event-card-meta">
        {entryStats.total > 0
          ? `${entryStats.used} / ${entryStats.total} scanned`
          : 'No entry tickets imported'}
      </div>
    </button>

    <button
      className="event-card"
      onClick={onOpenFoodScanner}
      type="button"
    >
      <div className="event-card-top">
        <span className="icon-badge icon-badge-sm"><IconFood /></span>
        <div className="event-card-name">FOOD TICKETS</div>
      </div>

      <div className="event-card-meta">
        {foodStats.total > 0
          ? `${foodStats.used} / ${foodStats.total} scanned`
          : 'No food tickets available'}
      </div>
    </button>

  </div>
</section>
      <section className="events-section">
        <h3 className="section-heading">EVENTS</h3>
        <div className="events-grid">
          {EVENTS.map((event) => {
            const eventStats = getStatsForEvent(event.key)
            const EventIcon = EVENT_ICONS[event.key] || IconGeneric
            return (
              <button
                key={event.key}
                className="event-card"
                onClick={() => onSelectEvent(event)}
              >
                <div className="event-card-top">
                  <span className="icon-badge icon-badge-sm"><EventIcon /></span>
                  <div className="event-card-name">{event.shortName}</div>
                </div>
                <div className="event-card-meta">
                  {eventStats.total > 0
                    ? `${eventStats.used} / ${eventStats.total} scanned`
                    : event.pending
                      ? 'No data imported yet'
                      : 'No tickets imported'}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="dash-actions">
        <button className="btn btn-navy" onClick={onOpenExcelImport}>
          IMPORT EXCEL DATA
        </button>
        <button className="btn btn-navy" onClick={onOpenTicketGenerator}>
          GENERATE TICKET
        </button>
        
      </section>
    </div>
  )
}
