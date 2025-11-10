
// הפונקציה הראשית שמטפלת בבקשות
export default async function handler(req) {
  
  // 1. הגדרות אבטחה (CORS) - מאפשר רק לתוסף שלך לגשת
  // חשוב! בעתיד תחליף את ה-'*' בכתובת הכרום-אקסטנשן שלך
  const headers = {
    'Access-Control-Allow-Origin': '*', // כרגע מאפשר לכולם, נשנה בהמשך
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Vercel דורש טיפול בבקשת OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // 2. קבלת הנתונים מהתוסף (מה-background.js)
  try {
    const { postText, tone } = await req.json();

    // 3. קריאה מאובטחת למפתח ה-API שלך (שנשמור ב-Vercel)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      throw new Error("מפתח API של ג'מיני לא הוגדר בשרת");
    }
    
    // 4. בניית הפרומפט המדויק לג'מיני
    const prompt = `
      אתה מומחה AI לכתיבת תגובות ברשת החברתית לינקדאין.
      המשתמש רוצה שתגיב לפוסט הבא:
      ---
      ${postText}
      ---
      
      הנחיות לכתיבת התגובה:
      1. סגנון: ${tone} (לדוגמה: מקצועי, סמכותי, ידידותי, מעורר השראה, מצחיק).
      2. שמור על תגובה קצרה וממוקדת (2-3 משפטים).
      3. הוסף ערך לדיון. אל תכתוב רק "מסכים" או "פוסט נהדר".
      4. התגובה צריכה להיות בעברית.

      כתוב את התגובה בלבד:
    `;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    // 5. שליחת הבקשה לג'מיני
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
    
    // 6. חילוץ התגובה הנקייה
    const comment = data.candidates[0].content.parts[0].text.trim();

    // 7. שליחת התגובה בחזרה לתוסף כרום
    return new Response(JSON.stringify({ comment: comment }), {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    // 8. טיפול בשגיאות
    console.error('שגיאה ב-Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: headers,
    });
  }

}
