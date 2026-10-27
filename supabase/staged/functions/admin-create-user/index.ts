// STAGED — not deployed. Replaces supabase/functions/admin-create-user/index.ts
// Requires staged SQL: replace_user_roles.
// - Validates everything BEFORE creating the auth user.
// - Only a real super_admin may create super_admin.
// - Any provisioning failure deletes the new auth user again (compensation) and returns an error.
// - No e-mail/name/phone in logs.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { json, requireCaller, serviceClient } from '../_shared/caller.ts';
import { authorizeCreateRoles, validateCreateUserBody } from '../_shared/policies.ts';

function generateStrongPassword(length = 24): string {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*()-_=+'];
  const all = groups.join('');
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  const chars = groups.map((g, i) => g[bytes[i] % g.length]);
  for (let i = groups.length; i < length; i++) chars.push(all[bytes[i] % all.length]);
  const shuffle = new Uint32Array(chars.length);
  crypto.getRandomValues(shuffle);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = shuffle[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    const admin = serviceClient();
    const caller = await requireCaller(req, admin);
    if (caller instanceof Response) return caller;

    const raw = await req.json().catch(() => null);
    const v = validateCreateUserBody(raw);
    if (!v.ok) return json(400, { error: v.code, code: v.code });
    const input = v.value;

    const decision = authorizeCreateRoles(caller.roles, input.roles);
    if (!decision.ok) return json(decision.status, { error: decision.code });

    const userData = ((raw as Record<string, unknown>).userData ?? {}) as Record<string, unknown>;
    const email = input.email ?? `vikar-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@temp.local`;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: input.isTemporary ? generateStrongPassword() : input.password!,
      email_confirm: true,
      user_metadata: { name: input.name, is_temporary: input.isTemporary },
    });
    if (createError || !created?.user?.id) {
      const msg = (createError?.message ?? '').toLowerCase();
      const code = (createError as { code?: string } | null)?.code;
      if (code === 'email_exists' || msg.includes('already been registered') || msg.includes('user already registered')) {
        return json(409, { error: 'En bruger med denne email findes allerede i systemet. Find brugeren under "Brugere" og tildel afdelingen i stedet.', code: 'email_exists' });
      }
      if (!input.isTemporary && (code === 'weak_password' || msg.includes('weak') || msg.includes('pwned'))) {
        return json(422, { error: 'Adgangskoden er for usikker eller kendt fra datalæk — vælg en anden adgangskode.', code: 'weak_password' });
      }
      if (msg.includes('password should be at least') || msg.includes('password is too short')) {
        return json(422, { error: 'Adgangskoden er for kort — vælg en længere adgangskode.', code: 'password_too_short' });
      }
      if (code === 'email_address_invalid' || msg.includes('invalid email')) {
        return json(400, { error: 'E-mailadressen er ugyldig — kontrollér stavningen.', code: 'email_invalid' });
      }
      console.error(`[admin-create-user ${requestId}] auth create failed`, code ?? 'unknown');
      return json(500, { error: 'Oprettelse mislykkedes. Prøv igen.', code: 'create_failed' });
    }
    const userId = created.user.id;

    const compensate = async (stage: string) => {
      console.error(`[admin-create-user ${requestId}] provisioning failed at ${stage}; rolling back`);
      await admin.from('user_roles').delete().eq('user_id', userId);
      await admin.from('profiles').delete().eq('id', userId);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) console.error(`[admin-create-user ${requestId}] ROLLBACK INCOMPLETE user=${userId}`);
      return json(500, { error: 'Brugeren kunne ikke oprettes fuldt ud og er rullet tilbage. Prøv igen.', code: 'provisioning_failed' });
    };

    // upsert: tolerates a profile row created by an auth trigger.
    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      name: input.name,
      email,
      phone: input.phone,
      job_title: typeof userData.job_title === 'string' ? userData.job_title : null,
      status: 'active',
      is_temporary: input.isTemporary,
      expires_at: input.isTemporary && typeof userData.expires_at === 'string' ? userData.expires_at : null,
      has_asbestos_certificate: !!userData.has_asbestos_certificate,
      has_pcb_certificate: !!userData.has_pcb_certificate,
      has_trailer_license: !!userData.has_trailer_license,
      has_forklift_license: !!userData.has_forklift_license,
      home_postcode: typeof userData.home_postcode === 'string' ? userData.home_postcode : null,
      home_address: typeof userData.home_address === 'string' ? userData.home_address : null,
      lat: typeof userData.lat === 'number' ? userData.lat : null,
      lng: typeof userData.lng === 'number' ? userData.lng : null,
    }, { onConflict: 'id' });
    if (profileError) return await compensate('profile');

    if (input.roles.length > 0) {
      const { error: roleError } = await admin.rpc('replace_user_roles', { p_user_id: userId, p_roles: input.roles });
      if (roleError) return await compensate('roles');
    }

    return json(200, { id: userId, user: { id: userId }, message: 'User created successfully', temporary: input.isTemporary });
  } catch (err) {
    console.error(`[admin-create-user ${requestId}] error`, (err as { message?: string })?.message);
    return json(500, { error: 'internal_error', requestId });
  }
});
