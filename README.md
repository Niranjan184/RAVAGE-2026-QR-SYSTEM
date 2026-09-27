# RAVAGE '26 — QR Entry & Ticket Management System

React + Vite, no backend, no database. All data lives in the browser's
localStorage after you import your Excel files.

## 1. Project location

Copy this whole folder to:

```
C:\Users\veera\OneDrive\Desktop\TYSON\QR-TICKET\QR-TICKET
```

(Note: your original path said "OR-TICKET" for the inner folder — copy the
contents of this project INTO your `QR-TICKET` folder so `package.json`
sits directly inside it.)

## 2. Install dependencies (Windows PowerShell)

Open PowerShell inside the project folder and run:

```
npm.cmd install
```

That single command installs everything listed in `package.json`,
including `html5-qrcode`, `qrcode`, and `xlsx` — you don't need to
install them separately, but if you ever do:

```
npm.cmd install html5-qrcode qrcode xlsx
```

## 3. Run the app

```
npm.cmd run dev
```

Open the URL it prints (usually `http://localhost:5173`). To test the
camera scanner on your phone, use the "Network" URL it also prints
(both devices must be on the same Wi-Fi), and allow camera permission.

## 4. Login

- Login ID: `ravage`
- Password: `ravage@245`

## 5. How to use it end-to-end

1. Log in → Dashboard.
2. **IMPORT EXCEL DATA**:
   - Upload the **Main Registration Excel** first.
   - Then upload each **event Excel** (PPT, Quiz, Prompt Editing,
     BioScope, BGM Finder) one at a time, picking the correct event
     from the dropdown before choosing the file.
   - E-Sports is on the list but will show "not wired up yet" until its
     column structure is added to `src/data/excelParser.js` — see the
     note below.
3. Dashboard now shows real ticket counts and per-event scan progress.
4. Click an event card to open its scanner (real camera, rear camera
   preferred on phones). Scan a ticket's Event QR — it will show
   ALLOWED / ALREADY USED / INVALID EVENT / INVALID TICKET.
5. **DETAILS →** on the scanner opens that event's team list, and each
   team's **DETAILS →** opens full team info, including Food QR status
   if that team's ticket is the food-eligible one.
6. **FOOD QR SCANNER** (from Dashboard) accepts only Food QR codes and
   only for the ticket that's flagged food-eligible.
7. **GENERATE TICKET** lets you search any imported ticket by Ticket ID
   or Team Name, preview the full printable ticket (Event QR, and Food
   QR only if that ticket is the team's first/main event), then
   **PRINT / SAVE AS PDF** using the browser's own print dialog (choose
   "Save as PDF" as the printer).

## 6. Excel structure this app expects

### Main Registration Excel
Same columns as your real file:
`Timestamp, Team Name, College Name, Year, Phone, Alt Phone, Team Members,
PPT, Quiz G1, Quiz G2, Prompt G1, Prompt G2, BioScope G1, BioScope G2,
BGM G1, BGM G2, Main Amt, Addl Amt, Total Amt, Main UTR, Main SS, Addl UTR,
Addl SS, Pay Status, Ticket ID, M1, M1 First, M1 Second, M1 Free,
M1 Add 1, M1 Add 2, M1 Add 3, M2 ... M3 ... M4 ...`

`Ticket ID` here is the team's **registration reference**
(e.g. `RAVAGE26-0154-NS`) — used only to link a team to its event
tickets. It is never used as a scannable QR ID.

The app finds each team's **first / food-eligible event** by reading
`M1 First`, `M2 First`, `M3 First`, `M4 First` in order and using the
first one it finds filled in.

### Event Excel (PPT, Quiz, Prompt Editing, BioScope, BGM Finder)
Same full column set as the Main sheet, plus one extra column:
`TICKET` (inserted right after `Team Members`), e.g. `RAVAGE9000TE001PPT`.

Only rows where `TICKET` has a value become real tickets. This exact
value is used as the QR's `ticketId` — **the app never generates its
own ticket IDs.**

For Quiz / Prompt Editing / BioScope / BGM Finder, participant groups
come from that event's own `<Event> G1` / `<Event> G2` columns and are
kept as two separate groups (not merged) — see `groups` on each ticket
object, shown on the Team Details page.

### E-Sports Excel (not yet wired up)
You said member names will be in **separate columns** instead of one
comma-separated cell, and the file hasn't been provided yet. There's a
ready slot for it:

- `src/data/excelParser.js` → `parseEsportsExcel(file)` — currently
  throws a clear error. Once you send the real file, this function
  needs the actual column names filled in (same shape of output as
  `parseEventExcel`, just a different way of reading `participants`).
- `src/data/eventsConfig.js` → set `pending: false` on the `esports`
  entry once `parseEsportsExcel` is finished.
- `src/pages/ExcelImport.jsx` → the dropdown + upload button for
  E-Sports already exists and just needs `parseEsportsExcel` to be
  called instead of `parseEventExcel` for that one event (one small
  `if` branch).

Nothing else in the app (scanner, dashboard, ticket generator, team
details) needs to change — every event ticket, however it was parsed,
has the same shape: `{ ticketId, eventKey, eventLabel, teamName,
collegeName, phone, regId, participants, groups, isMain, foodEligible }`.

## 7. Assumptions to double-check against your real data

- `BioScope` and `BGM Finder` exact label text in the `M* First` /
  `M* Second` etc. columns wasn't visible in the sample rows you sent
  (only PPT, Quiz, Prompt labels were). If the app doesn't detect the
  food-eligible event correctly for a BioScope- or BGM-first team,
  open `src/data/eventsConfig.js` and fix the `label` value for that
  event to match the exact text your real sheet uses — that's the only
  place it needs to change.
- Quiz / Prompt / BioScope / BGM `TICKET` column is assumed to be one
  ticket per team per event (covering both G1 and G2 sub-groups
  together). If your real event files actually give G1 and G2 separate
  `TICKET` values (two physical tickets per team for that event), tell
  me and I'll adjust `parseEventExcel` to emit two ticket records
  instead of one.

## 8. Data reset

Everything is stored in the browser's localStorage under keys prefixed
`ravage_`. To wipe all imported data and start over, open the browser
console on the app and run:

```js
localStorage.clear()
```

## 9. Project structure

```
src/
  assets/
    ravage-logo.png     (white/light version — dark pages)
    ravage-black.png    (black version — light pages)
  data/
    eventsConfig.js      6 events + labels + column mapping
    excelParser.js        reads Main + Event Excel files
    store.js               localStorage read/write + cross-referencing
  components/
    Ticket.jsx            printable ticket (Event QR + optional Food QR)
  pages/
    Welcome.jsx
    Login.jsx
    Dashboard.jsx
    ExcelImport.jsx
    Scanner.jsx            generic event scanner (used for all 6 events)
    FoodScanner.jsx
    EventDetails.jsx
    TeamDetails.jsx
    TicketGenerator.jsx
  App.jsx                  state-based page navigation
  App.css                  all styling
  main.jsx
```
