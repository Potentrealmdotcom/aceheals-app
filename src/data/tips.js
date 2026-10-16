// Daily tips for parents — practical and non-medical. One per day, rotates by date.
export const DAILY_TIPS = [
  "Show, don't just tell: a picture of \"what's next\" lowers stress faster than words.",
  "Give a 2-minute heads-up before every transition. A visual timer makes it easier.",
  "Offer two choices instead of an open question. \"Red cup or blue cup?\"",
  "Celebrate tiny wins out loud. Effort counts as much as the result.",
  "Keep a \"calm kit\" in your bag: headphones, a chewy, a small fidget, a favorite song.",
  "When things get loud, get quiet. Lower your voice and slow your breathing first.",
  "Pair every new food with one safe food on the plate. No pressure to eat it.",
  "Play the same song at the same time each day. Rhythm builds routine.",
  "Name the feeling with them: \"You look frustrated. I'm here.\"",
  "Rest counts. A tired parent can't pour from an empty cup. Take five minutes today.",
  "Practice big events at home first: pretend doctor, pretend haircut, pretend restaurant.",
  "Use first/then language: \"First shoes, then park.\"",
  "Keep a simple log of what helped. Patterns show up in a week or two.",
  "Dim the lights and turn off background noise before bedtime routines.",
  "Let them lead play for 10 minutes. Follow, copy, and cheer them on.",
  "Pick one thing to simplify today. You do not have to do it all.",
  "Reward the try, not just the correct answer. \"I love how you kept going!\"",
  "A heavy-work break (carrying books, wall push-ups) can help before hard tasks.",
  "Say the plan the same way every time. Predictable words feel safe.",
  "Ask your doctor or therapist before starting any new diet, supplement or protocol.",
  "Connect first, correct second. A hug or a calm word first, the lesson later.",
  "Keep favorite comfort items within reach during outings.",
  "Write down three questions before your next appointment so you do not forget them.",
  "Share one win with another parent today. You are not doing this alone.",
  "Break big tasks into pictures: sit, try, wipe, flush, wash.",
  "Give extra time. Rushing is the fastest way to a meltdown.",
  "Check hunger, thirst, tiredness and noise before assuming it is behavior.",
  "Try a short dance break between activities. Movement resets the mood.",
  "Praise in the moment, in a calm voice, with specific words.",
  "Tomorrow is a fresh start. Today you showed up, and that is enough.",
];
export function tipOfTheDay(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  const day = Math.floor((d - start) / 864e5);
  return DAILY_TIPS[day % DAILY_TIPS.length];
}
