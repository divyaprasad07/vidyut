// scripts/seedData.js
//
// Generates realistic synthetic data, no "Student1"/"Question1" placeholders.
// Run with: npm run seed

import { setDoc, addDoc, getCollection, getDoc, updateDoc } from "../services/db.js";
import { startingRating, updateRating, DIFFICULTY_BANDS } from "../services/eloEngine.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STUDENT_NAMES = [
  "Aarav Sharma", "Priya Patel", "Rohan Mehta", "Ananya Iyer", "Vikram Nair",
  "Sneha Reddy", "Kabir Khan", "Ishita Verma", "Aditya Joshi", "Meera Pillai",
  "Arjun Das", "Riya Bhatt", "Yash Choudhary", "Kavya Menon", "Dev Malhotra",
  "Pooja Rathi", "Siddharth Rao", "Tanvi Kulkarni", "Nikhil Yadav", "Divya Saxena",
];

const TOPICS = [
  { id: "math", name: "Mathematics" },
  { id: "science", name: "Science" },
  { id: "english", name: "English" },
  { id: "social_science", name: "Social Science" },
  { id: "hindi", name: "Hindi" },
  { id: "bengali", name: "Bengali" },
  { id: "tamil", name: "Tamil" },
];

const QUESTION_BANK = {
  math: [
    ["What is 7 x 8?", "56", "easy"],
    ["Simplify: 12 / 4 + 3", "6", "easy"],
    ["Find the value of x: 2x + 5 = 15", "5", "medium"],
    ["What is the perimeter of a rectangle 8cm by 5cm?", "26 cm", "medium"],
    ["Factorise: x^2 - 9", "(x-3)(x+3)", "hard"],
    ["What is the sum of angles in a triangle?", "180 degrees", "easy"],
    ["Find the LCM of 12 and 18", "36", "medium"],
    ["Solve: 3x - 7 = 2x + 5", "x = 12", "hard"],
    ["What is the square root of 144?", "12", "easy"],
    ["A train travels 240 km in 4 hours. Find its speed.", "60 km/h", "medium"],
    ["What is 9 x 7?", "63", "easy"],
    ["Simplify: 25 - 8 + 3", "20", "easy"],
    ["Find the value of x: x / 4 = 9", "36", "medium"],
    ["What is the area of a square with side 6cm?", "36 cm^2", "medium"],
    ["Factorise: x^2 - 16", "(x-4)(x+4)", "hard"],
    ["What is the HCF of 24 and 36?", "12", "medium"],
    ["Solve: 5x + 2 = 27", "x = 5", "medium"],
    ["What is the cube of 3?", "27", "easy"],
    ["A pen bought for Rs 36 is sold for Rs 45. Find the profit percentage.", "25%", "hard"],
    ["What is 15% of 200?", "30", "medium"],
    ["What is 6 x 9?", "54", "easy"],
    ["Simplify: 40 / 5 - 2", "6", "easy"],
    ["Find x: 4x - 3 = 13", "x = 4", "medium"],
    ["What is the volume of a cube with side 3cm?", "27 cm^3", "medium"],
    ["Factorise: x^2 - 25", "(x-5)(x+5)", "hard"],
    ["What is the GCD of 15 and 20?", "5", "medium"],
    ["Solve: 2(x + 3) = 16", "x = 5", "medium"],
    ["What is 10 squared?", "100", "easy"],
    ["A shirt costs Rs 500 after a 20% discount. What was the original price?", "Rs 625", "hard"],
    ["What is 1/2 + 1/4?", "3/4", "medium"],
  ],
  science: [
    ["Which gas do plants absorb for photosynthesis?", "Carbon dioxide", "easy"],
    ["What is the powerhouse of the cell?", "Mitochondria", "easy"],
    ["What force pulls objects toward Earth?", "Gravity", "easy"],
    ["Name the process by which water changes to vapour.", "Evaporation", "medium"],
    ["What is the chemical symbol for sodium chloride?", "NaCl", "medium"],
    ["Which organ pumps blood through the body?", "Heart", "easy"],
    ["What type of energy is stored in a stretched rubber band?", "Potential energy", "medium"],
    ["Balance: H2 + O2 -> H2O", "2H2 + O2 -> 2H2O", "hard"],
    ["What is the unit of electric current?", "Ampere", "medium"],
    ["Name the process of splitting light into colours.", "Dispersion", "hard"],
    ["What gas do humans exhale during respiration?", "Carbon dioxide", "easy"],
    ["Name the process by which plants make their own food.", "Photosynthesis", "easy"],
    ["What is the boiling point of water in Celsius?", "100", "easy"],
    ["Which blood cells help fight infection?", "White blood cells", "medium"],
    ["What is the SI unit of force?", "Newton", "medium"],
    ["Name the smallest unit of life.", "Cell", "easy"],
    ["What is the pH value of pure water?", "7", "medium"],
    ["Which planet is known as the Red Planet?", "Mars", "easy"],
    ["What type of mirror is used in vehicle side mirrors?", "Convex mirror", "hard"],
    ["Name the process of a solid changing directly into gas.", "Sublimation", "hard"],
    ["What is the process by which liquid changes to solid called?", "Freezing", "easy"],
    ["Which vitamin is produced when skin is exposed to sunlight?", "Vitamin D", "medium"],
    ["What is the largest organ in the human body?", "Skin", "easy"],
    ["What is the chemical formula for water?", "H2O", "easy"],
    ["Name the force that opposes motion between two surfaces.", "Friction", "medium"],
    ["What is the normal human body temperature in Celsius?", "37", "easy"],
    ["Which part of the plant conducts photosynthesis?", "Leaves", "easy"],
    ["What is the process of a caterpillar becoming a butterfly called?", "Metamorphosis", "hard"],
    ["Name the scientist who proposed the theory of gravity.", "Isaac Newton", "medium"],
    ["What is the unit used to measure atmospheric pressure?", "Pascal", "hard"],
  ],
  english: [
    ["Choose the correct spelling: 'recieve' or 'receive'", "receive", "easy"],
    ["Identify the noun in: 'The dog barked loudly.'", "dog", "easy"],
    ["What is the past tense of 'go'?", "went", "easy"],
    ["Combine using a conjunction: 'She was tired. She finished her work.'", "She was tired, but she finished her work.", "medium"],
    ["Name the figure of speech: 'The stars danced in the sky.'", "Personification", "hard"],
    ["Give a synonym for 'happy'.", "joyful", "easy"],
    ["Identify the tense: 'They have completed the project.'", "Present perfect", "medium"],
    ["What is the plural of 'child'?", "children", "easy"],
    ["Correct the sentence: 'He don't like tea.'", "He doesn't like tea.", "medium"],
    ["Name the type of sentence: 'What a beautiful morning!'", "Exclamatory", "hard"],
    ["What is the opposite of 'begin'?", "end", "easy"],
    ["Identify the verb: 'She sings beautifully.'", "sings", "easy"],
    ["What is the plural of 'mouse'?", "mice", "easy"],
    ["Choose the correct article: '___ apple a day keeps the doctor away.'", "An", "medium"],
    ["Name the figure of speech: 'Time is money.'", "Metaphor", "hard"],
    ["What is the past participle of 'write'?", "written", "medium"],
    ["Identify the adjective: 'The tall boy ran fast.'", "tall", "easy"],
    ["Combine using 'because': 'He was late. He missed the bus.'", "He was late because he missed the bus.", "medium"],
    ["Give a synonym for 'brave'.", "courageous", "easy"],
    ["Name the type of sentence: 'Close the door.'", "Imperative", "hard"],
    ["What is the past tense of 'eat'?", "ate", "easy"],
    ["Identify the pronoun: 'She went to the market.'", "She", "easy"],
    ["What is the plural of 'tooth'?", "teeth", "easy"],
    ["Choose the correct word: 'Neither of the boys ___ ready.'", "is", "medium"],
    ["Name the figure of speech: 'The wind whispered through the trees.'", "Personification", "hard"],
    ["Give an antonym for 'ancient'.", "modern", "easy"],
    ["Identify the tense: 'I am reading a book.'", "Present continuous", "medium"],
    ["What is the comparative form of 'good'?", "better", "medium"],
    ["Correct the sentence: 'She don't know the answer.'", "She doesn't know the answer.", "medium"],
    ["Name the type of sentence: 'Please sit down.'", "Imperative", "hard"],
  ],
  social_science: [
    ["Who was the first Prime Minister of India?", "Jawaharlal Nehru", "easy"],
    ["Name the largest continent by area.", "Asia", "easy"],
    ["In which year did India gain independence?", "1947", "easy"],
    ["What is the capital of Rajasthan?", "Jaipur", "medium"],
    ["Name the river on which Varanasi is situated.", "Ganga", "medium"],
    ["What type of government does India have?", "Parliamentary democracy", "medium"],
    ["Which Article of the Indian Constitution abolishes untouchability?", "Article 17", "hard"],
    ["Name the mountain range that separates India from China.", "Himalayas", "easy"],
    ["Who wrote the Indian national anthem?", "Rabindranath Tagore", "medium"],
    ["What is the term for a government elected by the people?", "Democracy", "easy"],
    ["Who is known as the Father of the Nation in India?", "Mahatma Gandhi", "easy"],
    ["Name the capital of India.", "New Delhi", "easy"],
    ["Which is the longest river in India?", "Ganga", "medium"],
    ["What is the term for the elected head of a Panchayat?", "Sarpanch", "medium"],
    ["Name the ocean to the south of India.", "Indian Ocean", "easy"],
    ["Who was the first President of India?", "Rajendra Prasad", "medium"],
    ["What is the minimum age to vote in India?", "18", "easy"],
    ["Name the body that makes laws for the country.", "Parliament", "medium"],
    ["Which Article of the Constitution deals with the Right to Education?", "Article 21A", "hard"],
    ["What is the term for a country ruled by a king or queen?", "Monarchy", "hard"],
    ["Name the first woman Prime Minister of India.", "Indira Gandhi", "medium"],
    ["What is the capital of Maharashtra?", "Mumbai", "easy"],
    ["Which is the smallest state in India by area?", "Goa", "medium"],
    ["Name the mountain range in southern India.", "Western Ghats", "medium"],
    ["What is the term for the study of maps?", "Cartography", "hard"],
    ["Which festival is known as the festival of lights?", "Diwali", "easy"],
    ["Name the river that flows through Kolkata.", "Hooghly", "medium"],
    ["What is the currency of India?", "Indian Rupee", "easy"],
    ["Which commission recommended the formation of linguistic states?", "States Reorganisation Commission", "hard"],
    ["Name the highest civilian award in India.", "Bharat Ratna", "hard"],
  ],
  hindi: [
    ["'पानी' का पर्यायवाची शब्द बताइए।", "जल", "easy"],
    ["'सूरज' का विलोम शब्द क्या है?", "यह शब्द विलोम नहीं रखता (चंद्रमा निकटतम है)", "hard"],
    ["'वह पढ़ता है' में क्रिया कौन सी है?", "पढ़ता है", "easy"],
    ["'राम ने रावण को मारा' - इस वाक्य में कर्ता कौन है?", "राम", "medium"],
    ["'मीठा' का विलोम शब्द बताइए।", "कड़वा", "easy"],
    ["संधि विच्छेद करें: विद्यालय", "विद्या + आलय", "hard"],
    ["'घर' का बहुवचन रूप क्या है?", "घर (अपरिवर्तित)", "medium"],
    ["'खुशी' का पर्यायवाची बताइए।", "आनंद", "easy"],
    ["'तुम कहाँ जा रहे हो?' - यह किस प्रकार का वाक्य है?", "प्रश्नवाचक", "medium"],
    ["मुहावरे का अर्थ बताइए: 'आंखें खुलना'", "सच्चाई का एहसास होना", "hard"],
    ["'रात' का विलोम शब्द बताइए।", "दिन", "easy"],
    ["'वह दौड़ रहा है' में क्रिया कौन सी है?", "दौड़ रहा है", "easy"],
    ["'फूल' का बहुवचन रूप क्या है?", "फूल (अपरिवर्तित)", "medium"],
    ["'बड़ा' का विलोम शब्द बताइए।", "छोटा", "easy"],
    ["संधि विच्छेद करें: सूर्योदय", "सूर्य + उदय", "hard"],
    ["'आकाश' का पर्यायवाची शब्द बताइए।", "गगन", "medium"],
    ["'वह चाय पीता है।' - इस वाक्य में कर्म कौन है?", "चाय", "medium"],
    ["मुहावरे का अर्थ बताइए: 'दाँतों तले उंगली दबाना'", "आश्चर्यचकित होना", "hard"],
    ["'ठंडा' का विलोम शब्द बताइए।", "गरम", "easy"],
    ["'वह विद्यालय जाता है।' - यह किस प्रकार का वाक्य है?", "विधानवाचक", "medium"],
    ["'बड़ा' का पर्यायवाची शब्द बताइए।", "विशाल", "medium"],
    ["'दिन' का बहुवचन रूप क्या है?", "दिन (अपरिवर्तित)", "medium"],
    ["'वह गाना गाती है।' - इस वाक्य में कर्ता कौन है?", "वह", "easy"],
    ["'सच' का विलोम शब्द बताइए।", "झूठ", "easy"],
    ["संधि विच्छेद करें: हिमालय", "हिम + आलय", "hard"],
    ["'पेड़' का पर्यायवाची शब्द बताइए।", "वृक्ष", "easy"],
    ["'नदी' का पर्यायवाची शब्द बताइए।", "सरिता", "medium"],
    ["मुहावरे का अर्थ बताइए: 'नाक में दम करना'", "बहुत परेशान करना", "hard"],
    ["'तेज़' का विलोम शब्द बताइए।", "धीमा", "easy"],
    ["'वह किताब पढ़ रहा है।' - यह किस काल का वाक्य है?", "वर्तमान काल", "medium"],
  ],
  bengali: [
    ["'জল' শব্দের একটি প্রতিশব্দ বলো।", "পানি", "easy"],
    ["'বড়' শব্দের বিপরীত শব্দ কী?", "ছোট", "easy"],
    ["'সে বই পড়ে।' - এই বাক্যে ক্রিয়া কোনটি?", "পড়ে", "easy"],
    ["'রাম রাবণকে হত্যা করেছিল।' - এই বাক্যে কর্তা কে?", "রাম", "medium"],
    ["'মিষ্টি' শব্দের বিপরীত শব্দ কী?", "তেতো", "easy"],
    ["সন্ধি বিচ্ছেদ করো: বিদ্যালয়", "বিদ্যা + আলয়", "hard"],
    ["'ঘর' শব্দের বহুবচন রূপ কী?", "ঘরগুলো", "medium"],
    ["'আনন্দ' শব্দের একটি প্রতিশব্দ বলো।", "খুশি", "easy"],
    ["'তুমি কোথায় যাচ্ছ?' - এটি কোন ধরনের বাক্য?", "প্রশ্নবোধক বাক্য", "medium"],
    ["মুহাবরার অর্থ বলো: 'চোখ কপালে ওঠা'", "আশ্চর্য হওয়া", "hard"],
    ["'রাত' শব্দের বিপরীত শব্দ কী?", "দিন", "easy"],
    ["'সে দৌড়াচ্ছে।' - এই বাক্যে ক্রিয়া কোনটি?", "দৌড়াচ্ছে", "easy"],
    ["'ফুল' শব্দের বহুবচন রূপ কী?", "ফুলগুলো", "medium"],
    ["'উঁচু' শব্দের বিপরীত শব্দ কী?", "নিচু", "easy"],
    ["সন্ধি বিচ্ছেদ করো: সূর্যোদয়", "সূর্য + উদয়", "hard"],
    ["'আকাশ' শব্দের একটি প্রতিশব্দ বলো।", "গগন", "medium"],
    ["'সে চা খায়।' - এই বাক্যে কর্ম কোনটি?", "চা", "medium"],
    ["মুহাবরার অর্থ বলো: 'নাকে দড়ি দেওয়া'", "কাউকে সম্পূর্ণ বশে আনা", "hard"],
    ["'ঠান্ডা' শব্দের বিপরীত শব্দ কী?", "গরম", "easy"],
    ["'সে বিদ্যালয়ে যায়।' - এটি কোন ধরনের বাক্য?", "বিবৃতিমূলক বাক্য", "medium"],
    ["'গাছ' শব্দের একটি প্রতিশব্দ বলো।", "বৃক্ষ", "easy"],
    ["'নদী' শব্দের একটি প্রতিশব্দ বলো।", "সরিতা", "medium"],
    ["'সে কাজ শেষ করেছে।' - এটি কোন কালের বাক্য?", "পুরাঘটিত বর্তমান কাল", "medium"],
    ["'বই' শব্দের বহুবচন রূপ কী?", "বইগুলো", "medium"],
    ["'সত্য' শব্দের বিপরীত শব্দ কী?", "মিথ্যা", "easy"],
    ["'সে গান গায়।' - এই বাক্যে ক্রিয়া কোনটি?", "গায়", "easy"],
    ["সন্ধি বিচ্ছেদ করো: হিমালয়", "হিম + আলয়", "hard"],
    ["মুহাবরার অর্থ বলো: 'দাঁতে দাঁত চেপে থাকা'", "কষ্ট সহ্য করা", "hard"],
    ["'মা শিশুটিকে আদর করে।' - এই বাক্যে কর্ম কোনটি?", "শিশুটিকে", "medium"],
    ["'দ্রুত' শব্দের বিপরীত শব্দ কী?", "ধীর", "easy"],
  ],
  tamil: [
    ["'நீர்' என்பதற்கு ஒரு ஒத்த சொல் கூறு.", "ஜலம்", "easy"],
    ["'பெரிய' என்பதன் எதிர்ச்சொல் என்ன?", "சிறிய", "easy"],
    ["'அவன் புத்தகம் படிக்கிறான்.' - இவ்வாக்கியத்தில் வினைச்சொல் எது?", "படிக்கிறான்", "easy"],
    ["'இராமன் இராவணனைக் கொன்றான்.' - இவ்வாக்கியத்தில் எழுவாய் எது?", "இராமன்", "medium"],
    ["'இனிப்பு' என்பதன் எதிர்ச்சொல் என்ன?", "கசப்பு", "easy"],
    ["சந்தி பிரிக்கவும்: பள்ளிக்கூடம்", "பள்ளி + கூடம்", "hard"],
    ["'வீடு' என்பதன் பன்மை வடிவம் என்ன?", "வீடுகள்", "medium"],
    ["'மகிழ்ச்சி' என்பதற்கு ஒரு ஒத்த சொல் கூறு.", "சந்தோஷம்", "easy"],
    ["'நீ எங்கே போகிறாய்?' - இது எந்த வகை வாக்கியம்?", "வினா வாக்கியம்", "medium"],
    ["முதுமொழியின் பொருள் கூறு: 'தலை குனிதல்'", "வெட்கப்படுதல்", "hard"],
    ["'இரவு' என்பதன் எதிர்ச்சொல் என்ன?", "பகல்", "easy"],
    ["'அவள் ஓடுகிறாள்.' - இவ்வாக்கியத்தில் வினைச்சொல் எது?", "ஓடுகிறாள்", "easy"],
    ["'பூ' என்பதன் பன்மை வடிவம் என்ன?", "பூக்கள்", "medium"],
    ["'உயரமான' என்பதன் எதிர்ச்சொல் என்ன?", "குட்டையான", "easy"],
    ["சந்தி பிரிக்கவும்: இமயமலை", "இமயம் + மலை", "hard"],
    ["'வானம்' என்பதற்கு ஒரு ஒத்த சொல் கூறு.", "ஆகாயம்", "medium"],
    ["'அவன் தேநீர் குடிக்கிறான்.' - இவ்வாக்கியத்தில் செயப்படுபொருள் எது?", "தேநீர்", "medium"],
    ["முதுமொழியின் பொருள் கூறு: 'கை கட்டி உட்காருதல்'", "வேலை ஏதும் செய்யாமல் இருத்தல்", "hard"],
    ["'குளிர்' என்பதன் எதிர்ச்சொல் என்ன?", "வெப்பம்", "easy"],
    ["'அவன் பள்ளிக்குச் செல்கிறான்.' - இது எந்த வகை வாக்கியம்?", "அறிவிப்பு வாக்கியம்", "medium"],
    ["'மரம்' என்பதற்கு ஒரு ஒத்த சொல் கூறு.", "விருட்சம்", "easy"],
    ["'ஆறு' என்பதற்கு ஒரு ஒத்த சொல் கூறு.", "நதி", "medium"],
    ["'அவன் வேலையை முடித்துவிட்டான்.' - இவ்வாக்கியத்தின் காலம் எது?", "இறந்த காலம்", "medium"],
    ["'புத்தகம்' என்பதன் பன்மை வடிவம் என்ன?", "புத்தகங்கள்", "medium"],
    ["'உண்மை' என்பதன் எதிர்ச்சொல் என்ன?", "பொய்", "easy"],
    ["'அவன் பாட்டு பாடுகிறான்.' - இவ்வாக்கியத்தில் வினைச்சொல் எது?", "பாடுகிறான்", "easy"],
    ["சந்தி பிரிக்கவும்: மழைக்காலம்", "மழை + காலம்", "hard"],
    ["முதுமொழியின் பொருள் கூறு: 'கண்ணை மூடி விடுதல்'", "கண்டும் காணாதது போல் இருத்தல்", "hard"],
    ["'வேகமான' என்பதன் எதிர்ச்சொல் என்ன?", "மெதுவான", "easy"],
    ["'அம்மா குழந்தையை அன்பு செய்கிறாள்.' - இவ்வாக்கியத்தில் செயப்படுபொருள் எது?", "குழந்தையை", "medium"],
  ],
};

