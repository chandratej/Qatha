/** Motivational copy for Refine preview — Literary + Creator Psychology councils */

export function refineEncouragement(
  wordCount: number,
  wordGoal: number,
  locale: string,
): { headline: string; subline: string } {
  const te = locale === 'te';
  const pct = wordGoal > 0 ? Math.round((wordCount / wordGoal) * 100) : 0;

  if (wordCount === 0) {
    return te
      ? {
          headline: 'మీ పాఠకులు మీ మొదటి పదాల కోసం ఎదురు చూస్తున్నారు',
          subline: 'రాయడం మోడ్‌లో ఒక వాక్యం రాయండి — ఇక్కడ అది జీవంతంగా కనిపిస్తుంది',
        }
      : {
          headline: 'Your readers are waiting for your first words',
          subline: 'Write one sentence in Write mode — watch it come alive here',
        };
  }

  if (wordCount < 120) {
    return te
      ? {
          headline: 'ప్రతి గొప్ప కథ ఒక వాక్యంతో మొదలవుతుంది',
          subline: 'మీరు ఇప్పటికే ప్రారంభించారు. కొనసాగించండి.',
        }
      : {
          headline: 'Every beloved story begins with a single sentence',
          subline: 'You have already started. Keep going.',
        };
  }

  if (pct < 50) {
    return te
      ? {
          headline: 'మీ కథ ఆకారం తీసుకుంటోంది',
          subline: `${wordCount.toLocaleString()} పదాలు — ప్రతి పదం మీ ప్రపంచాన్ని నిర్మిస్తుంది`,
        }
      : {
          headline: 'Your story is taking shape',
          subline: `${wordCount.toLocaleString()} words — each one builds your world`,
        };
  }

  if (pct < 100) {
    return te
      ? {
          headline: 'బాగా ముందుకు వెళ్తున్నారు',
          subline: `ఈ అధ్యాయం ${pct}% పూర్తి — పాఠకులు ఇలా చదువుతారు`,
        }
      : {
          headline: 'You are making real progress',
          subline: `This chapter is ${pct}% toward your goal — this is how readers will experience it`,
        };
  }

  return te
    ? {
        headline: 'ఈ అధ్యాయానికి బలమైన మొమెంటం ఉంది',
        subline: 'మీరు రాసినది నిజంగా చదవదగినది. గర్వంగా ముందుకు సాగండి.',
      }
    : {
        headline: 'This chapter has real momentum',
        subline: 'What you have written is genuinely readable. Write with pride.',
      };
}