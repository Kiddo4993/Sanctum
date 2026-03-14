import axios from 'axios';

const BIBLE_ID = 'de4e12af7f28f599-01'; // ESV
const BASE = 'https://rest.api.bible';
const API_KEY = import.meta.env.VITE_BIBLE_API_KEY;

const HEADERS = {
  'api-key': API_KEY,
  'Content-Type': 'text/plain'
};

export const fetchVerse = async (verseId) => {
  // Use a mock fallback if the developer hasn't set their API key yet.
  if (API_KEY === 'your_bible_api_key' || !API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate latency
    return {
      id: verseId,
      reference: verseId.replace('.', ' '),
      content: `<p>This is a mock verse for ${verseId}. Please set your API key in the .env file to see real verses.</p>`,
    };
  }

  const res = await axios.get(
    `${BASE}/bibles/${BIBLE_ID}/verses/${verseId}`,
    { headers: HEADERS, params: { 'include-verse-numbers': false } }
  );
  return res.data.data; // { id, reference, content }
};

export const VERSE_POOL = {
  wisdom: ['PSA.23.1', 'PRO.3.5', 'PRO.3.6', 'ECC.3.1', 'JOB.23.10'],
  gospels: ['JHN.3.16', 'JHN.14.6', 'MAT.5.9', 'LUK.6.31', 'MRK.12.30'],
  epistles: ['PHP.4.13', 'PHP.4.7', 'ROM.8.28', 'GAL.5.22', 'EPH.2.8'],
  prophecy: ['ISA.40.31', 'ISA.41.10', 'JER.29.11', 'DAN.12.3', 'MIC.6.8'],
};
