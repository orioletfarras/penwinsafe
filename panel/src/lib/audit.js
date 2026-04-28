import { supabase } from './supabase'
import { currentUser } from './orgStore'

export async function logAction(action, targetName = '', details = '') {
  try {
    await supabase.from('audit_log').insert({
      action,
      target_name: targetName || null,
      details: details || null,
      user_id: currentUser.value?.id || null,
      user_email: currentUser.value?.email || null,
    })
  } catch (_) {}
}