const BAND_RATING = {
  easy: DIFFICULTY_BANDS.easy,
  medium: DIFFICULTY_BANDS.medium,
  hard: DIFFICULTY_BANDS.hard,
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function shuffle(arr) {
  return arr
    .map((v) => [Math.random(), v])
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
}
function daysAgo(n, hour = randInt(15, 21)) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, randInt(0, 59), 0, 0);
  return d.toISOString();
}

/**
 * Build 4 MCQ options (1 correct + 3 distractors) for a question.
 * Purely numeric answers get near-value numeric distractors, so a math
 * question doesn't end up with an unrelated word as a wrong option.
 * Everything else draws distractors from other real answers in the same
 * topic, real domain content rather than filler text.
 */
function buildOptions(correctAnswer, topicId) {
  const asNumber = Number(correctAnswer);
  const isPureNumber = correctAnswer.trim() !== "" && !Number.isNaN(asNumber) && /^-?\d+(\.\d+)?$/.test(correctAnswer.trim());

  let distractors = [];
  if (isPureNumber) {
    const used = new Set([asNumber]);
    while (distractors.length < 3) {
      const offset = pick([-3, -2, -1, 1, 2, 3, 4, -4]) * (asNumber === 0 ? 1 : Math.max(1, Math.round(Math.abs(asNumber) * 0.15)));
      const candidate = asNumber + offset;
      if (!used.has(candidate)) {
        used.add(candidate);
        distractors.push(String(candidate));
      }
    }
  } else {
    const pool = QUESTION_BANK[topicId]
      .map(([, answer]) => answer)
      .filter((a) => a !== correctAnswer);
    const used = new Set();
    while (distractors.length < 3 && used.size < pool.length) {
      const candidate = pick(pool);
      if (!used.has(candidate)) {
        used.add(candidate);
        distractors.push(candidate);
      }
    }
    // Small/edge-case topics might not have 3 distinct alternatives;
    // pad with a clearly-synthetic-but-honest fallback rather than crash.
    while (distractors.length < 3) {
      distractors.push(`${correctAnswer} (variant ${distractors.length + 1})`);
    }
  }

  return shuffle([correctAnswer, ...distractors]);
}

