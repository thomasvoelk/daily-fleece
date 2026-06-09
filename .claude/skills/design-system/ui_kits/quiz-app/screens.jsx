/* Daily Fleece Quiz App — screens & flow */
const { useState, useEffect, useRef } = React;

/* ---------------- data ---------------- */
const PLAYERS = [
  { name: "Priya",     initial: "P", tone: "marigold", pts: 2480, streak: 7 },
  { name: "Marco",     initial: "M", tone: "grape",    pts: 2210, streak: 3 },
  { name: "Sam (you)", initial: "S", tone: "teal",     pts: 1990, streak: 5, you: true },
  { name: "Jess",      initial: "J", tone: "coral",    pts: 1840, streak: 1 },
  { name: "Diego",     initial: "D", tone: "grape",    pts: 1620, streak: 2 },
  { name: "Aiko",      initial: "A", tone: "teal",     pts: 1500, streak: 4 },
  { name: "Lena",      initial: "L", tone: "marigold", pts: 1350, streak: 0 },
];

const QUESTIONS = [
  { cat: "knowledge", q: "What's the largest mammal on Earth?",
    options: ["African elephant", "Blue whale", "Giraffe", "Hippopotamus"], correct: 1, points: 90 },
  { cat: "geography", q: "Which is the longest river in the world?",
    options: ["The Amazon", "The Yangtze", "The Nile", "The Mississippi"], correct: 2, points: 90 },
];

/* ---------------- chrome ---------------- */
function TopBar({ right, frost }) {
  return (
    <div className={"qa-topbar" + (frost ? " frost" : "")}>
      <div className="qa-brand">
        <Mark size={34} />
        <div className="wd"><span className="d">DAILY</span><span className="f">Fleece</span></div>
      </div>
      <div className="qa-spacer" />
      {right}
    </div>
  );
}

