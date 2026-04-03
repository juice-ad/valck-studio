import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "Missing project_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify project belongs to user (RLS enforces this)
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("vercel_project_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project?.vercel_project_id) {
      return new Response(
        JSON.stringify({ error: "Project not found or no Vercel link" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch deployments from Vercel API
    const vercelToken = Deno.env.get("VERCEL_TOKEN");
    if (!vercelToken) {
      return new Response(
        JSON.stringify({ error: "Vercel not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const vercelRes = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${project.vercel_project_id}&limit=5&state=READY,BUILDING,ERROR`,
      {
        headers: { Authorization: `Bearer ${vercelToken}` },
      }
    );

    if (!vercelRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch deployments" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const vercelData = await vercelRes.json();

    // Return sanitized deployment data (only what the client needs)
    const deployments = (vercelData.deployments ?? []).map(
      (d: Record<string, unknown>) => ({
        uid: d.uid,
        url: `https://${d.url}`,
        state: d.state,
        created: d.created,
        meta: {
          githubCommitMessage:
            (d.meta as Record<string, unknown>)?.githubCommitMessage ?? null,
        },
      })
    );

    return new Response(JSON.stringify({ deployments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
