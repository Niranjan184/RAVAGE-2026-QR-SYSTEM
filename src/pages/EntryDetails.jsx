import React, { useMemo, useState } from 'react'
import ravageBlack from '../assets/ravage-black.png'
import { getEntryTickets, isEntryTicketUsed } from '../data/store'

export default function EntryDetails({ onBack, onOpenTeam }) {
    const tickets = getEntryTickets()

    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('ALL')

    const filteredTickets = useMemo(() => {
        const getSerial = (ticketId) => {
            const match = String(ticketId || '').match(/-(\d{3})$/)
            return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
        }
        const query = search.trim().toLowerCase()

        return [...tickets]
            .filter((ticket) => {
                const used = isEntryTicketUsed(ticket.ticketId)

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
                const aUsed = isEntryTicketUsed(a.ticketId)
                const bUsed = isEntryTicketUsed(b.ticketId)

                // USED first
                if (aUsed !== bUsed) return aUsed ? -1 : 1

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
                    <div className="light-header-title">
                        ENTRY DETAILS
                    </div>

                    <div className="light-header-subtitle">
                        REGISTERED ENTRY TICKETS
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

            <div className="details-tools">

                <input
                    className="field-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search ticket ID, team name or college..."
                />

                <div className="details-filters">

                    <button
                        className={`btn ${filter === 'ALL' ? 'btn-navy' : 'btn-outline'
                            }`}
                        onClick={() => setFilter('ALL')}
                        type="button"
                    >
                        ALL
                    </button>

                    <button
                        className={`btn ${filter === 'USED' ? 'btn-navy' : 'btn-outline'
                            }`}
                        onClick={() => setFilter('USED')}
                        type="button"
                    >
                        USED
                    </button>

                    <button
                        className={`btn ${filter === 'NOT_USED' ? 'btn-navy' : 'btn-outline'
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
                    No entry tickets found.
                </p>
            )}

            {tickets.length > 0 && filteredTickets.length === 0 && (
                <p className="empty-state">
                    No matching tickets found.
                </p>
            )}

            <div className="team-list">
                {filteredTickets.map((ticket) => {
                    const used = isEntryTicketUsed(ticket.ticketId)

                    return (
                        <div
                            className="team-list-card"
                            key={ticket.ticketId}
                        >
                            <div className="team-list-main">

                                <div className="team-list-name">
                                    {ticket.teamName}
                                </div>

                                <div className="team-list-ticket">
                                    Ticket ID: {ticket.ticketId}
                                </div>

                                <div className="team-list-college">
                                    {ticket.collegeName}
                                </div>

                            </div>

                            <div className="team-list-right">

                                <div
                                    className={`status-pill ${used
                                            ? 'status-used'
                                            : 'status-not-used'
                                        }`}
                                >
                                    {used ? 'USED' : 'NOT USED'}
                                </div>

                                <button
                                    className="btn btn-navy"
                                    onClick={() => onOpenTeam?.(ticket)}
                                    type="button"
                                >
                                    DETAILS →
                                </button>

                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    )
}