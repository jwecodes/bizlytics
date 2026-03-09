from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_KEY
import logging

logger = logging.getLogger(__name__)

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment")

# Single singleton — created once at startup, reused for all requests
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_supabase() -> Client:
    return supabase
