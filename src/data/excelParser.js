import * as XLSX from 'xlsx'
import { EVENTS } from './eventsConfig'

// ==========================================================
// EXCEL PARSER
// ==========================================================
// Reads the real column structure of:
//   1) The MAIN registration Excel
//   2) An EVENT Excel (same full structure as main + "TICKET" column)
//
// No columns are invented. If a column is missing/empty for a
// row, it is simply left null/empty — nothing is guessed.
// ==========================================================

function splitNames(value) {
  if (!value && value !== 0) return []
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function hasValue(v) {
  return v !== null && v !== undefined && String(v).trim() !== ''
}

function readWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        resolve(workbook)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.readAsArrayBuffer(file)
  })
}

function sheetToRows(workbook) {
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true })
}

// Finds the team's "First" event by checking M1 First, M2 First,
// M3 First, M4 First in order and returning the first one found.
// (Kept for backward compatibility — no longer used to decide Food QR,
// since Food QR now belongs only to the Main/Entry ticket. Still useful
// as general per-member data.)
function deriveFirstEvent(row) {
  for (let i = 1; i <= 4; i++) {
    const val = row[`M${i} First`]
    if (val) return String(val).trim()
  }
  return null
}

function buildMemberTiers(row) {
  const members = []
  for (let i = 1; i <= 4; i++) {
    const name = row[`M${i}`]
    if (!name) continue
    members.push({
      name: String(name).trim(),
      first: row[`M${i} First`] || null,
      second: row[`M${i} Second`] || null,
      free: row[`M${i} Free`] || null,
      additional: [row[`M${i} Add 1`], row[`M${i} Add 2`], row[`M${i} Add 3`]].filter(Boolean),
    })
  }
  return members
}

// Detects which events a team is participating in, straight from the
// Main Registration Excel's own columns — using the exact same
// column / groupColumns mapping already defined in eventsConfig.js, so
// there is only ONE place (eventsConfig.js) that needs to change if a
// column name ever changes.
//
// Rule (per spec): if the event's single "column" cell is non-empty, OR
// either of its two "groupColumns" cells (G1 / G2) is non-empty, the
// event is considered selected. G1/G2 are never shown as separate
// events — they always collapse into the one event label.
//
// E-Sports has no column/groupColumns here on purpose (its data isn't
// part of the Main Registration Excel), so it's never auto-detected —
// exactly as the spec requires: "Do not invent data."
function deriveParticipatingEvents(row) {
  const labels = []
  EVENTS.forEach((ev) => {
    if (ev.column) {
      if (hasValue(row[ev.column])) labels.push(ev.label)
      return
    }
    if (ev.groupColumns) {
      const selected = ev.groupColumns.some((col) => hasValue(row[col]))
      if (selected) labels.push(ev.label)
    }
  })
  return labels
}

// ----------------------------------------------------------
// MAIN REGISTRATION EXCEL
// ----------------------------------------------------------
// The Main ticket's own Ticket ID comes from the Excel's "Ticket ID"
// column (e.g. "RAVAGE26-0154-NS") — this is the ONLY place a Main
// Ticket ID is ever read from. The app never generates its own.
export async function parseMainExcel(file) {
  const workbook = await readWorkbook(file)
  const rows = sheetToRows(workbook)

  return rows
    .filter((row) => row['Team Name'])
    .map((row) => {
      const teamName = String(row['Team Name']).trim()
      const phone = String(row['Phone Number'] ?? row['Phone'] ?? '').trim()
      const regId = row['Ticket ID'] ? String(row['Ticket ID']).trim() : ''

      return {
        regId,
        teamName,
        collegeName: row['College Name'] ? String(row['College Name']).trim() : '',
        year: row['Year'] ?? '',
        phone,
        altPhone: row['Alt Phone'] ? String(row['Alt Phone']).trim() : '',
        teamMembers: splitNames(row['Team Members']),
        payStatus: row['Pay Status'] || '',
        mainAmt: row['Main Amt'] ?? null,
        addlAmt: row['Addl Amt'] ?? null,
        totalAmt: row['Total Amt'] ?? null,
        firstEvent: deriveFirstEvent(row),
        participatingEvents: deriveParticipatingEvents(row),
        members: buildMemberTiers(row),
      }
    })
}

// EVENT EXCELS
// ----------------------------------------------------------
// Required/accepted columns:
// Team Name, Participant Name, Event, Phone Number/Phone,
// Ticket ID/TICKET, College Name.
export async function parseEventExcel(file, eventConfig) {
  const workbook = await readWorkbook(file)
  const rows = sheetToRows(workbook)

  return rows
    .filter((row) => row['Ticket ID'] || row['TICKET'])
    .map((row) => {
      const ticketId = String(row['Ticket ID'] ?? row['TICKET']).trim()
      const teamName = row['Team Name'] ? String(row['Team Name']).trim() : ''
      const phone = String(row['Phone Number'] ?? row['Phone'] ?? '').trim()
      const participants = splitNames(row['Participant Name'] ?? row['Participants'] ?? row['Team Members'])
      // The event is authoritative from the dropdown used during upload.
      // Never let an incorrect/old Event cell in the uploaded workbook
      // change the ticket to another event.
      const eventLabel = eventConfig.label
      const collegeName = row['College Name'] ? String(row['College Name']).trim() : ''

      return {
        ticketId,
        eventKey: eventConfig.key,
        eventLabel,
        teamName,
        collegeName,
        phone,
        regId: row['Registration ID'] ? String(row['Registration ID']).trim() : null,
        participants,
        groups: null,
        // Food QR belongs ONLY to the team's Main Registration (Entry)
        // ticket now — never to an individual event-wise ticket.
        isMain: false,
        foodEligible: false,
      }
    })
}

// E-SPORTS EXCEL — STUB
// ----------------------------------------------------------
// The E-Sports file has member names in separate columns instead
// of one comma-separated cell. We don't have the real file yet,
// so this is intentionally left as a stub. Once you send the file,
// this function gets filled in to match its exact headers — nothing
// else in the app needs to change, because it will still return the
// same ticket shape as parseEventExcel() above.
export async function parseEsportsExcel(file) {
  throw new Error(
    'E-Sports Excel format has not been provided yet. Ask the developer to wire up parseEsportsExcel() once the file is available.'
  )
}
