// ==========================================================
// LOCAL STORAGE DATA STORE
// ==========================================================
// No backend/database. Imported Excel data and scan history live
// in localStorage on this device.
// ==========================================================

const KEYS = {
  registrations: 'ravage_registrations',
  entryTickets: 'ravage_entryTickets',
  eventTickets: 'ravage_eventTickets',
  usedEntryTickets: 'ravage_usedEntryTickets',
  usedTickets: 'ravage_usedTickets',
  usedFood: 'ravage_usedFood',
  auth: 'ravage_auth',
}

function safeParse(str, fallback) {
  if (!str) return fallback
  try { return JSON.parse(str) } catch { return fallback }
}

// ---------------- Registrations (Main Excel) ----------------

export function getRegistrations() {
  return safeParse(localStorage.getItem(KEYS.registrations), [])
}

export function saveRegistrations(newRegs) {
  const existing = getRegistrations()
  const map = new Map(existing.map((r) => [r.regId, r]))
  newRegs.forEach((r) => map.set(r.regId, r))
  const merged = Array.from(map.values())
  localStorage.setItem(KEYS.registrations, JSON.stringify(merged))

  // Main Registration Excel also creates the general MAIN/ENTRY TICKET —
  // one per team. This ticket is NOT event-specific: it represents the
  // whole registered team and lists every event the team is
  // participating in (derived from the PPT / Quiz G1 / Quiz G2 /
  // Prompt G1 / Prompt G2 / BioScope G1 / BioScope G2 / BGM G1 / BGM G2
  // columns — see excelParser.js). It is the ONLY ticket type that ever
  // carries a Food QR.
  const newEntryTickets = merged.map((r) => ({
    ticketId: String(r.regId || '').trim(),
    ticketKind: 'ENTRY',
    eventLabel: 'ENTRY TICKET',
    teamName: r.teamName || '',
    collegeName: r.collegeName || '',
    year: r.year || '',
    phone: r.phone || '',
    ownerPhone: r.phone || '',
    participants: r.teamMembers || [],
    participatingEvents: r.participatingEvents || [],
    regId: r.regId,
    foodEligible: true,
  })).filter((t) => t.ticketId)

  localStorage.setItem(KEYS.entryTickets, JSON.stringify(newEntryTickets))
  recomputeMainFlags()
  return merged
}

// ---------------- General Entry Tickets ----------------

export function getEntryTickets() {
  return safeParse(localStorage.getItem(KEYS.entryTickets), [])
}

export function findEntryTicketById(ticketId) {
  return getEntryTickets().find((t) => t.ticketId === ticketId) || null
}

export function deleteEntryTicket(ticketId) {
  const remaining = getEntryTickets().filter((t) => t.ticketId !== ticketId)
  localStorage.setItem(KEYS.entryTickets, JSON.stringify(remaining))
  const used = getUsedEntryTickets()
  delete used[ticketId]
  localStorage.setItem(KEYS.usedEntryTickets, JSON.stringify(used))
  const food = getUsedFood()
  delete food[ticketId]
  localStorage.setItem(KEYS.usedFood, JSON.stringify(food))
}

// ---------------- Event Tickets ----------------

export function getEventTickets() {
  return safeParse(localStorage.getItem(KEYS.eventTickets), [])
}

export function saveEventTicketsForEvent(eventKey, newTickets) {
  const existing = getEventTickets().filter((t) => t.eventKey !== eventKey)
  const merged = [...existing, ...newTickets]
  localStorage.setItem(KEYS.eventTickets, JSON.stringify(merged))
  recomputeMainFlags()
  return merged
}

export function deleteEventTicket(ticketId) {
  const remaining = getEventTickets().filter((t) => t.ticketId !== ticketId)
  localStorage.setItem(KEYS.eventTickets, JSON.stringify(remaining))
  const used = getUsedTickets()
  delete used[ticketId]
  localStorage.setItem(KEYS.usedTickets, JSON.stringify(used))
  const food = getUsedFood()
  delete food[ticketId]
  localStorage.setItem(KEYS.usedFood, JSON.stringify(food))
}

