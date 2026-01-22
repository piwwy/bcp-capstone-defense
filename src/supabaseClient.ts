import { createClient } from '@supabase/supabase-js';

// PALITAN MO ITO NG GALING SA SUPABASE SETTINGS MO
const supabaseUrl = 'Yhttps://sjeivhzlmywyncfiyuwn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZWl2aHpsbXl3eW5jZml5dXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTI0NDUsImV4cCI6MjA4NDU2ODQ0NX0.JvjBt2jYkc1oowTAGmWC_GkNWnSCxv5GhDZhv49G73g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);