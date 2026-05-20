// Configuración de Supabase (producción)
const SUPABASE_URL = "https://snyvvbwkkqpecfcvvdid.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNueXZ2Yndra3FwZWNmY3Z2ZGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjc3MDYsImV4cCI6MjA4NDYwMzcwNn0.szk1Do5oUAEg6zsqBGAIWC43zULtB1rDtmF8O9i2i9s";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Prerrequisitos estándar para todos los proyectos
const STANDARD_PREREQUISITES = [
    "Business Case",
    "Stakeholders",
    "Cálculo de Ahorros",
    "Aprobaciones",
    "Project Plan",
    "Comunicaciones",
    "Traspaso a BAU",
    "Testing",
    "Dashboards"
];
