// קוד זה רץ בשרת מאובטח (Vercel)
// הוא מקבל את הפוסט מהתוסף, ושולח אותו לג'מיני עם המפתח הסודי שלך

// הפונקציה הראשית שמטפלת בבקשות
export default async function handler(req) {
  
  // 1. הגדרות אבטחה (CORS)
  const headers = {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 2. קבלת הנתונים מהתוסף
    const { postText, tone } = await req.json();

    // 3. קריאה מאובטחת למפתח ה-API
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      throw new Error("מפתח API של ג'מיני לא הוגדר בשרת");
    }
    
    // 4. === בניית הפרומפט הדינמי (החלק החדש!) ===
    let prompt;

    if (tone === 'ניר אידלמן') {
      // --- פרומפט מיוחד לניר אידלמן ---
      prompt = `
        אתה יועץ מכירות בכיר וסמכותי בסגנון של ניר אידלמן.
        האמונה המרכזית שלך היא "למכור בלי לשכנע" ו"אבחון על פני שכנוע".
        התגובות שלך הן ישירות, מקצועיות, ומאתגרות תפיסות.

        הפוסט המקורי הוא:
        ---
        ${postText}
        ---
        
        הנחיות לכתיבת התגובה שלך:
        1.  **אל תהיה "נחמד" או מסכים מיד:** הימנע ממשפטים כמו "פוסט מעולה!", "מסכים לחלוטין!" או "בול!". זה לא הסגנון.
        2.  **היה אבחוני (Diagnostic):** התייחס לפוסט כמו רופא שמאבחן מטופל. המטרה שלך היא לא להסכים, אלא לאבחן את הבעיה או התהליך המתואר.
        3.  **אתגר את התפיסה:** שאל שאלה נוקבת או הצג זווית ראייה הפוכה שמאתגרת את מה שנאמר בפוסט (בצורה מקצועית).
        4.  **התמקד בלקוח/בתהליך:** העבר את המיקוד מהמוצר או מה"טריק" המתואר בפוסט, בחזרה אל אבחון הלקוח או אל תהליך המכירה המקצועי.
        5.  **שמור על סמכותיות וישירות:** כתוב קצר (2-3 משפטים), ישיר, ובביטחון.

        כתוב את התגובה בעברית, בסגנון הישיר והסמכותי הזה:
      `;
    } else {
      // --- הפרומפט הרגיל לכל שאר הטונים ---
      prompt = `
        אתה מומחה AI לכתיבת תגובות ברשת החברתית לינקדאין.
        המשתמש רוצה שתגיב לפוסט הבא:
        ---
        ${postText}
        ---
        
        הנחיות לכתיבת התגובה:
        1.  סגנון: ${tone} (לדוגמה: מקצועי, סמכותי, ידידותי, מעורר השראה, מצחיק).
        2.  שמור על תגובה קצרה וממוקדת (2-3 משפטים).
        3.  הוסף ערך לדיון. אל תכתוב רק "מסכים" או "פוסט נהדר" (אלא אם הסגנון הוא "ידידותי").
        4.  התגובה צריכה להיות בעברית.

        כתוב את התגובה בלבד:
      `;
    }
    // === סוף החלק החדש ===

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
    console.error('שגיאה ב-Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: headers,
    });
  }
}
