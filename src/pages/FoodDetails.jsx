import React, { useMemo, useState } from 'react'
import ravageBlack from '../assets/ravage-black.png'
import { getEntryTickets, isFoodUsed } from '../data/store'

export default function FoodDetails({ onBack, onOpenTeam }) {
    const tickets = getEntryTickets().filter(
        (ticket) => ticket.foodEligible
    )

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
                const used = isFoodUsed(ticket.ticketId)

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
                const aUsed = isFoodUsed(a.ticketId)
                const bUsed = isFoodUsed(b.ticketId)

                // USED first
                if (aUsed !== bUsed) {
                    return aUsed ? -1 : 1
                }

                const getSerial = (ticketId) => {
                    const id = String(ticketId || '').trim()

                    // New format:
                    // RAVAGE26-0291-RS-001
                    const match = id.match(/-(\d+)$/)

                    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
                }

                // Numeric serial order
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
                        FOOD DETAILS
                    </div>

                    <div className="light-header-subtitle">
                        FOOD ELIGIBLE ENTRY TICKETS
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
                <div className="empty-state">
                    No food eligible tickets found.
                </div>
            )}

            {tickets.length > 0 && filteredTickets.length === 0 && (
                <div className="empty-state">
                    No matching tickets found.
                </div>
            )}

            <div className="team-list">
                {filteredTickets.map((ticket) => {

                    const used = isFoodUsed(ticket.ticketId)

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
                                    {used ? 'FOOD USED' : 'FOOD NOT USED'}
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