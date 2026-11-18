// הגדרות קליל. הסנכרון כבוי עד שמכניסים כאן פרטי פרויקט Supabase.
// ה-anon key של Supabase הוא מפתח ציבורי מעצם הגדרתו; ההגנה על הנתונים היא מדיניות ה-RLS שב-supabase/schema.sql.
// אסור לשים כאן את ה-service_role key.
window.KALIL_CONFIG = {
  sync: {
    enabled: false,
    supabaseUrl: '',      // לדוגמה: https://xxxxxxxx.supabase.co
    supabaseAnonKey: '',  // Project Settings → API → anon public
  },
};
