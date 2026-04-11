export type CommStyle = "balanced" | "direct" | "clinical" | "supportive" | "motivational";

/** Claude system prompt tone instruction */
export function getAIToneInstruction(style: CommStyle): string {
  switch (style) {
    case "direct":
      return "Tone: concise and direct. No filler words. Short sentences. Get to the point immediately.";
    case "clinical":
      return "Tone: evidence-based and precise. Reference physiological mechanisms where relevant. Use data-driven language.";
    case "supportive":
      return "Tone: warm and empathetic. Acknowledge the user's effort and challenges. Use encouraging language.";
    case "motivational":
      return "Tone: high-energy and inspiring. Celebrate wins. Use action-oriented language. Push the user to be their best.";
    case "balanced":
    default:
      return "Tone: helpful, clear, and encouraging. Mix practical facts with motivation.";
  }
}

/** Training intensity advice line, style-aware */
export function getIntensityAdvice(pct: number, style: CommStyle): string {
  if (pct >= 95) {
    const v: Record<CommStyle, string> = {
      direct:       "Push hard today.",
      clinical:     "Optimal neuromuscular conditions. Full training stimulus recommended.",
      supportive:   "You're in great shape today — enjoy your training!",
      motivational: "Maximum capacity. Go all in!",
      balanced:     "Great conditions to push hard.",
    };
    return v[style];
  }
  if (pct >= 85) {
    const v: Record<CommStyle, string> = {
      direct:       "Slightly lighter weight. Focus on form.",
      clinical:     "Mild GLP-1 suppression. Reduce load 10–15%, maintain volume.",
      supportive:   "A slightly easier day is still a great day — focus on form.",
      motivational: "Smart training beats reckless training. Quality reps today!",
      balanced:     "Focus on form. Slightly lighter weight.",
    };
    return v[style];
  }
  if (pct >= 75) {
    const v: Record<CommStyle, string> = {
      direct:       "Quality over quantity.",
      clinical:     "Moderate suppression. Prioritize compound movements, reduce volume.",
      supportive:   "Listen to your body — quality over quantity today.",
      motivational: "Even reduced training is a win. Every rep counts!",
      balanced:     "Quality over quantity today.",
    };
    return v[style];
  }
  const v: Record<CommStyle, string> = {
    direct:       "Light work only. No heavy lifting.",
    clinical:     "Significant GLP-1 suppression. Mobility and recovery work only.",
    supportive:   "Your body needs gentleness today — light movement is still a win.",
    motivational: "Recover like a champion. You'll come back stronger!",
    balanced:     "Mobility and light work only. Your body is managing suppression.",
  };
  return v[style];
}

/** Severe appetite banner text, style-aware */
export function getSevereAppetiteAlert(style: CommStyle): { title: string; body: string } {
  switch (style) {
    case "direct":
      return {
        title: "High suppression — prioritize liquid protein.",
        body:  "Protein shakes, Greek yogurt, cottage cheese. Skip solid food if needed.",
      };
    case "clinical":
      return {
        title: "Severe GLP-1 appetite suppression detected.",
        body:  "High-density protein sources required: shakes, Greek yogurt, cottage cheese. Training intensity reduced.",
      };
    case "supportive":
      return {
        title: "Appetite is tough today — that's okay.",
        body:  "Small bites count. Try protein shakes or Greek yogurt whenever you can.",
      };
    case "motivational":
      return {
        title: "Even on hard days you protect your muscles!",
        body:  "A protein shake is a win. Greek yogurt is a win. Every gram counts.",
      };
    case "balanced":
    default:
      return {
        title: "Severe appetite suppression detected",
        body:  "Focus on high-density foods: protein shakes, Greek yogurt, cottage cheese. Training at reduced intensity today.",
      };
  }
}

/** Dashboard header message, style-aware */
export function getDynamicMsg(
  hour: number,
  pct: number,
  remaining: number,
  style: CommStyle,
): { title: string; sub: string } {
  if (pct >= 0.9) {
    const titles: Record<CommStyle, string> = {
      direct:       "Protein goal hit.",
      clinical:     "Daily protein target achieved. Muscle preservation on track.",
      supportive:   "You did it! Your muscles are protected today.",
      motivational: "GOAL CRUSHED! You're an absolute machine!",
      balanced:     "🏆 You protected your muscles today!",
    };
    return { title: titles[style], sub: "Consistent days like this prevent muscle loss on GLP-1." };
  }
  if (hour < 11) {
    const titles: Record<CommStyle, string> = {
      direct:       `Morning. ${remaining}g protein to go.`,
      clinical:     `Day initiated. ${remaining}g required to meet daily protein target.`,
      supportive:   `Good morning! Fresh start — ${remaining}g of protein to go.`,
      motivational: `Rise and grind! ${remaining}g stands between you and your goal!`,
      balanced:     "Good morning! Ready to protect your muscles?",
    };
    return { title: titles[style], sub: `${remaining}g of protein to hit today's goal.` };
  }
  if (hour < 14) {
    const titles: Record<CommStyle, string> = {
      direct:       `Midday. ${remaining}g left.`,
      clinical:     `Midday checkpoint. ${remaining}g protein remaining.`,
      supportive:   `You're doing great — just ${remaining}g more to go!`,
      motivational: `Don't let up — ${remaining}g to crush!`,
      balanced:     "Halfway through the day!",
    };
    return { title: titles[style], sub: `Still ${remaining}g to go — keep it up.` };
  }
  if (hour < 18) {
    const titles: Record<CommStyle, string> = {
      direct:       `Afternoon. ${remaining}g left.`,
      clinical:     `Afternoon window. ${remaining}g protein deficit remaining.`,
      supportive:   `The finish line is close — ${remaining}g and you're done!`,
      motivational: `Final stretch! ${remaining}g left — don't stop now!`,
      balanced:     "Final stretch!",
    };
    return { title: titles[style], sub: `${remaining}g more protein before tonight.` };
  }
  const titles: Record<CommStyle, string> = {
    direct:       `Evening. ${remaining}g left.`,
    clinical:     `Late window. ${remaining}g protein deficit to close.`,
    supportive:   `Almost there — just ${remaining}g more tonight!`,
    motivational: `Finish strong! ${remaining}g and you win the day!`,
    balanced:     "Evening push!",
  };
  return { title: titles[style], sub: `${remaining}g to go before midnight.` };
}
