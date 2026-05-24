# Daily Fleece – Domain Glossary

## Roles

**Host**
The player who initiates a Session by clicking "Start Quiz." Controls the quiz flow — opens voting, closes voting, and reveals correct answers — while also participating as a Player. The Host role belongs to exactly one person per Session.

**Player**
Any participant in a Session, including the Host. Players submit answers to both Questions and accumulate points on the Leaderboard. A Player joins via the Lobby before a Session starts.

---

## Session Lifecycle

**Session**
A single daily quiz instance. Consists of exactly two Questions: Q1 (knowledge) followed by Q2 (geography). A Session progresses through three phases: Lobby → Active → Ended.

**Lobby**
The waiting phase before a Session starts. Players join here and see who else is present. The Session is not yet locked; new Players can still enter. The Host sees a "Start Quiz" button, which becomes available only after both Photos have been uploaded.

**Active Phase**
The phase during which Questions are presented and answered. The Session is locked — no new Players can join.

**Ended Phase**
The phase after both Questions have been scored. Players see the Session Results followed by the Leaderboard.

---

## Questions

**Q1 – Knowledge Question**
The first Question of every Session. Sourced from a printed daily knowledge calendar. Presented to all Players as a Photo of that calendar page (which contains the question text, category, and answer options A, B, C). Players respond by selecting A, B, or C.

**Q2 – Geography Question**
The second Question of every Session. Presented to all Players as a Photo of a location somewhere in the world. Players respond by selecting a country on a map.

**Photo**
An image uploaded by the Host before a Session starts. Each Session requires exactly two Photos: one for Q1 and one for Q2. A Session cannot start without both Photos uploaded.

---

## Voting

**Voting**
The period during which a Question is active and Players can submit or change their answer. Voting is opened and closed manually by the Host. During Voting, individual answers are hidden from all participants. The Host sees only a count of how many Players have answered (e.g. "4/6 answered").

**Answer**
A Player's response to a Question. For Q1: one of A, B, or C. For Q2: a country selected on a map. A Player may change their Answer while Voting is open. If Voting closes before a Player answers, they receive 0 points for that Question.

---

## Scoring

**Correct Answer**
The right response to a Question, as determined by the Host after Voting closes. The Host selects the Correct Answer from the available options (A/B/C for Q1; a country for Q2). Points are awarded automatically once the Correct Answer is set.

**Points**
1 point is awarded per Question for a correct Answer. Maximum 2 points per Session. Players who do not answer before Voting closes receive 0 points.

---

## Leaderboard

**Project**
The organisational scope that groups Sessions and their Leaderboard. Every Session and every Leaderboard entry belongs to exactly one Project. Currently one global Project exists (management of Projects is deferred). The Project concept is present in the data model from the start to allow multiple teams to use the app without a schema migration.

**Leaderboard**
A ranked list of all Players in a Project, ordered by total Points descending. Each row shows: rank (#1, #2, …), display name, sessions participated in, and total Points. Players with zero Points are included. The viewing Player's own row is highlighted. Accessible at any time.

**Session Results**
A summary displayed at the end of a Session. Shows a table of all participants with three columns: name, Q1 result (correct/incorrect), Q2 result (correct/incorrect). Followed by the Leaderboard.
