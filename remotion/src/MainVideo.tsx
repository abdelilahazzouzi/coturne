import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import {
  TransitionSeries,
  springTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

// Brand palette (warm Moroccan coral, matches src/styles.css oklch tokens)
const C = {
  primary: "#E5573B",
  primaryGlow: "#F39A5B",
  bg: "#FBF7F2",
  fg: "#23150F",
  muted: "#7A6A60",
  card: "#FFFFFF",
  accent: "#FBE6D4",
  border: "#EADBCB",
};

// Scene durations
const S1 = 75;   // logo intro
const S2 = 120;  // profile reveal
const S3 = 135;  // swipe & match
const S4 = 150;  // chat
const S5 = 90;   // end card
const T = 18;    // transition overlap
export const TOTAL = S1 + S2 + S3 + S4 + S5 - T * 4;

// ============ PERSISTENT BACKGROUND ============
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 60) * 30;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 90% at ${50 + drift}% 0%, ${C.primaryGlow}33 0%, ${C.bg} 55%, ${C.bg} 100%)`,
        fontFamily,
      }}
    >
      {/* soft blobs */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: C.primary,
          opacity: 0.08,
          filter: "blur(80px)",
          left: -100 + Math.sin(frame / 80) * 60,
          top: -150 + Math.cos(frame / 90) * 40,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: C.primaryGlow,
          opacity: 0.1,
          filter: "blur(90px)",
          right: -120 + Math.cos(frame / 100) * 50,
          bottom: -180 + Math.sin(frame / 70) * 50,
        }}
      />
    </AbsoluteFill>
  );
};

// ============ HEART LOGO ============
const HeartLogo: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${C.primary}, ${C.primaryGlow})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 10px 30px ${C.primary}55`,
    }}
  >
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="white">
      <path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  </div>
);

// ============ SCENE 1 — Logo intro ============
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const txt = spring({ frame: frame - 12, fps, config: { damping: 18 } });
  const tag = spring({ frame: frame - 24, fps, config: { damping: 20 } });
  const out = interpolate(frame, [S1 - 20, S1], [1, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 32 }}>
      <div style={{ transform: `scale(${logo})`, opacity: logo }}>
        <HeartLogo size={140} />
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: -2,
          color: C.fg,
          opacity: txt * out,
          transform: `translateY(${(1 - txt) * 30}px)`,
        }}
      >
        Roomies
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 32,
          fontWeight: 600,
          color: C.muted,
          opacity: tag,
          transform: `translateY(${(1 - tag) * 20}px)`,
        }}
      >
        <span>Zéro</span>
        <span style={{ color: C.primary, fontWeight: 800 }}>samsar</span>
        <span>· Zéro commission</span>
      </div>
    </AbsoluteFill>
  );
};

