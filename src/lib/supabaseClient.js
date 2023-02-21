
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_PROJECT,PUBLIC_SUPABASE_KEY  } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_PROJECT, PUBLIC_SUPABASE_KEY)
