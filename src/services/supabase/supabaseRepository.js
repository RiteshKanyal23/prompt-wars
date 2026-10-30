import { createReferenceCode } from '@/lib/referenceCode';
import { assertTransition } from '@/lib/workflow';
import { analyzeReport } from '@/services/ai/pipeline';
import { computeClusters } from '@/services/ai/clusters';
import { supabase } from './client';
import { mapReport, toRow } from './mappers';

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Use local demo mode instead.');
  }
  return supabase;
}

async function currentUserId() {
  const client = requireClient();
  const { data } = await client.auth.getUser();
  return data?.user?.id ?? null;
}

function mapEvent(row) {
  return {
    id: String(row.id),
    reportId: row.report_id,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    type: row.type,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    isPublic: row.is_public,
    note: row.note,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function mapDuplicate(row) {
  return {
    id: String(row.id),
    reportId: row.report_id,
    duplicateOf: row.duplicate_of,
    similarity: Number(row.similarity ?? 0),
    components: row.components ?? {},
    level: row.level,
    status: row.status,
    reason: row.reason,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

export const supabaseRepository = {
  mode: 'supabase',

  async listReports(filters = {}) {
    const client = requireClient();
    let query = client.from('reports').select('*');

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.band) query = query.eq('priority_band', filters.band);
    if (filters.clusterKey) query = query.eq('cluster_key', filters.clusterKey);
    if (filters.search) {
      const term = String(filters.search).replace(/[%,()]/g, ' ');
      query = query.or(
        `reference_code.ilike.%${term}%,title.ilike.%${term}%,description.ilike.%${term}%,location_label.ilike.%${term}%`,
      );
    }

    const { data, error } = await query
      .order('priority_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(filters.limit ?? 500);

    if (error) throw error;
    return (data ?? []).map(mapReport);
  },

  async getReportById(id) {
    const client = requireClient();
    const { data, error } = await client.from('reports').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapReport(data) : null;
  },

  async getReportByCode(code) {
    const client = requireClient();
    const { data, error } = await client
      .from('reports')
      .select('*')
      .eq('reference_code', String(code).trim().toUpperCase())
      .maybeSingle();
    if (error) throw error;
    return data ? mapReport(data) : null;
  },

  async listEvents(reportId, { publicOnly = false } = {}) {
    const client = requireClient();
    let query = client.from('report_events').select('*').eq('report_id', reportId);
    if (publicOnly) query = query.eq('is_public', true);

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  },

  async createReport(input) {
    const client = requireClient();
    const existing = await this.listReports({ limit: 500 });
    const citizenId = await currentUserId();
    const now = new Date().toISOString();

    const draft = {
      id: crypto.randomUUID(),
      referenceCode: createReferenceCode(),
      citizenId,
      title: input.title?.trim() || null,
      description: input.description.trim(),
      category: input.category === 'auto' ? 'other' : input.category,
      locationLabel: input.locationLabel?.trim() || null,
      latitude: Number(input.latitude),
      longitude: Number(input.longitude),
      imageUrl: input.imageUrl ?? null,
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    };

    const ai = analyzeReport(draft, existing);
    const finalCategory = input.category === 'auto' ? ai.category : draft.category;

    const row = {
      ...toRow({ ...draft, category: finalCategory }),
      priority_score: ai.priority.score,
      priority_band: ai.priority.band,
      cluster_key: ai.cluster?.key ?? null,
      ai,
      ai_version: ai.version,
    };

    const { data, error } = await client.from('reports').insert(row).select('*').single();
    if (error) throw error;

    await client.from('report_events').insert([
      {
        report_id: data.id,
        actor_id: citizenId,
        actor_role: 'citizen',
        type: 'created',
        is_public: true,
        note: 'Report received',
      },
      {
        report_id: data.id,
        actor_role: 'system',
        type: 'ai_processed',
        is_public: true,
        note: `AI ${ai.version}: ${ai.category} · ${ai.priority.band}`,
        metadata: { version: ai.version, ms: ai.processingMs },
      },
    ]);

    if (input.contact?.name || input.contact?.phone) {
      await client.from('report_contacts').insert({
        report_id: data.id,
        name: input.contact.name || null,
        phone: input.contact.phone || null,
      });
    }

    const pairs = ai.duplicates
      .filter((candidate) => candidate.level !== 'low')
      .map((candidate) => ({
        report_id: data.id,
        duplicate_of: candidate.reportId,
        similarity: candidate.score,
        components: candidate.components,
        level: candidate.level,
        status: 'pending',
      }));

    if (pairs.length > 0) {
      await client.from('report_duplicates').insert(pairs);
    }

    return mapReport(data);
  },

  async updateReport(id, patch, event = null) {
    const client = requireClient();
    if (patch.status) {
      const { data: current, error: currentError } = await client
        .from('reports')
        .select('status')
        .eq('id', id)
        .maybeSingle();
      if (currentError) throw currentError;
      if (current?.status && current.status !== patch.status) {
        assertTransition(current.status, patch.status);
      }
    }
    const { data, error } = await client
      .from('reports')
      .update(toRow(patch))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    if (event) {
      const { error: eventError } = await client.from('report_events').insert({
        report_id: id,
        actor_role: event.actorRole ?? 'operator',
        type: event.type ?? 'status_changed',
        from_status: event.fromStatus ?? null,
        to_status: event.toStatus ?? null,
        is_public: event.isPublic ?? true,
        note: event.note ?? null,
        metadata: event.metadata ?? {},
      });
      if (eventError) throw eventError;
    }

    return mapReport(data);
  },

  async listDuplicatePairs() {
    const client = requireClient();
    const { data, error } = await client
      .from('report_duplicates')
      .select('*')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapDuplicate);
  },

  async reviewDuplicate(pairId, decision, reason = '') {
    const client = requireClient();
    const { data, error } = await client
      .from('report_duplicates')
      .update({ status: decision, reason, reviewed_at: new Date().toISOString() })
      .eq('id', pairId)
      .select('*')
      .single();
    if (error) throw error;

    const pair = mapDuplicate(data);
    if (decision === 'confirmed') {
      await this.updateReport(
        pair.reportId,
        {
          status: 'duplicate',
          duplicateOf: pair.duplicateOf,
          duplicateConfirmed: true,
        },
        {
          type: 'duplicate_confirmed',
          note: reason || 'Linked to an existing report',
          isPublic: true,
        },
      );

      await this.updateReport(pair.duplicateOf, {}, {
        type: 'duplicate_confirmed',
        note: 'Another report was linked to this issue',
        isPublic: true,
        metadata: { duplicateReportId: pair.reportId },
      });
    }

    return pair;
  },

  async listClusters() {
    return computeClusters(await this.listReports({ limit: 500 }));
  },

  async listRecentCodes() {
    return [];
  },

  async rememberCode() {
    // Recent codes are a local demo convenience when there is no account.
    return [];
  },

  async clearRecentCodes() {},

  async reset() {
    throw new Error('Reset is only available in local demo mode');
  },
};