// ============ PROFILE CARD ============
const ProfileCard: React.FC<{
  name: string;
  age: number;
  city: string;
  tags: string[];
  color: string;
  score?: number;
}> = ({ name, age, city, tags, color, score }) => (
  <div
    style={{
      width: 440,
      borderRadius: 32,
      background: C.card,
      boxShadow: `0 30px 80px ${C.fg}22`,
      overflow: "hidden",
      border: `1px solid ${C.border}`,
    }}
  >
    <div
      style={{
        height: 280,
        background: `linear-gradient(135deg, ${color}, ${C.primaryGlow})`,
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: C.card,
          border: `4px solid ${C.card}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 52,
          fontWeight: 800,
          color: color,
          marginBottom: -40,
        }}
      >
        {name[0]}
      </div>
      {score !== undefined && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: C.card,
            borderRadius: 999,
            padding: "8px 16px",
            fontSize: 22,
            fontWeight: 800,
            color: C.primary,
          }}
        >
          {score}% match
        </div>
      )}
    </div>
    <div style={{ padding: "56px 28px 28px" }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: C.fg }}>
        {name}, {age}
      </div>
      <div style={{ fontSize: 20, color: C.muted, marginTop: 4, fontWeight: 500 }}>
        {city}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
        {tags.map((t) => (
          <div
            key={t}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: C.accent,
              color: C.fg,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ============ SCENE 2 — Profile reveal ============
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const label = spring({ frame: frame - 10, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 120,
          fontSize: 28,
          fontWeight: 700,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: 4,
          opacity: label,
        }}
      >
        Étape 1 · Votre profil
      </div>
      <div
        style={{
          transform: `scale(${card}) translateY(${(1 - card) * 40}px)`,
          opacity: card,
        }}
      >
        <ProfileCard
          name="Sofia"
          age={24}
          city="Casablanca · Maarif"
          tags={["Non-fumeur", "Lève-tôt", "Budget 3500 MAD", "Étudiante"]}
          color={C.primary}
        />
      </div>
    </AbsoluteFill>
  );
};

// ============ SCENE 3 — Swipe & match ============
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Two cards slide in
  const left = spring({ frame, fps, config: { damping: 18 } });
  const right = spring({ frame: frame - 8, fps, config: { damping: 18 } });

  // Swipe right at frame ~40
  const swipe = interpolate(frame, [40, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const swipeX = interpolate(swipe, [0, 1], [0, 600]);
  const swipeRot = interpolate(swipe, [0, 1], [0, 20]);
  const cardOpacity = interpolate(swipe, [0.5, 1], [1, 0], { extrapolateRight: "clamp" });

  // Match burst
  const matchT = frame - 70;
  const matchScale = spring({ frame: matchT, fps, config: { damping: 10, stiffness: 120 } });
  const matchOpacity = interpolate(frame, [70, 78], [0, 1], { extrapolateRight: "clamp" });

  const burstRadius = interpolate(matchT, [0, 30], [0, 1200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 100,
          fontSize: 28,
          fontWeight: 700,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: 4,
        }}
      >
        Étape 2 · Trouvez l'affinité
      </div>

      {/* Burst circle */}
      <div
        style={{
          position: "absolute",
          width: burstRadius,
          height: burstRadius,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.primary}66 0%, transparent 70%)`,
          opacity: matchOpacity,
        }}
      />

      <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
        {/* Left card */}
        <div
          style={{
            transform: `translateX(${(1 - left) * -300}px) translateX(${swipeX}px) rotate(${swipeRot}deg)`,
            opacity: left * cardOpacity,
          }}
        >
          <ProfileCard
            name="Sofia"
            age={24}
            city="Casablanca"
            tags={["Non-fumeur", "Lève-tôt"]}
            color={C.primary}
            score={92}
          />
        </div>
        {/* Right card */}
        <div
          style={{
            transform: `translateX(${(1 - right) * 300}px)`,
            opacity: right,
          }}
        >
          <ProfileCard
            name="Yasmine"
            age={26}
            city="Casablanca"
            tags={["Non-fumeur", "Calme"]}
            color={C.primaryGlow}
            score={92}
          />
        </div>
      </div>

      {/* Match banner */}
      <div
        style={{
          position: "absolute",
          transform: `scale(${matchScale})`,
          opacity: matchOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <HeartLogo size={120} />
        <div
          style={{
            fontSize: 100,
            fontWeight: 800,
            color: C.primary,
            letterSpacing: -2,
            textShadow: `0 10px 40px ${C.primary}44`,
          }}
        >
          C'est un match !
        </div>
        <div style={{ fontSize: 32, color: C.muted, fontWeight: 600 }}>
          Sofia & Yasmine
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============ SCENE 4 — Chat ============
const Bubble: React.FC<{ text: string; me: boolean; delay: number }> = ({
  text,
  me,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 140 } });
  return (
    <div
      style={{
        alignSelf: me ? "flex-end" : "flex-start",
        maxWidth: "75%",
        padding: "14px 20px",
        borderRadius: 24,
        background: me ? C.primary : C.accent,
        color: me ? "white" : C.fg,
        fontSize: 22,
        fontWeight: 500,
        lineHeight: 1.35,
        opacity: t,
        transform: `translateY(${(1 - t) * 20}px) scale(${0.9 + t * 0.1})`,
        boxShadow: `0 4px 12px ${C.fg}11`,
      }}
    >
      {text}
    </div>
  );
};

const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phone = spring({ frame, fps, config: { damping: 16 } });
  const label = spring({ frame: frame - 5, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 90,
          fontSize: 28,
          fontWeight: 700,
          color: C.muted,
          textTransform: "uppercase",
          letterSpacing: 4,
          opacity: label,
        }}
      >
        Étape 3 · Discutez en sécurité
      </div>

      {/* Phone frame */}
      <div
        style={{
          width: 460,
          height: 820,
          borderRadius: 56,
          background: "#1a1108",
          padding: 14,
          boxShadow: `0 40px 100px ${C.fg}33`,
          transform: `scale(${phone}) translateY(${(1 - phone) * 30}px)`,
          opacity: phone,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 44,
            background: C.bg,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "24px 20px 16px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.primaryGlow}, ${C.primary})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 800,
                fontSize: 20,
              }}
            >
              Y
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20, color: C.fg }}>Yasmine</div>
              <div style={{ fontSize: 14, color: C.muted }}>En ligne</div>
            </div>
          </div>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              justifyContent: "flex-end",
            }}
          >
            <Bubble text="Salut Sofia ! J'ai vu ton profil, on a 92% d'affinité" me={false} delay={20} />
            <Bubble text="Coucou ! Oui, on cherche la même zone à Maarif." me={true} delay={50} />
            <Bubble text="J'ai visité un 2 pièces super, on se voit demain ?" me={false} delay={80} />
            <Bubble text="Avec plaisir ! 17h au café Bahia ?" me={true} delay={110} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============ SCENE 5 — End card ============
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const h1 = spring({ frame: frame - 8, fps, config: { damping: 18 } });
  const sub = spring({ frame: frame - 18, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 28 }}>
      <div style={{ transform: `scale(${logo})`, opacity: logo }}>
        <HeartLogo size={120} />
      </div>
      <div
        style={{
          fontSize: 110,
          fontWeight: 800,
          letterSpacing: -3,
          color: C.fg,
          opacity: h1,
          transform: `translateY(${(1 - h1) * 30}px)`,
          textAlign: "center",
          lineHeight: 1,
        }}
      >
        Votre coloc',{" "}
        <span
          style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryGlow})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          sans samsar
        </span>
        .
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 600,
          color: C.muted,
          opacity: sub,
          transform: `translateY(${(1 - sub) * 20}px)`,
        }}
      >
        roomies.ma
      </div>
    </AbsoluteFill>
  );
};

// ============ MAIN ============
export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily }}>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S1}>
          <Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S2}>
          <Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S3}>
          <Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S4}>
          <Scene4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={S5}>
          <Scene5 />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
