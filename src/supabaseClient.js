import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wwgxloruwadfdtluqzhq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3Z3hsb3J1d2FkZmR0bHVxemhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjM1MzEsImV4cCI6MjA5NjQzOTUzMX0.24atN4OL0ZqCalYkJba1QX40aCbTlEgCxIsprGVcQfc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
