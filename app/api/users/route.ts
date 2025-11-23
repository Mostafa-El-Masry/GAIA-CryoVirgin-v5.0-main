import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { GaiaUser, GaiaUserPermissions, GaiaUserRole } from '@/lib/users/types';

function mapRowToUser(row: any): GaiaUser {
  const perms: GaiaUserPermissions = {
    canViewGalleryPrivate: true,
    canViewWealth: true,
    canViewHealth: true,
    canViewGuardian: true,
    ...(row.permissions_json || {}),
  };

  return {
    id: String(row.id),
    displayName: row.display_name ?? '',
    email: row.email ?? null,
    role: (row.role as GaiaUserRole) ?? 'member',
    permissions: perms,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

// GET /api/users
//   → list all GAIA internal users (for Settings > Users)
export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('gaia_users')
      .select('id, display_name, email, role, permissions_json, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Users] GET error', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to load users.' },
        { status: 500 }
      );
    }

    const users: GaiaUser[] = (data ?? []).map(mapRowToUser);
    return NextResponse.json({ ok: true, users });
  } catch (err: any) {
    console.error('[Users] GET unexpected error', err);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

// POST /api/users
//   Body: { displayName, email?, role?, permissions? }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const displayName = String(body.displayName ?? '').trim();
    const email =
      body.email === null || body.email === undefined
        ? null
        : String(body.email).trim();
    const role = (body.role as GaiaUserRole | undefined) ?? 'member';
    const permissions = (body.permissions ?? {}) as Partial<GaiaUserPermissions>;

    if (!displayName) {
      return NextResponse.json(
        { ok: false, error: 'displayName is required.' },
        { status: 400 }
      );
    }

    const perms: GaiaUserPermissions = {
      canViewGalleryPrivate: permissions.canViewGalleryPrivate ?? true,
      canViewWealth: permissions.canViewWealth ?? true,
      canViewHealth: permissions.canViewHealth ?? true,
      canViewGuardian: permissions.canViewGuardian ?? true,
    };

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('gaia_users')
      .insert({
        display_name: displayName,
        email,
        role,
        permissions_json: perms,
      })
      .select('id, display_name, email, role, permissions_json, created_at')
      .limit(1);

    if (error || !data || data.length === 0) {
      console.error('[Users] POST error', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to create user.' },
        { status: 500 }
      );
    }

    const user = mapRowToUser(data[0]);
    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    console.error('[Users] POST unexpected error', err);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

// PUT /api/users
//   Body: { id, displayName?, email?, role?, permissions? }
export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id ?? '').trim();
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'id is required.' },
        { status: 400 }
      );
    }

    const patch: any = {};
    if (body.displayName !== undefined) {
      patch.display_name = String(body.displayName ?? '').trim();
    }
    if (body.email !== undefined) {
      patch.email =
        body.email === null || body.email === ''
          ? null
          : String(body.email).trim();
    }
    if (body.role !== undefined) {
      patch.role = String(body.role);
    }
    if (body.permissions !== undefined) {
      patch.permissions_json = body.permissions;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Nothing to update.' },
        { status: 400 }
      );
    }

    patch.updated_at = new Date().toISOString();

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('gaia_users')
      .update(patch)
      .eq('id', id)
      .select('id, display_name, email, role, permissions_json, created_at')
      .limit(1);

    if (error || !data || data.length === 0) {
      console.error('[Users] PUT error', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update user.' },
        { status: 500 }
      );
    }

    const user = mapRowToUser(data[0]);
    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    console.error('[Users] PUT unexpected error', err);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

// DELETE /api/users
//   Body: { id }
export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id ?? '').trim();
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'id is required.' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    const { error } = await supabase.from('gaia_users').delete().eq('id', id);

    if (error) {
      console.error('[Users] DELETE error', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to delete user.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[Users] DELETE unexpected error', err);
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
