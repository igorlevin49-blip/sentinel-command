import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
  if (!GITHUB_TOKEN) {
    // Graceful degradation — no error, just skip
    return new Response(
      JSON.stringify({ ok: false, message: 'GitHub token not configured. Auto-check skipped.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all github links
  const { data: links, error: linksErr } = await supabase
    .from('delivery_github_links')
    .select('id, item_id, repo, issue_number, pr_number, url');

  if (linksErr) {
    return new Response(JSON.stringify({ ok: false, error: linksErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const results: { link_id: string; status: string; detail?: string }[] = [];

  for (const link of (links ?? [])) {
    try {
      // Check issue state
      if (link.issue_number) {
        const ghRes = await fetch(
          `https://api.github.com/repos/${link.repo}/issues/${link.issue_number}`,
          { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'SOMS-Tracker/1.0' } }
        );
        if (ghRes.ok) {
          const issue = await ghRes.json();
          // Upsert a github check for this item
          await supabase.from('delivery_checks').upsert(
            {
              item_id: link.item_id,
              kind: 'github',
              title: `Issue #${link.issue_number}: ${issue.title ?? ''}`,
              is_done: issue.state === 'closed',
              evidence_url: issue.html_url,
              last_verified_at: new Date().toISOString(),
            },
            // Match by item_id + kind + title prefix — use insert if not already there
          );
          // Auto-resolve 'needs_github_action' alerts if issue is closed
          if (issue.state === 'closed') {
            await supabase
              .from('delivery_alerts')
              .update({ is_active: false, resolved_at: new Date().toISOString() })
              .eq('item_id', link.item_id)
              .eq('type', 'needs_github_action')
              .eq('is_active', true);
          }
          results.push({ link_id: link.id, status: 'ok', detail: `issue state: ${issue.state}` });
        }
      }

      // Check PR state
      if (link.pr_number) {
        const ghRes = await fetch(
          `https://api.github.com/repos/${link.repo}/pulls/${link.pr_number}`,
          { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'SOMS-Tracker/1.0' } }
        );
        if (ghRes.ok) {
          const pr = await ghRes.json();
          await supabase.from('delivery_checks').upsert({
            item_id: link.item_id,
            kind: 'github',
            title: `PR #${link.pr_number}: ${pr.title ?? ''}`,
            is_done: pr.merged === true,
            evidence_url: pr.html_url,
            last_verified_at: new Date().toISOString(),
          });
          results.push({ link_id: link.id, status: 'ok', detail: `pr merged: ${pr.merged}` });
        }
      }
    } catch (e) {
      results.push({ link_id: link.id, status: 'error', detail: String(e) });
    }
  }

  return new Response(
    JSON.stringify({ ok: true, checked: results.length, results }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
