"""Supabase client."""
import os
from supabase import create_client, Client

_supabase: Client = None

def get_db() -> Client:
    global _supabase
    if _supabase is None:
        # Service role bypasses Row Level Security -- correct for a trusted
        # server-side backend. Falls back to the anon key so the app still
        # runs before SUPABASE_SERVICE_ROLE_KEY is filled in, but RLS-locked
        # tables (see the setup SQL) will only actually work with the
        # service role key.
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
        _supabase = create_client(os.getenv("SUPABASE_URL"), key)
    return _supabase