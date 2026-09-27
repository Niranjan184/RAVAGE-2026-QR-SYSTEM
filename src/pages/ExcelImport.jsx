import React, { useState } from 'react'
import ravageBlack from '../assets/ravage-black.png'
import { EVENTS } from '../data/eventsConfig'
import { parseMainExcel, parseEventExcel } from '../data/excelParser'
import { saveRegistrations, saveEventTicketsForEvent, getRegistrations, getEventTickets } from '../data/store'

export default function ExcelImport({ onBack }) {
  const [mainStatus, setMainStatus] = useState(null)
  const [mainFileName, setMainFileName] = useState('')
  const [pendingMain, setPendingMain] = useState(null)

  const [selectedEventKey, setSelectedEventKey] = useState(EVENTS[0].key)
  const [eventStatus, setEventStatus] = useState(null)
  const [eventFileName, setEventFileName] = useState('')
  const [pendingEvent, setPendingEvent] = useState(null)

  const [regCount, setRegCount] = useState(getRegistrations().length)
  const [ticketCount, setTicketCount] = useState(getEventTickets().length)

  async function handleMainFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setMainFileName(file.name)
    setMainStatus(null)
    setPendingMain(null)

    try {
      const registrations = await parseMainExcel(file)
      if (registrations.length === 0) {
        setMainStatus({
          type: 'error',
          message: 'No valid rows found. Make sure the Main Excel contains Team Name and Ticket ID columns.',
        })
        return
      }
      setPendingMain(registrations)
      setMainStatus({
        type: 'success',
        message: `File ready: ${registrations.length} team registrations. Review and confirm before saving.`,
      })
    } catch (err) {
      setMainStatus({ type: 'error', message: 'Could not read this file: ' + err.message })
    }
    e.target.value = ''
  }

  function confirmMainImport() {
    if (!pendingMain) return
    saveRegistrations(pendingMain)
    setRegCount(getRegistrations().length)
    setTicketCount(getEventTickets().length)
    setMainStatus({ type: 'success', message: `Imported ${pendingMain.length} team registrations successfully.` })
    setPendingMain(null)
  }

  function cancelMainImport() {
    setPendingMain(null)
    setMainFileName('')
    setMainStatus({ type: 'error', message: 'Main Excel import cancelled. Nothing was changed.' })
  }

  async function handleEventFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setEventFileName(file.name)
    setEventStatus(null)
    setPendingEvent(null)

    const eventConfig = EVENTS.find((ev) => ev.key === selectedEventKey)

    try {
      const tickets = await parseEventExcel(file, eventConfig)
      if (tickets.length === 0) {
        setEventStatus({
          type: 'error',
          message: 'No valid tickets found. Make sure the event Excel contains Ticket ID (or TICKET).',
        })
        return
      }
      setPendingEvent({ eventKey: eventConfig.key, eventLabel: eventConfig.label, tickets })
      setEventStatus({
        type: 'success',
        message: `File ready: ${tickets.length} ${eventConfig.label} tickets. Review and confirm before saving.`,
      })
    } catch (err) {
      setEventStatus({ type: 'error', message: 'Could not read this file: ' + err.message })
    }
    e.target.value = ''
  }

  function confirmEventImport() {
    if (!pendingEvent) return
    saveEventTicketsForEvent(pendingEvent.eventKey, pendingEvent.tickets)
    setTicketCount(getEventTickets().length)
    setEventStatus({ type: 'success', message: `Imported ${pendingEvent.tickets.length} ${pendingEvent.eventLabel} tickets successfully.` })
    setPendingEvent(null)
  }

  function cancelEventImport() {
    setPendingEvent(null)
    setEventFileName('')
    setEventStatus({ type: 'error', message: 'Event Excel import cancelled. Nothing was changed.' })
  }

  return (
    <div className="page import-page">
      <header className="light-header">
        <img src={ravageBlack} alt="RAVAGE '26" className="light-header-logo" />
        <div className="light-header-text">
          <div className="light-header-title">EXCEL IMPORT</div>
        </div>
        <button className="btn btn-outline" onClick={onBack} type="button">BACK TO DASHBOARD</button>
      </header>

      <div className="import-summary">
        Currently loaded: <strong>{regCount}</strong> team registrations,{' '}
        <strong>{ticketCount}</strong> event tickets.
      </div>

      <div className="import-card">
        <h3 className="import-card-title">1. Main Registration Excel</h3>
        <p className="import-card-desc">
          Upload the main registration sheet. <strong>Ticket ID Team Name College Name Year Phone Alt Phone Team Members PPT Quiz G1 Quiz G2 Prompt G1 Prompt G2 BioScope G1 BioScope G2 BGM G1 BGM G2</strong> remains the source used to identify a team's main/food-eligible event. The same sheet also creates the general ENTRY TICKET.
        </p>
        <label className="file-upload-btn">
          {mainFileName || 'CHOOSE MAIN EXCEL FILE'}
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleMainFile} hidden />
        </label>
        {pendingMain && (
          <div className="import-confirm-row">
            <button className="btn btn-navy" onClick={confirmMainImport} type="button">OK — CONFIRM IMPORT</button>
            <button className="btn btn-outline" onClick={cancelMainImport} type="button">CANCEL</button>
          </div>
        )}
        {mainStatus && <div className={`import-status import-status-${mainStatus.type}`}>{mainStatus.message}</div>}
      </div>

      <div className="import-card">
        <h3 className="import-card-title">2. Event-wise Excel</h3>
        <p className="import-card-desc">
          Each event Excel should contain <strong>Team Name, Participant Name, Phone Number, Ticket ID and College Name</strong>. The selected dropdown event becomes the ticket event name; an Event column is not required.
        </p>

        <label className="field-label">EVENT</label>
        <select className="field-input" value={selectedEventKey} onChange={(e) => setSelectedEventKey(e.target.value)}>
          {EVENTS.map((ev) => <option key={ev.key} value={ev.key}>{ev.label}</option>)}
        </select>

        <label className="file-upload-btn" style={{ marginTop: '0.75rem' }}>
          {eventFileName || 'CHOOSE EVENT EXCEL FILE'}
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleEventFile} hidden />
        </label>

        {pendingEvent && (
          <div className="import-confirm-row">
            <button className="btn btn-navy" onClick={confirmEventImport} type="button">OK — CONFIRM IMPORT</button>
            <button className="btn btn-outline" onClick={cancelEventImport} type="button">CANCEL</button>
          </div>
        )}
        {eventStatus && <div className={`import-status import-status-${eventStatus.type}`}>{eventStatus.message}</div>}
      </div>

      <p className="import-note">
        Re-uploading a file for the same event replaces that event's tickets only after you press OK — CONFIRM IMPORT. Scan history is preserved by Ticket ID.
      </p>
    </div>
  )
}
