/* Daily Fleece Quiz App — orchestrator */
const { useState: useS, useEffect: useE } = React;

const LS = "df_quiz_demo_v1";

function App() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
  const [screen, setScreen] = useS(saved.screen || "home");
  const [played, setPlayed] = useS(!!saved.played);
  const [earned, setEarned] = useS(saved.earned || 0);

  useE(() => {
    const persist = ["home", "board", "you"].includes(screen) ? screen : "home";
    localStorage.setItem(LS, JSON.stringify({ screen: persist, played, earned }));
  }, [screen, played, earned]);

  const nav = (id) => setScreen(id);

  let view;
  if (screen === "quiz") {
    view = <QuizFlow onComplete={(e) => { setEarned(e); setPlayed(true); setScreen("results"); }} onQuit={() => setScreen("home")} />;
  } else if (screen === "results") {
    view = <ResultsScreen earned={earned} onBoard={() => setScreen("board")} onHome={() => setScreen("home")} />;
  } else if (screen === "board") {
    view = <LeaderboardScreen onNav={nav} />;
  } else if (screen === "you") {
    view = <ProfileScreen onNav={nav} />;
  } else {
    view = <HomeScreen onPlay={() => setScreen("quiz")} onNav={nav} played={played} />;
  }

  return (
    <div data-screen-label={screen}>
      <AndroidDevice width={400} height={840}>{view}</AndroidDevice>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