async function seed() {
  console.log("Seeding topics/questions...");
  const questionIdsByTopic = {};
  for (const topic of TOPICS) {
    questionIdsByTopic[topic.id] = [];
    for (const [text, answer, band] of QUESTION_BANK[topic.id]) {
      const id = await addDoc("questions", {
        topic: topic.id,
        text,
        correctAnswer: answer,
        options: buildOptions(answer, topic.id),
        difficultyBand: band,
        difficultyRating: BAND_RATING[band],
        translations: { en: text }, // extended by the i18n pass, see topics/studies-style content task
      });
      questionIdsByTopic[topic.id].push(id);
    }
  }
  console.log(
    `Seeded ${Object.values(questionIdsByTopic).flat().length} questions across ${TOPICS.length} topics.`
  );

  console.log("Seeding students + attempts...");
  const classNames = ["6A", "6B", "7A", "7B", "8A"];
  let decliningCount = 0;

  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const studentId = `stu_${i + 1}`;
    const klass = pick(classNames);
    const ratings = {};
    for (const topic of TOPICS) ratings[topic.id] = { rating: startingRating(), history: [] };

    // ~35% of students get a deliberate "declining" activity pattern:
    // active in days 14-8 ago, then mostly silent in the last 7 days.
    const isDeclining = i % 3 === 0;
    if (isDeclining) decliningCount++;

    const attemptsToWrite = [];
    const numOldAttempts = isDeclining ? randInt(5, 8) : randInt(2, 4);
    const numRecentAttempts = isDeclining ? randInt(0, 1) : randInt(4, 8);
    const offsets = [];

    // Each student gets their own shrinking copy of each topic's question
    // pool. Attempts draw from it without replacement and this always
    // reserves MIN_RESERVE questions untouched. Set well above one quiz's
    // length (8) so completing a quiz once during testing doesn't
    // immediately exhaust the topic again, real headroom for repeated
    // testing, not just a bare guarantee of "at least one quiz's worth".
    const MIN_RESERVE = 20;
    const remainingPool = {};
    for (const topic of TOPICS) remainingPool[topic.id] = shuffle(questionIdsByTopic[topic.id]);

    const genAttempt = (topic, ts) => {
      const pool = remainingPool[topic.id];
      const availableToUse = pool.length - MIN_RESERVE;
      if (availableToUse < 3) return; // not enough headroom left, skip this attempt entirely

      const drawCount = Math.min(randInt(3, 7), availableToUse);
      const qIds = pool.splice(0, drawCount); // consumes from the pool, no reuse across attempts

      let correct = 0;
      let rating = ratings[topic.id].rating;
      for (const qId of qIds) {
        const q = QUESTION_BANK[topic.id].find((_, idx) => questionIdsByTopic[topic.id][idx] === qId);
        const band = q ? q[2] : "medium";
        const qRating = BAND_RATING[band];
        const dayOffset = Math.round((Date.now() - new Date(ts).getTime()) / 86400000);
        // Declining students answer worse in the recent window
        const skillFactor = isDeclining && dayOffset < 7 ? 0.35 : 0.65 + Math.random() * 0.25;
        const isCorrect = Math.random() < skillFactor;
        if (isCorrect) correct++;
        rating = updateRating(rating, qRating, isCorrect);
      }
      ratings[topic.id].rating = rating;
      ratings[topic.id].history.push({ rating, ts });
      attemptsToWrite.push({
        studentId,
        topicId: topic.id,
        questionIds: qIds,
        score: correct,
        questionsAttempted: qIds.length,
        timeTakenSec: qIds.length * randInt(18, 40),
        timestamp: ts,
        autoSubmitted: Math.random() < 0.07,
        violationType: Math.random() < 0.07 ? "tab_switch" : null,
      });
    };

    for (let a = 0; a < numOldAttempts; a++) {
      offsets.push({ ts: daysAgo(randInt(8, 14)), topic: pick(TOPICS) });
    }
    for (let a = 0; a < numRecentAttempts; a++) {
      offsets.push({ ts: daysAgo(randInt(0, 6)), topic: pick(TOPICS) });
    }
    // Sort by the actual generated timestamp (not just day) so ties within
    // the same day still land in true chronological order, then apply Elo
    // updates in that exact order — otherwise both the rating-progression
    // history and the "current" rating itself come out wrong.
    offsets.sort((a, b) => new Date(a.ts) - new Date(b.ts));
    for (const { ts, topic } of offsets) {
      genAttempt(topic, ts);
    }

    for (const attempt of attemptsToWrite) {
      await addDoc("attempts", attempt);
    }

    await setDoc("students", studentId, {
      name: STUDENT_NAMES[i],
      email: STUDENT_NAMES[i].toLowerCase().replace(/\s+/g, ".") + "@vidyut.demo",
      class: klass,
      school: "Govt. Senior Secondary School, Sector 12",
      language: pick(["en", "hi", "bn", "mr", "ta", "te"]),
      streak: 0, // computed on read from attempts, not stored as source of truth
      lastActive: attemptsToWrite.length
        ? attemptsToWrite.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp
        : null,
      ratings,
    });
  }

  console.log(
    `Seeded ${STUDENT_NAMES.length} students (${decliningCount} with a deliberate declining-activity pattern for the teacher dashboard filter to surface).`
  );

  await setDoc("teachers", "teacher_1", {
    name: "Anita Deshmukh",
    pinHash: "1234", // demo only, see server/routes/teachers.js for the real hashing note
    classesTaught: classNames,
  });

  await seedVideos();
  await seedPlatinumBadges();

  console.log("\nSeed complete.");
}

