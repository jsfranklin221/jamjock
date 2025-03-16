import { JockJamSong } from '../types';

// For MVP, we'll start with "Sweet Caroline" as it's a popular, fun song
export const JOCK_JAMS: JockJamSong[] = [
  {
    id: 'sweet-caroline',
    title: "Sweet Caroline",
    artist: "Neil Diamond",
    year: 1969,
    tempo: "moderate=108",
    key: "C-major",
    rhythm: "4/4",
    license: "Creative Commons Attribution 4.0",
    attribution: "Pop Ballad backing track by AudioCoffee",
    previewLyrics: "Where it began\nI can't begin to knowing\nBut then I know it's growing strong\nWas in the spring\nThen spring became the summer\nWho'd have believed you'd come along\n\nHands, touching hands\nReaching out, touching me, touching you\n\nSweet Caroline\nGood times never seemed so good\nI've been inclined\nTo believe they never would",
    fullLyrics: "Where it began\nI can't begin to knowing\nBut then I know it's growing strong\nWas in the spring\nThen spring became the summer\nWho'd have believed you'd come along\n\nHands, touching hands\nReaching out, touching me, touching you\n\nSweet Caroline\nGood times never seemed so good\nI've been inclined\nTo believe they never would\n\nSweet Caroline\nGood times never seemed so good\nSweet Caroline\nI believe they never could",
    backingTrackUrl: "https://agfcyyafbywugijgeesz.supabase.co/storage/v1/object/public/backing_tracks//Backing%20Track%20of%20Sweet%20Caroline%201%20(master).mp3",
    minRecordingLength: 30, // Updated to 30 seconds
    maxRecordingLength: 30, // Updated to 30 seconds
    previewDuration: 30,
    fullDuration: 30,
    price: 600 // in cents ($6.00)
  }
];