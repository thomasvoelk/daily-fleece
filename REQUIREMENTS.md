# Daily Fleece – Requirements

## Overview

Daily Fleece is a mobile-first browser application that supports a fun daily quiz at the end of team standups. Each session consists of two questions — one knowledge question and one geography question — presented as photos. Players answer on their own devices. A running leaderboard tracks scores across the project engagement.

---

## Actors

| Actor | Description |
|-------|-------------|
| **Host** | The player who starts the session. Controls quiz flow and also answers as a player. |
| **Player** | Any participant in a session, including the Host. |

---

## Use Cases

### UC-01: Upload Photos

**Actor:** Host  
**Precondition:** Host has opened the app and is preparing a new Session.  
**Goal:** Upload the two Photos required to start a Session.

**Main Flow:**
1. Host opens the pre-session setup screen.
2. Host uploads a Photo for Q1 (image of the knowledge calendar page).
3. Host uploads a Photo for Q2 (image of the geography location).
4. Both Photos are confirmed as uploaded.
5. The "Start Quiz" button becomes available.

**Rules:**
- Both Photos must be uploaded before a Session can start.
- Photos can be replaced before the Session starts.

---

### UC-02: Join Lobby

**Actor:** Player  
**Precondition:** A Session has been prepared (Photos uploaded) but not yet started.  
**Goal:** Player enters the Lobby and waits for the quiz to begin.

**Main Flow:**
1. Player opens the app and authenticates (method TBD; likely company SSO).
2. Player sees the Lobby screen with a list of Players who have joined.
3. Player waits for the Host to start the Session.

**Rules:**
- Players can only join during the Lobby phase. Once the Session is Active, joining is not possible.
- A Player who attempts to join an Active Session sees a "session in progress" message.

---

### UC-03: Start Session

**Actor:** Host  
**Precondition:** Host is in the Lobby. Both Photos are uploaded. At least one Player is in the Lobby.  
**Goal:** Start the quiz, transitioning from Lobby to Active phase.

**Main Flow:**
1. Host sees the Lobby screen with a list of joined Players and a "Start Quiz" button.
2. Host taps "Start Quiz."
3. Session transitions to Active phase.
4. Q1 is presented to all Players.

**Rules:**
- The "Start Quiz" button is disabled until both Photos have been uploaded.
- The Player who taps "Start Quiz" becomes the Host for that Session.
- The Session is locked after starting; no new Players can join.

---

### UC-04: Answer Knowledge Question (Q1)

**Actor:** Player (including Host)  
**Precondition:** Session is Active. Q1 Voting is open.  
**Goal:** Player submits their answer to Q1.

**Main Flow:**
1. Player sees the Q1 Photo and three answer buttons (A, B, C).
2. Player taps an answer button.
3. The app confirms the answer is recorded.
4. Player can change their answer by tapping a different button.

**Host view (additional):**
- Host sees the same screen as Players, plus a count of how many Players have answered (e.g. "4/6 answered").
- Host sees a "Close Voting" button.

**Rules:**
- Individual answers are hidden from all participants during Voting.
- A Player may change their answer any number of times while Voting is open.
- If Voting closes before a Player answers, they receive 0 points for Q1.

---

### UC-05: Close Q1 Voting and Reveal Answer

**Actor:** Host  
**Precondition:** Q1 Voting is open.  
**Goal:** Stop accepting answers and record the correct answer for Q1.

**Main Flow:**
1. Host monitors the answer count ("X/N answered").
2. Host taps "Close Voting."
3. Voting closes; no further answers are accepted.
4. All Players' answers are revealed.
5. Host selects the Correct Answer (A, B, or C).
6. The app awards 1 point to each Player who answered correctly.
7. Q2 is presented to all Players.

---

### UC-06: Answer Geography Question (Q2)

**Actor:** Player (including Host)  
**Precondition:** Session is Active. Q2 Voting is open.  
**Goal:** Player submits their country answer for Q2.

**Main Flow:**
1. Player sees the Q2 Photo and a world map.
2. Player selects a country on the map.
3. The app confirms the answer is recorded.
4. Player can change their selection while Voting is open.

**Host view (additional):**
- Same as UC-04: answer count and "Close Voting" button visible.

**Rules:**
- Same rules as UC-04 apply.

---

### UC-07: Close Q2 Voting and Reveal Answer

**Actor:** Host  
**Precondition:** Q2 Voting is open.  
**Goal:** Stop accepting answers and record the correct country for Q2.

**Main Flow:**
1. Host taps "Close Voting."
2. All Players' country selections are revealed.
3. Host selects the Correct Answer (a country).
4. The app awards 1 point to each Player who answered correctly.
5. Session transitions to Ended phase.
6. Session Results screen is shown to all Players.

---

### UC-08: View Session Results

**Actor:** Player (including Host)  
**Precondition:** Session has ended.  
**Goal:** See how each player performed in this session.

**Main Flow:**
1. All Players see a Session Results screen showing each Player's points (0, 1, or 2) for this session.
2. The screen transitions to the Leaderboard.

---

### UC-09: View Leaderboard

**Actor:** Player (including Host)  
**Precondition:** None (Leaderboard is accessible at any time).  
**Goal:** See the cumulative standings for the current project.

**Main Flow:**
1. Player opens the app (or the Session ends and transitions automatically).
2. Player sees the Leaderboard: a ranked list of all Players with their cumulative points.

---

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | The app must be mobile-first. All interactions must be usable on a smartphone browser. |
| FR-02 | Authentication method is TBD. Likely company SSO. |
| FR-03 | A Session requires exactly two Photos to be uploaded before it can start. |
| FR-04 | The first Player to tap "Start Quiz" becomes the Host for that Session. |
| FR-05 | A Session is locked once started; no new Players can join. |
| FR-06 | Players who attempt to join an active Session see a "session in progress" message. |
| FR-07 | Q1 is presented first, Q2 second. Order is fixed. |
| FR-08 | During Voting, individual answers are hidden from all participants. |
| FR-09 | The Host sees a real-time count of how many Players have answered during Voting. |
| FR-10 | Players may change their answer any number of times while Voting is open. |
| FR-11 | Voting is closed manually by the Host. |
| FR-12 | After Voting closes, the Host selects the Correct Answer. |
| FR-13 | 1 point is awarded per Question for a correct answer. Maximum 2 points per Session. |
| FR-14 | Players who do not answer before Voting closes receive 0 points for that Question. |
| FR-15 | The Host sees the same screen as Players, with additional control buttons (Close Voting, Correct Answer selection). |
| FR-16 | A Session ends after Q2 answers are scored and shows Session Results followed by the Leaderboard. |
| FR-17 | The Leaderboard is accessible at any time, not only at the end of a Session. |
| FR-18 | The Leaderboard shows cumulative points for all Players in the current project. |
| FR-19 | One global project exists for now. Project management is deferred. |
| FR-20 | Q2 answer input is a world map on which the Player selects a country. |

---

## Out of Scope (Deferred)

- Project / season management (creating, naming, archiving projects; leaderboard reset)
- Authentication implementation details
- Timer-based auto-close of Voting
- Late-join / mid-session participation
- Country selector implementation (map library choice)
