// קוד זה רץ בשרת Node.js מאובטח ב-Vercel

export default async function handler(req, res) {
  
  // 1. הגדרות אבטחה (CORS) - מתאים ל-Node.js
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. טיפול בבקשת "preflight" (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // 3. רק בקשות POST ימשיכו מפה
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    // 4. קבלת הנתונים מהתוסף
    const { postText, tone } = req.body;

    // 5. קריאה מאובטחת למפתח ה-API
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      throw new Error("מפתח API של ג'מיני לא הוגדר בשרת");
    }
    
    // 6. בניית הפרומפט הדינמי (עם ניר אידלמן)
    let prompt;

    if (tone === 'ניר אידלמן') {
      prompt = `
        אתה יועץ מכירות בכיר וסמכותי בסגנון של ניר אידלמן.
        האמונה המרכזית שלך היא "למכור בלי לשכנע" ו"אבחון על פני שכנוע".
        התגובות שלך הן ישירות, מקצועיות, ומאתגרות תפיסות.
        הפוסט המקורי הוא:
        ---
        ${postText}
        ---
        הנחיות לכתיבת התגובה שלך:
        1. אל תהיה "נחמד" או מסכים מיד: הימנע ממשפטים כמו "פוסט מעולה!".
        2. היה אבחוני (Diagnostic): התייחס לפוסט כמו רופא שמאבחן.
        3. אתגר את התפיסה: שאל שאלה נוקבת או הצג זווית ראייה הפוכה.
        4. שמור על סמכותיות וישירות: כתוב קצר (2-3 משפטים).
        כתוב את התגובה בעברית:
      `;
    } else {
      prompt = `
        אתה מומחה AI לכתיבת תגובות ברשת החברתית לינקדאין.
        הפוסט המקורי הוא:
        ---
        ${postText}
        ---
        הנחיות לכתיבת התגובה:
        1. סגנון: ${tone}.
        2. שמור על תגובה קצרה וממוקדת (2-3 משפטים).
        3. הוסף ערך לדיון.
        4. התגובה צריכה להיות בעברית.
        כתוב את התגובה בלבד:
      `;
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    // 7. שליחת הבקשה לג'מיני
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('שגיאה מג'מיני:', errorData);
      throw new Error('שגיאה בפנייה ל-API של ג\'מיני');
    }

    const data = await response.json();
    const comment = data.candidates[0].content.parts[0].text.trim();

    // 8. שליחת התגובה בחזרה לתוסף כרום
    res.status(200).json({ comment: comment });

  } catch (error) {
    // 9. טיפול בשגיאות
    console.error('שגיאה ב-Function:', error);
    res.status(500).json({ error: error.message });
  }
}

