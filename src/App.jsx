import React, { useState } from 'react'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ExcelImport from './pages/ExcelImport'
import Scanner from './pages/Scanner'
import FoodScanner from './pages/FoodScanner'
import EntryScanner from './pages/EntryScanner'
import EventDetails from './pages/EventDetails'
import TeamDetails from './pages/TeamDetails'
import TicketGenerator from './pages/TicketGenerator'
import EntryDetails from './pages/EntryDetails'
import FoodDetails from './pages/FoodDetails'
import { isLoggedIn } from './data/store'


// Pages: welcome | login | dashboard | excelImport | scanner |
//        foodScanner | entryScanner | eventDetails | teamDetails | ticketGenerator
export default function App() {
  const [page, setPage] = useState(isLoggedIn() ? 'dashboard' : 'welcome')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [teamDetailsBackPage, setTeamDetailsBackPage] = useState('dashboard')

  function goTo(nextPage) {
    setPage(nextPage)
  }

  function handleSelectEvent(event) {
    setSelectedEvent(event)
    goTo('scanner')
  }

  function handleOpenEventDetails() {
    goTo('eventDetails')
  }

  function handleOpenTeam(ticket, backPage = 'dashboard') {
    setSelectedTicket(ticket)
    setTeamDetailsBackPage(backPage)
    goTo('teamDetails')
  }

  return (
    <div className="app-root">
      {page === 'welcome' && <Welcome onEnter={() => goTo('login')} />}

      {page === 'login' && <Login onLoginSuccess={() => goTo('dashboard')} />}

      {page === 'dashboard' && (
        <Dashboard
          onLogout={() => goTo('welcome')}
          onSelectEvent={handleSelectEvent}
          onOpenExcelImport={() => goTo('excelImport')}
          onOpenTicketGenerator={() => goTo('ticketGenerator')}
          onOpenFoodScanner={() => goTo('foodScanner')}
          onOpenEntryScanner={() => goTo('entryScanner')}
        />
      )}

      {page === 'excelImport' && <ExcelImport onBack={() => goTo('dashboard')} />}

      {page === 'scanner' && selectedEvent && (
        <Scanner
          event={selectedEvent}
          onBack={() => goTo('dashboard')}
          onOpenDetails={handleOpenEventDetails}
        />
      )}

      {page === 'foodScanner' && (
        <FoodScanner
          onBack={() => goTo('dashboard')}
          onOpenDetails={() => goTo('foodDetails')}
        />
      )}

      {page === 'entryScanner' && (
        <EntryScanner
          onBack={() => goTo('dashboard')}
          onOpenDetails={() => goTo('entryDetails')}
        />
      )}
      {page === 'teamDetails' && (
        <TeamDetails
          ticket={selectedTicket}
          onBack={() => goTo(teamDetailsBackPage)}
          backLabel={
            teamDetailsBackPage === 'entryDetails'
              ? 'BACK TO ENTRY DETAILS'
              : teamDetailsBackPage === 'foodDetails'
                ? 'BACK TO FOOD DETAILS'
                : teamDetailsBackPage === 'entryScanner'
                  ? 'BACK TO ENTRY SCANNER'
                  : teamDetailsBackPage === 'foodScanner'
                    ? 'BACK TO FOOD SCANNER'
                    : 'BACK TO EVENT'
          }
        />
      )}
      {page === 'foodDetails' && (
        <FoodDetails
          onBack={() => goTo('foodScanner')}
          onOpenTeam={(ticket) => handleOpenTeam(ticket, 'foodDetails')}
        />
      )}
      {page === 'entryDetails' && (
        <EntryDetails
          onBack={() => goTo('entryScanner')}
          onOpenTeam={(ticket) => handleOpenTeam(ticket, 'entryDetails')}
        />
      )}

      {page === 'eventDetails' && selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onBack={() => goTo('scanner')}
          onOpenTeam={handleOpenTeam}
        />
      )}




      {page === 'ticketGenerator' && <TicketGenerator onBack={() => goTo('dashboard')} />}
      <div className="developed-footer">
        Developed by NiranjanSVM
      </div>
    </div>
  )
}