/**
 * TIER 2 — Video lecture library seed content.
 * Honest limitation: this environment can't source real recorded lecture
 * footage, so each clip is a short synthesized test-pattern video (ffmpeg
 * testsrc2 + a tone, with an on-screen ASCII label identifying it) rather
 * than actual teaching content. Everything else about each entry is real,
 * non-placeholder metadata: genuine subject-appropriate titles written in
 * the video's actual language (covering all 6 supported languages, not
 * just Hindi/English), a real class/chapter/teacher, and a believable
 * upload timestamp. Swap in real .mp4 files at the same storageUrl paths
 * once you have them, no schema change needed.
 */
async function seedVideos() {
  console.log("Seeding video lecture library (synthesized placeholder clips, see note in code)...");
  const uploadsDir = path.join(__dirname, "..", "uploads", "seed");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const VIDEOS = [
    {
      title: "Simple Interest and Compound Interest",
      subject: "math", class: "8A", chapter: "Chapter 8: Comparing Quantities",
      language: "en", captions: true,
    },
    {
      title: "भिन्न को समझना (Understanding Fractions)",
      subject: "math", class: "6A", chapter: "Chapter 7: Fractions",
      language: "hi", captions: true,
    },
    {
      title: "পদার্থের অবস্থা (States of Matter)",
      subject: "science", class: "7B", chapter: "Chapter 1: Physical and Chemical Changes",
      language: "bn", captions: false,
    },
    {
      title: "भारतीय राज्यघटनेतील मूलभूत हक्क (Fundamental Rights)",
      subject: "social_science", class: "8B", chapter: "Chapter 4: The Indian Constitution",
      language: "mr", captions: false,
    },
    {
      title: "பேச்சின் பகுதிகள் (Parts of Speech)",
      subject: "english", class: "6B", chapter: "Chapter 2: Grammar Basics",
      language: "ta", captions: false,
    },
    {
      title: "పదార్థ స్థితులు (States of Matter)",
      subject: "science", class: "7A", chapter: "Chapter 1: Physical and Chemical Changes",
      language: "te", captions: false,
    },
  ];

  let seededCount = 0;
  const seededLanguages = new Set();
  for (let i = 0; i < VIDEOS.length; i++) {
    const v = VIDEOS[i];
    const filename = `seed-${i + 1}-${v.subject}-${v.language}.mp4`;
    const outPath = path.join(uploadsDir, filename);
    const label = `VIDYUT DEMO CLIP ${i + 1} - ${v.subject.toUpperCase()} - ${v.language.toUpperCase()}`;

    if (!fs.existsSync(outPath)) {
      // This repo ships with these clips pre-rendered under
      // server/uploads/seed/, so this branch normally never runs. It only
      // fires if those files were deleted, and ffmpeg is very unlikely to
      // be installed on a typical Windows dev machine, so this must not
      // crash the rest of the seed script (students/questions/attempts)
      // if it fails, it should just skip this one video and say why.
      try {
        execSync(
          `ffmpeg -y -f lavfi -i "testsrc2=size=480x270:rate=15:duration=4" ` +
            `-f lavfi -i "sine=frequency=440:duration=4" ` +
            `-vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${label}':fontcolor=white:fontsize=16:x=(w-text_w)/2:y=h-40:box=1:boxcolor=black@0.6" ` +
            `-c:v libx264 -preset ultrafast -c:a aac -shortest "${outPath}"`,
          { stdio: "pipe" }
        );
      } catch (err) {
        console.warn(
          `  Skipping "${v.title}": couldn't generate its placeholder clip (ffmpeg not available on this machine). ` +
            `Everything else in the seed continues normally; add ffmpeg to PATH and re-run npm run seed to include it.`
        );
        continue;
      }
    }

    let captionsUrl = "";
    if (v.captions) {
      const vttPath = path.join(uploadsDir, `seed-${i + 1}.vtt`);
      fs.writeFileSync(
        vttPath,
        `WEBVTT\n\n00:00:00.000 --> 00:00:04.000\n${v.title}\n`
      );
      captionsUrl = `/uploads/seed/${path.basename(vttPath)}`;
    }

    const daysAgoUpload = randInt(1, 12);
    const d = new Date();
    d.setDate(d.getDate() - daysAgoUpload);

    await addDoc("videos", {
      title: v.title,
      subject: v.subject,
      class: v.class,
      chapter: v.chapter,
      teacherName: "Anita Deshmukh",
      uploadTimestamp: d.toISOString(),
      tracks: [
        {
          language: v.language,
          storageUrl: `/uploads/seed/${filename}`,
          captionsUrl,
          uploadTimestamp: d.toISOString(),
        },
      ],
    });
    seededCount++;
    seededLanguages.add(v.language);
  }

  const skipped = VIDEOS.length - seededCount;
  console.log(
    `Seeded ${seededCount} lecture video${seededCount === 1 ? "" : "s"} across ${seededLanguages.size} language${seededLanguages.size === 1 ? "" : "s"}` +
      (skipped > 0 ? ` (${skipped} skipped, see warnings above).` : ".")
  );
}

