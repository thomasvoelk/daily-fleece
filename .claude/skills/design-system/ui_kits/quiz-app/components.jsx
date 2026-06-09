/* Daily Fleece Quiz App — shared small components */

function Icon({ name, filled = true, size = 24, color, style }) {
  return (
    <span className={"ms" + (filled ? "" : " o")}
      style={{ fontSize: size, color, ...style }}>{name}</span>
  );
}

/* Inline SVG alpaca mark — works without any file path resolution */
function Mark({ size = 34, radius = 9 }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ borderRadius: radius, display: 'block', flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="mr"><rect width="200" height="200" rx="44"/></clipPath></defs>
      <g clipPath="url(#mr)">
        <rect width="200" height="200" fill="#7C3AF0"/>
        <circle cx="28" cy="34" r="5" fill="#FFB422"/><circle cx="170" cy="28" r="6" fill="#14B8A6"/>
        <circle cx="176" cy="150" r="5" fill="#FF5A5F"/><circle cx="24" cy="158" r="6" fill="#34C759"/>
        <rect x="82" y="150" width="36" height="40" rx="14" fill="#FFF3E0"/>
        <path d="M72 64 Q60 22 84 42 L88 70 Z" fill="#FFFBF4"/><path d="M128 64 Q140 22 116 42 L112 70 Z" fill="#FFFBF4"/>
        <path d="M76 58 Q70 36 82 48 L84 64 Z" fill="#E4D6FC"/><path d="M124 58 Q130 36 118 48 L116 64 Z" fill="#E4D6FC"/>
        <rect x="62" y="56" width="76" height="86" rx="34" fill="#FFFBF4"/>
        <circle cx="84" cy="62" r="15" fill="#FFFBF4"/><circle cx="100" cy="56" r="16" fill="#FFFBF4"/><circle cx="116" cy="62" r="15" fill="#FFFBF4"/>
        <rect x="78" y="104" width="44" height="40" rx="20" fill="#FFE9BE"/>
        <circle cx="84" cy="96" r="7" fill="#241B3A"/><circle cx="116" cy="96" r="7" fill="#241B3A"/>
        <circle cx="86" cy="94" r="2.4" fill="#FFFBF4"/><circle cx="118" cy="94" r="2.4" fill="#FFFBF4"/>
        <circle cx="92" cy="118" r="3" fill="#241B3A"/><circle cx="108" cy="118" r="3" fill="#241B3A"/>
        <path d="M92 128 Q100 134 108 128" stroke="#241B3A" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <circle cx="72" cy="114" r="6" fill="#FF5A5F" opacity=".35"/><circle cx="128" cy="114" r="6" fill="#FF5A5F" opacity=".35"/>
      </g>
    </svg>
  );
}

function ChunkBtn({ color = "grape", size, full, children, onClick, disabled, icon, style }) {
  const cls = ["chunk", "chunk--" + color];
  if (full) cls.push("full");
  if (size === "lg") cls.push("lg");
  return (
    <button className={cls.join(" ")} onClick={onClick} disabled={disabled} style={style}>
      {icon && <Icon name={icon} size={20} />}
      {children}
    </button>
  );
}

function CategoryChip({ kind }) {
  const map = {
    knowledge: { icon: "psychology", label: "Knowledge" },
    geography: { icon: "public", label: "Geography" },
  };
  const c = map[kind];
  return (
    <span className={"chip chip--" + kind}><Icon name={c.icon} size={17} />{c.label}</span>
  );
}

function PointsChip({ children }) {
  return <span className="chip chip--points"><Icon name="stars" size={17} />{children}</span>;
}

function Dots({ total, index, doneList = [] }) {
  return (
    <div className="dots">
      {Array.from({ length: total }).map((_, i) => (
        <i key={i} className={doneList.includes(i) ? "done" : (i === index ? "on" : "")} />
      ))}
    </div>
  );
}

function Avatar({ initial, tone = "grape", size = 40 }) {
  const tones = {
    grape:    ["var(--grape-200)", "var(--grape-700)"],
    teal:     ["var(--teal-200)", "var(--teal-700)"],
    marigold: ["var(--marigold-200)", "var(--marigold-700)"],
    coral:    ["var(--coral-200)", "var(--coral-700)"],
  };
  const [bg, fg] = tones[tone] || tones.grape;
  return (
    <div className="av" style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.4 }}>{initial}</div>
  );
}

function Timer({ seconds }) {
  const warn = seconds <= 4;
  const txt = "0:" + String(Math.max(0, seconds)).padStart(2, "0");
  return (
    <span className={"timer" + (warn ? " warn" : "")}><Icon name="timer" size={16} filled={false} />{txt}</span>
  );
}

Object.assign(window, { Icon, Mark, ChunkBtn, CategoryChip, PointsChip, Dots, Avatar, Timer });