// Cross-references every event ticket against the Main Excel so the
// ticket knows its owner's phone number (used by Share). Food QR is
// NEVER granted here anymore — it belongs solely to the team's
// Main/Entry ticket (set in saveRegistrations above).
export function recomputeMainFlags() {
  const regs = getRegistrations()
  const regMap = new Map(regs.map((r) => [String(r.regId || ''), r]))
  const teamPhoneMap = new Map(
    regs.map((r) => [
      `${String(r.teamName || '').trim().toLowerCase()}::${String(r.phone || '').replace(/\D/g, '')}`,
      r,
    ]),
  )
  const tickets = getEventTickets()

  const updated = tickets.map((t) => {
    let reg = t.regId ? regMap.get(String(t.regId)) : null
    if (!reg) {
      const key = `${String(t.teamName || '').trim().toLowerCase()}::${String(t.phone || '').replace(/\D/g, '')}`
      reg = teamPhoneMap.get(key) || null
    }

    return {
      ...t,
      isMain: false,
      foodEligible: false,
      ownerPhone: t.phone || reg?.phone || '',
    }
  })

  localStorage.setItem(KEYS.eventTickets, JSON.stringify(updated))
}

export function findTicketById(ticketId) {
  return getEventTickets().find((t) => t.ticketId === ticketId) || null
}

export function getTicketsForEvent(eventKey) {
  return getEventTickets().filter((t) => t.eventKey === eventKey)
}

export function getRegistrationById(regId) {
  return getRegistrations().find((r) => r.regId === regId) || null
}

// ---------------- Used General Entry Ticket tracking ----------------

export function getUsedEntryTickets() {
  return safeParse(localStorage.getItem(KEYS.usedEntryTickets), {})
}

export function isEntryTicketUsed(ticketId) {
  return !!getUsedEntryTickets()[ticketId]
}

export function markEntryTicketUsed(ticketId) {
  const used = getUsedEntryTickets()
  used[ticketId] = { usedAt: new Date().toISOString() }
  localStorage.setItem(KEYS.usedEntryTickets, JSON.stringify(used))
}

// ---------------- Used Event Ticket tracking ----------------

export function getUsedTickets() {
  return safeParse(localStorage.getItem(KEYS.usedTickets), {})
}

export function isTicketUsed(ticketId) {
  return !!getUsedTickets()[ticketId]
}

export function markTicketUsed(ticketId) {
  const used = getUsedTickets()
  used[ticketId] = { usedAt: new Date().toISOString() }
  localStorage.setItem(KEYS.usedTickets, JSON.stringify(used))
}

// ---------------- Used Food QR tracking ----------------

export function getUsedFood() {
  return safeParse(localStorage.getItem(KEYS.usedFood), {})
}

export function isFoodUsed(ticketId) {
  return !!getUsedFood()[ticketId]
}

export function markFoodUsed(ticketId) {
  const used = getUsedFood()
  used[ticketId] = { usedAt: new Date().toISOString() }
  localStorage.setItem(KEYS.usedFood, JSON.stringify(used))
}

// ---------------- Stats ----------------

export function getStats() {
  const tickets = [...getEntryTickets(), ...getEventTickets()]
  const usedEntry = getUsedEntryTickets()
  const usedEvents = getUsedTickets()
  const total = tickets.length
  const usedCount = tickets.filter((t) => t.ticketKind === 'ENTRY' ? usedEntry[t.ticketId] : usedEvents[t.ticketId]).length
  return { total, used: usedCount, notUsed: total - usedCount }
}

export function getStatsForEvent(eventKey) {
  const tickets = getTicketsForEvent(eventKey)
  const used = getUsedTickets()
  const total = tickets.length
  const usedCount = tickets.filter((t) => used[t.ticketId]).length
  return { total, used: usedCount, notUsed: total - usedCount }
}

// ---------------- Auth ----------------

export function isLoggedIn() {
  return localStorage.getItem(KEYS.auth) === 'true'
}

export function setLoggedIn(value) {
  localStorage.setItem(KEYS.auth, value ? 'true' : 'false')
}

export function logout() {
  localStorage.setItem(KEYS.auth, 'false')
}

// ---------------- Danger zone ----------------

export function clearAllImportedData() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key))
}