function BottomNav({ active, onNav }) {
  const items = [
    { id: "home", icon: "cottage", label: "Today" },
    { id: "board", icon: "leaderboard", label: "Board" },
    { id: "you", icon: "person", label: "You" },
  ];
  return (
    <div className="qa-bottomnav">
      {items.map(it => (
        <button key={it.id} className={"qa-navitem" + (active === it.id ? " active" : "")} onClick={() => onNav(it.id)}>
          <span className="pill"><Icon name={it.icon} filled={active === it.id} size={22} /></span>
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- home ---------------- */
function HomeScreen({ onPlay, onNav, played }) {
  const sorted = [...PLAYERS].sort((a, b) => b.pts - a.pts);
  const you = sorted.find(p => p.you);
  const yourRank = sorted.indexOf(you) + 1;
  return (
    <div className="qa-root">
      <TopBar right={<span className="qa-streak"><Icon name="local_fire_department" size={15} />x5</span>} />
      <div className="qa-scroll" style={{ padding: "4px 16px 20px" }}>
        <div style={{ margin: "6px 2px 16px" }}>
          <div className="t-small" style={{ color: "var(--plum-faint)" }}>Tuesday · standup time ☕</div>
          <div className="t-h1" style={{ marginTop: 2 }}>Morning, Sam!</div>
        </div>

        {/* hero */}
        <div className="pop" style={{ background: "var(--grape)", borderRadius: "var(--r-xl)", padding: 20, position: "relative", overflow: "hidden", boxShadow: "var(--shadow-2)" }}>
          <div style={{ position: "absolute", right: -14, top: -10, opacity: .25, fontFamily: "var(--font-pixel)", fontSize: 9, color: "#fff" }}>2 Qs</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Mark size={66} radius={18} />
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "#fff", lineHeight: 1.1 }}>Today's quiz<br />is ready</div>
              <div style={{ color: "#E4D6FC", fontWeight: 700, fontSize: 13, marginTop: 6, display: "flex", gap: 8 }}>
                <span><Icon name="psychology" size={14} style={{ verticalAlign: -2 }} /> Knowledge</span>
                <span><Icon name="public" size={14} style={{ verticalAlign: -2 }} /> Geography</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            {played
              ? <ChunkBtn color="lightghost" full size="lg" icon="check_circle" disabled>All done today!</ChunkBtn>
              : <ChunkBtn color="marigold" full size="lg" icon="play_arrow" onClick={onPlay}>Play today</ChunkBtn>}
          </div>
        </div>

        {/* your standing */}
        <div className="card rise" style={{ marginTop: 16, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "center" }}>
            <div className="t-caption">Your rank</div>
            <div style={{ fontFamily: "var(--font-pixel)", fontSize: 22, color: "var(--grape-700)", marginTop: 4 }}>#{yourRank}</div>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: "var(--wool-line)" }} />
          <div style={{ flex: 1 }}>
            <div className="t-body-strong">{you.pts.toLocaleString()} pts</div>
            <div className="t-small" style={{ color: "var(--plum-faint)" }}>x5 day streak · keep it warm 🔥</div>
          </div>
        </div>

        {/* leaderboard peek */}
        <div style={{ display: "flex", alignItems: "center", margin: "22px 2px 10px" }}>
          <div className="t-h3">Top of the flock</div>
          <div className="qa-spacer" />
          <button onClick={() => onNav("board")} style={{ border: "none", background: "transparent", color: "var(--grape-700)", fontWeight: 800, fontSize: 13, fontFamily: "var(--font-body)", cursor: "pointer" }}>See all</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {sorted.slice(0, 3).map((p, i) => <LRow key={p.name} p={p} rank={i + 1} />)}
        </div>
      </div>
      <BottomNav active="home" onNav={onNav} />
    </div>
  );
}

/* ---------------- leaderboard row ---------------- */
function LRow({ p, rank }) {
  const cls = ["lrow"];
  if (rank === 1) cls.push("lrow--gold");
  if (p.you) cls.push("lrow--you");
  return (
    <div className={cls.join(" ")}>
      <span className="rk">{rank}</span>
      <Avatar initial={p.initial} tone={p.tone} />
      <div>
        <div className="nm">{p.name}{rank === 1 && <Icon name="crown" size={16} color="var(--marigold)" />}</div>
        <div className="sub">{p.streak > 0 ? `x${p.streak} streak` : "no streak yet"}</div>
      </div>
      <span className="pts">{p.pts.toLocaleString()}</span>
    </div>
  );
}

/* ---------------- quiz flow ---------------- */
function QuizFlow({ onComplete, onQuit }) {
  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState("answering"); // answering | revealed
  const [selected, setSelected] = useState(null);
  const [seconds, setSeconds] = useState(10);
  const [earned, setEarned] = useState(0);
  const q = QUESTIONS[qIndex];

  useEffect(() => {
    if (phase !== "answering") return;
    if (seconds <= 0) { reveal(null); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, phase]);

  function reveal(choice) {
    setSelected(choice);
    setPhase("revealed");
    if (choice === q.correct) {
      const bonus = Math.round(q.points + seconds * 3);
      setEarned(e => e + bonus);
    }
  }
  function next() {
    if (qIndex + 1 < QUESTIONS.length) {
      setQIndex(i => i + 1); setPhase("answering"); setSelected(null); setSeconds(10);
    } else {
      onComplete(earned);
    }
  }

  const gotIt = phase === "revealed" && selected === q.correct;
  const lastBonus = gotIt ? Math.round(q.points + seconds * 3) : 0;

  return (
    <div className="qa-root">
      <div className="qa-topbar">
        <button className="qa-iconbtn" onClick={onQuit}><Icon name="close" size={24} /></button>
        <div className="qa-spacer" />
        <Dots total={QUESTIONS.length} index={qIndex} doneList={Array.from({ length: qIndex }, (_, i) => i)} />
        <div className="qa-spacer" />
        <Timer seconds={phase === "answering" ? seconds : (gotIt ? seconds : 0)} />
      </div>

      <div className="qa-scroll" style={{ padding: "8px 18px 20px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <CategoryChip kind={q.cat} />
          <span style={{ fontFamily: "var(--font-pixel)", fontSize: 8, color: "var(--plum-faint)" }}>Q{qIndex + 1}/{QUESTIONS.length}</span>
        </div>

        <div className="t-h1" style={{ fontSize: 27, margin: "20px 2px 24px", textWrap: "pretty" }}>{q.q}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }} key={qIndex}>
          {q.options.map((opt, i) => {
            const cls = ["ans", "rise"];
            if (phase === "answering") { if (selected === i) cls.push("ans--selected"); }
            else {
              if (i === q.correct) cls.push("ans--correct");
              else if (i === selected) cls.push("ans--wrong");
              else cls.push("ans--dim");
            }
            return (
              <button key={i} className={cls.join(" ")} style={{ animationDelay: (i * 50) + "ms" }}
                disabled={phase === "revealed"} onClick={() => reveal(i)}>
                <span className="key">{"ABCD"[i]}</span>
                {opt}
                <span className="end">
                  {phase === "revealed" && i === q.correct && <Icon name="check_circle" size={24} />}
                  {phase === "revealed" && i === selected && i !== q.correct && <Icon name="cancel" size={24} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {phase === "revealed" && (
        <div style={{ padding: 16, background: "var(--paper)", borderTop: "1px solid var(--wool-line)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="t-body-strong" style={{ color: gotIt ? "var(--green-700)" : "var(--coral-700)" }}>
              {gotIt ? "Nailed it! 🦙" : (selected === null ? "Time's up!" : "Not quite!")}
            </div>
            <div className="t-small" style={{ color: "var(--plum-faint)" }}>
              {gotIt ? `+${lastBonus} pts · speed bonus` : "Answer: " + q.options[q.correct]}
            </div>
          </div>
          <ChunkBtn color={gotIt ? "green" : "grape"} icon="arrow_forward" onClick={next}>
            {qIndex + 1 < QUESTIONS.length ? "Next" : "Finish"}
          </ChunkBtn>
        </div>
      )}
    </div>
  );
}

/* ---------------- results (arcade) ---------------- */
function ResultsScreen({ earned, onBoard, onHome }) {
  const confetti = useRef(Array.from({ length: 26 }, (_, i) => {
    const cols = ["#FFB422", "#14B8A6", "#FF5A5F", "#34C759", "#FFFBF4"];
    return { left: Math.random() * 100, top: Math.random() * 56, s: 6 + Math.random() * 8, c: cols[i % cols.length], r: Math.random() * 60 };
  })).current;
  return (
    <div className="arcade">
      {confetti.map((c, i) => (
        <div key={i} className="confetti" style={{ left: c.left + "%", top: c.top + "%", width: c.s, height: c.s, background: c.c, transform: `rotate(${c.r}deg)` }} />
      ))}
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
        <div className="pop"><Mark size={104} radius={28} /></div>
        <div className="ttl pop" style={{ marginTop: 22 }}>Nice flockin'<br />work!</div>
        <div className="sub" style={{ marginTop: 6 }}>You answered both. Same time tomorrow?</div>

        <div className="rise" style={{ marginTop: 26, display: "flex", gap: 26 }}>
          <div>
            <div style={{ fontFamily: "var(--font-pixel)", fontSize: 7, color: "#8A7FA6" }}>EARNED</div>
            <div className="big-score" style={{ fontSize: 38 }}>+{earned}</div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-pixel)", fontSize: 7, color: "#8A7FA6" }}>STREAK</div>
            <div className="big-score" style={{ fontSize: 38, color: "#FF8A4D" }}>x6</div>
          </div>
        </div>

        <div className="rise" style={{ marginTop: 22, background: "rgba(255,255,255,.1)", borderRadius: 999, padding: "10px 18px", fontFamily: "var(--font-display)", fontWeight: 600, color: "#fff" }}>
          You climbed to <span style={{ color: "var(--marigold)" }}>#2</span> today 👑
        </div>

        <div style={{ position: "absolute", left: 24, right: 24, bottom: 28, display: "flex", flexDirection: "column", gap: 11 }}>
          <ChunkBtn color="marigold" full size="lg" icon="leaderboard" onClick={onBoard}>See leaderboard</ChunkBtn>
          <ChunkBtn color="lightghost" full icon="ios_share" onClick={onHome}>Share to team</ChunkBtn>
        </div>
      </div>
    </div>
  );
}

/* ---------------- leaderboard ---------------- */
function LeaderboardScreen({ onNav }) {
  const [scope, setScope] = useState("today");
  const sorted = [...PLAYERS].sort((a, b) => b.pts - a.pts);
  return (
    <div className="qa-root">
      <TopBar right={<button className="qa-iconbtn"><Icon name="ios_share" filled={false} /></button>} />
      <div className="qa-scroll" style={{ padding: "2px 16px 20px" }}>
        <div className="t-h1" style={{ margin: "4px 2px 14px" }}>Leaderboard</div>
        <div className="seg" style={{ marginBottom: 16 }}>
          <button className={scope === "today" ? "on" : ""} onClick={() => setScope("today")}>Today</button>
          <button className={scope === "week" ? "on" : ""} onClick={() => setScope("week")}>This week</button>
          <button className={scope === "all" ? "on" : ""} onClick={() => setScope("all")}>All time</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {sorted.map((p, i) => <LRow key={p.name} p={p} rank={i + 1} />)}
        </div>
      </div>
      <BottomNav active="board" onNav={onNav} />
    </div>
  );
}

/* ---------------- profile ---------------- */
function ProfileScreen({ onNav }) {
  const [ping, setPing] = useState(true);
  const stats = [
    { icon: "stars", label: "Total points", value: "1,990", tone: "marigold" },
    { icon: "local_fire_department", label: "Best streak", value: "12 days", tone: "coral" },
    { icon: "event_available", label: "Days played", value: "38", tone: "teal" },
    { icon: "target", label: "Accuracy", value: "81%", tone: "grape" },
  ];
  return (
    <div className="qa-root">
      <TopBar right={<button className="qa-iconbtn"><Icon name="settings" filled={false} /></button>} />
      <div className="qa-scroll" style={{ padding: "2px 16px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "10px 0 22px" }}>
          <Avatar initial="S" tone="teal" size={84} />
          <div className="t-h1" style={{ marginTop: 12 }}>Sam Okafor</div>
          <div className="t-small" style={{ color: "var(--plum-faint)" }}>Team FLEECE · joined Mar 2026</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          {stats.map(s => (
            <div key={s.label} className="card" style={{ padding: 15 }}>
              <Icon name={s.icon} size={22} color={`var(--${s.tone}-700)`} />
              <div style={{ fontFamily: "var(--font-pixel)", fontSize: 16, color: "var(--plum)", margin: "10px 0 4px" }}>{s.value}</div>
              <div className="t-small" style={{ color: "var(--plum-faint)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 16, overflow: "hidden" }}>
          <div className="qa-settingrow" style={{ display: "flex", alignItems: "center", gap: 12, padding: 15 }}>
            <Icon name="notifications" size={22} color="var(--plum-soft)" />
            <div style={{ flex: 1 }}><div className="t-body-strong">Daily standup ping</div><div className="t-small" style={{ color: "var(--plum-faint)" }}>9:30 AM reminder</div></div>
            <button onClick={() => setPing(p => !p)} style={{ border: "none", cursor: "pointer", padding: 0, width: 52, height: 30, borderRadius: 999, background: ping ? "var(--grape)" : "var(--wool-line)", position: "relative", transition: "background .2s" }}>
              <span style={{ position: "absolute", top: 3, left: ping ? 25 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", boxShadow: "var(--shadow-1)", transition: "left .2s var(--ease-bounce)" }} />
            </button>
          </div>
          <div style={{ height: 1, background: "var(--wool-line)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 15 }}>
            <Icon name="tag" size={22} color="var(--plum-soft)" />
            <div style={{ flex: 1 }}><div className="t-body-strong">Team code</div><div className="t-small" style={{ color: "var(--plum-faint)" }}>FLEECE</div></div>
            <Icon name="chevron_right" size={22} color="var(--plum-faint)" />
          </div>
        </div>
      </div>
      <BottomNav active="you" onNav={onNav} />
    </div>
  );
}

Object.assign(window, { PLAYERS, QUESTIONS, TopBar, BottomNav, HomeScreen, LRow, QuizFlow, ResultsScreen, LeaderboardScreen, ProfileScreen });
