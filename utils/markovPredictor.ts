type MarkovChain = Record<string, Record<string, number>>;

export function buildMarkovChain(corpus: string[], n = 2): MarkovChain {
  const chain: MarkovChain = {};

  for (const text of corpus) {
    const words = text.toLowerCase().split(/\s+/);

    for (let i = 0; i <= words.length - n - 1; i++) {
      const key = words.slice(i, i + n).join(' ');
      const nextWord = words[i + n];

      if (!chain[key]) chain[key] = {};
      chain[key][nextWord] = (chain[key][nextWord] || 0) + 1;
    }
  }

  return chain;
}

export function predictNextWord(chain: MarkovChain, input: string, n = 2): string | null {
    const cleaned = input
      .toLowerCase()
      .replace(/[.,!?]/g, '')
      .split(/\s+/);
  
    if (cleaned.length < 1) return null;
  
    const lastWord = cleaned[cleaned.length - 1];
    const prefixWords = cleaned.slice(-n - 1, -1).join(' '); // e.g., "want to"
    const key = prefixWords;
  
    const nextWords = chain[key];
    if (!nextWords) return null;
  
    // 🔍 PARTIAL MATCH: filter predictions that start with the last typed word
    const candidates = Object.entries(nextWords).filter(([word]) =>
      word.startsWith(lastWord)
    );
  
    if (candidates.length === 0) return null;
  
    // Return the most frequent partial match
    return candidates.reduce((a, b) => (b[1] > a[1] ? b : a))[0].slice(lastWord.length);
  }
