import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qnskmrlqsdwbtgnufwdm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuc2ttcmxxc2R3YnRnbnVmd2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NjM5MzUsImV4cCI6MjA4MTAzOTkzNX0.EZj_LQeTiOzonwprqkTRnqRCAHCSqVo1aRguxmzzFhw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
