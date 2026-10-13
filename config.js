// Configuración de Supabase (producción)
const SUPABASE_URL = "https://snyvvbwkkqpecfcvvdid.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNueXZ2Yndra3FwZWNmY3Z2ZGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjc3MDYsImV4cCI6MjA4NDYwMzcwNn0.szk1Do5oUAEg6zsqBGAIWC43zULtB1rDtmF8O9i2i9s";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Prerrequisitos estándar para todos los proyectos, en orden del ciclo de vida.
// Se guardan por nombre, así que reordenar o añadir no afecta a los datos existentes.
const STANDARD_PREREQUISITES = [
    // Inicio
    "Business Case",
    "Cálculo de Ahorros",
    "Stakeholders",
    "Aprobaciones",
    // Planificación y diseño
    "Project Plan",
    "PDD",
    // Construcción y validación
    "Testing",
    "Dashboards",
    // Puesta en marcha y cierre
    "Comunicaciones",
    "Traspaso a BAU"
];

// Fases del ciclo de vida de un proyecto. El orden define el orden en tablas y selectores.
// BAU = el proyecto ha terminado y el mantenimiento lo llevamos nosotros.
// Si el BAU lo lleva otro equipo, el proyecto pasa de Hypercare a Cerrado.
const PROJECT_PHASES = ['Idea', 'En Progreso', 'On Hold', 'Hypercare', 'BAU', 'Cerrado'];

// Quién lleva el BAU una vez terminado el proyecto
const BAU_OWNERS = [
    { value: '', label: 'Sin definir' },
    { value: 'propio', label: 'Nuestro equipo' },
    { value: 'otro', label: 'Otro equipo' }
];
