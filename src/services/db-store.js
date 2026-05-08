import { getSupabase } from './supabase';

const TABLE = 'sw_projects';

export async function ensureUserProfile(user) {
  if (!user?.id) return null;
  const sb = await getSupabase();
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
  const avatarUrl = user.user_metadata?.avatar_url || '';
  const { data, error } = await sb
    .from('sw_profiles')
    .upsert({
      id: user.id,
      email: user.email || '',
      full_name: fullName,
      avatar_url: avatarUrl,
    }, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function loadUserProjects(userId) {
  const sb = await getSupabase();
  const { data, error } = await sb
    .from(TABLE)
    .select('id, name, data, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;

  return (data || []).map(row => ({
    ...row.data,
    id:        row.id,
    name:      row.name,
    _dbId:     row.id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

// Upsert a project. Returns the db id.
export async function saveProjectToDB(userId, project) {
  const sb = await getSupabase();
  const { _dbId, name, ...rest } = project;
  const payload = { user_id: userId, name, data: { ...rest, name } };

  if (_dbId) {
    const { error } = await sb.from(TABLE).update(payload).eq('id', _dbId).eq('user_id', userId);
    if (error) throw error;
    return _dbId;
  } else {
    const { data, error } = await sb.from(TABLE).insert(payload).select('id').single();
    if (error) throw error;
    return data.id;
  }
}

export async function deleteProjectFromDB(userId, dbId) {
  const sb = await getSupabase();
  const { error } = await sb.from(TABLE).delete().eq('id', dbId).eq('user_id', userId);
  if (error) throw error;
}