/**
 * Genuinely earns a Platinum badge for a handful of students, real
 * qualifying attempts (perfect score, 8+ questions, Multiple Choice mode)
 * written the same way the live app's POST /api/attempts route would,
 * not a fabricated count. Only used so the leaderboard has real badge
 * counts to show for a demo, rather than looking empty. Each award only
 * touches a topic that still has 16+ unanswered questions for that
 * student, so at least 8 stay free for real quiz-taking afterward, same
 * headroom principle as the rest of the seed data.
 */
async function seedPlatinumBadges() {
  console.log("Seeding a few genuine Platinum badges (real perfect-MCQ attempts) for leaderboard realism...");
  const topicIds = TOPICS.map((t) => t.id);
  // studentId -> how many separate perfect-MCQ attempts (different topics each) to award
  const PLAN = { stu_1: 2, stu_2: 1, stu_5: 3, stu_8: 1 };
  let totalAwarded = 0;

  for (const [studentId, count] of Object.entries(PLAN)) {
    let student = await getDoc("students", studentId);
    if (!student) continue;
    const attempts = await getCollection("attempts");
    const allQuestions = await getCollection("questions");
    const shuffledTopics = [...topicIds].sort(() => Math.random() - 0.5);
    let awardedForThisStudent = 0;

    for (const topicId of shuffledTopics) {
      if (awardedForThisStudent >= count) break;

      const topicQuestions = allQuestions.filter((q) => q.topic === topicId);
      const answeredIds = new Set(
        attempts
          .filter((a) => a.studentId === studentId && a.topicId === topicId)
          .flatMap((a) => a.questionIds)
      );
      const unanswered = topicQuestions.filter((q) => !answeredIds.has(q.id));
      if (unanswered.length < 16) continue; // leaves at least 8 free for real quiz-taking after this

      const chosen = unanswered.slice(0, 8);
      const ts = daysAgo(randInt(0, 5));
      let rating = student.ratings?.[topicId]?.rating ?? startingRating();
      const history = student.ratings?.[topicId]?.history ?? [];
      let timeTakenSec = 0;
      for (const q of chosen) {
        rating = updateRating(rating, q.difficultyRating, true);
        history.push({ rating, ts });
        timeTakenSec += randInt(12, 30);
      }

      await addDoc("attempts", {
        studentId,
        topicId,
        questionIds: chosen.map((q) => q.id),
        score: chosen.length,
        questionsAttempted: chosen.length,
        timeTakenSec,
        timestamp: ts,
        autoSubmitted: false,
        violationType: null,
        quizMode: "mcq", // required: Platinum only counts Multiple Choice mode
      });

      const newRatings = { ...student.ratings, [topicId]: { rating, history } };
      await updateDoc("students", studentId, { ratings: newRatings });
      student = { ...student, ratings: newRatings }; // keep building on this student's updates across topics

      awardedForThisStudent++;
      totalAwarded++;
    }
  }

  console.log(`Awarded ${totalAwarded} genuine Platinum-qualifying attempts across ${Object.keys(PLAN).length} students.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
