import type { Card, CardColor } from "../engine/types";
import { cardAriaLabel } from "../engine/format";

const COLOR_HEX: Record<Exclude<CardColor, never>, string> = {
  red: "#e23d2d",
  yellow: "#f0c419",
  green: "#1f9d55",
  blue: "#2b6cb0",
};

type CardViewProps = {
  card: Card;
  selected?: boolean;
  playable?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  button?: boolean;
};

export function CardView({
  card,
  selected = false,
  playable = false,
  dimmed = false,
  onClick,
  button = true,
}: CardViewProps) {
  const bg = card.color ? COLOR_HEX[card.color] : "#1b1b1f";
  const ink = card.color === "yellow" ? "#1a1303" : "#fffdf8";
  const className = [
    "card-shell",
    playable ? "card-playable" : "",
    dimmed ? "card-dim" : "",
    selected ? "ring-4 ring-amber-200" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <div className="card-face relative overflow-hidden" style={{ background: bg, color: ink }}>
      <Corner mark={faceMark(card)} />
      <div className="absolute inset-[18%] rounded-[45%] bg-white/92 flex items-center justify-center text-[#1b1b1f] shadow-inner">
        <CenterMark card={card} />
      </div>
      <Corner mark={faceMark(card)} flipped />
    </div>
  );

  if (!button) {
    return (
      <div className={className} aria-hidden="true">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={cardAriaLabel(card)}
      aria-pressed={selected}
    >
      {inner}
    </button>
  );
}

export function CardBack({ label = "Face-down card" }: { label?: string }) {
  return (
    <div className="card-shell" aria-hidden="true">
      <div
        className="card-back flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, #3b3b48, #16161c 62%)",
        }}
        title={label}
      >
        <div className="w-[72%] h-[72%] rounded-[0.8rem] border-2 border-amber-200/80 flex items-center justify-center">
          <span className="text-amber-100 font-black tracking-[0.2em] text-sm">K</span>
        </div>
      </div>
    </div>
  );
}

function Corner({ mark, flipped = false }: { mark: string; flipped?: boolean }) {
  return (
    <span
      className={`absolute text-[0.72rem] font-black leading-none ${
        flipped ? "right-1.5 bottom-1.5 rotate-180" : "left-1.5 top-1.5"
      }`}
    >
      {mark}
    </span>
  );
}

function CenterMark({ card }: { card: Card }) {
  if (card.type === "wild" || card.type === "wildDraw4") {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <FourDiamonds />
        <span className="text-[0.7rem] font-black tracking-wide">
          {card.type === "wild" ? "WILD" : "+4"}
        </span>
      </div>
    );
  }
  if (card.type === "skip") return <SkipIcon />;
  if (card.type === "reverse") return <ReverseIcon />;
  if (card.type === "draw2") {
    return <span className="text-2xl font-black">+2</span>;
  }
  return <span className="text-3xl font-black">{card.number}</span>;
}

function faceMark(card: Card): string {
  if (card.type === "number") return String(card.number);
  if (card.type === "skip") return "Ø";
  if (card.type === "reverse") return "⇄";
  if (card.type === "draw2") return "+2";
  if (card.type === "wild") return "W";
  return "+4";
}

function FourDiamonds() {
  const colors: CardColor[] = ["red", "yellow", "green", "blue"];
  return (
    <div className="grid grid-cols-2 gap-0.5 rotate-12">
      {colors.map((color) => (
        <span
          key={color}
          className="w-3.5 h-3.5 rounded-sm"
          style={{ background: COLOR_HEX[color] }}
        />
      ))}
    </div>
  );
}

function SkipIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-10 h-10" aria-hidden="true">
      <circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="7" />
      <path d="M18 46 L46 18" stroke="currentColor" strokeWidth="7" />
    </svg>
  );
}

function ReverseIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-10 h-10" aria-hidden="true">
      <path
        d="M18 28c0-8 8-14 16-14h8l-6-8 16 12-16 12 6-8h-8c-4 0-8 3-8 6z"
        fill="currentColor"
      />
      <path
        d="M46 36c0 8-8 14-16 14h-8l6 8L12 46l16-12-6 8h8c4 0 8-3 8-6z"
        fill="currentColor"
      />
    </svg>
  );
}
