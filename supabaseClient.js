import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iztyfcmfgcqcdbwpjuds.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_KWPljp8UX-r6bSWx5UfH-w_H2nlo4h6';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

