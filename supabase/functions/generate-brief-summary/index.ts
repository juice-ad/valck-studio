import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth: verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin only" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request
    const { briefId } = await req.json();
    if (!briefId) {
      return new Response(
        JSON.stringify({ error: "briefId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch brief (use service role for unrestricted access)
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: brief, error: briefError } = await serviceSupabase
      .from("discovery_briefs")
      .select("*")
      .eq("id", briefId)
      .single();

    if (briefError || !brief) {
      return new Response(
        JSON.stringify({ error: "Brief not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build structured input from brief fields
    const briefSections = [];

    if (brief.business_name || brief.business_description) {
      briefSections.push(
        `## Bedrijf\n` +
          `- Naam: ${brief.business_name || "Niet ingevuld"}\n` +
          `- Beschrijving: ${brief.business_description || "Niet ingevuld"}\n` +
          `- Website: ${brief.website_url || "Niet ingevuld"}\n` +
          `- Branche: ${brief.industry || "Niet ingevuld"}\n` +
          `- Teamgrootte: ${brief.team_size || "Niet ingevuld"}\n` +
          `- Jaaromzet: ${brief.annual_revenue || "Niet ingevuld"}\n` +
          `- Ambitie: ${brief.ambition || "Niet ingevuld"}\n` +
          `- Verdienmodel: ${brief.revenue_model || "Niet ingevuld"}`
      );
    }

    if (
      brief.current_tools ||
      brief.time_consuming_tasks ||
      brief.manual_data_transfers
    ) {
      briefSections.push(
        `## Werkwijze & Tools\n` +
          `- Huidige tools: ${brief.current_tools || "Niet ingevuld"}\n` +
          `- Maandelijkse toolkosten: ${brief.monthly_tool_costs || "Niet ingevuld"}\n` +
          `- Tijdrovende taken: ${brief.time_consuming_tasks || "Niet ingevuld"}\n` +
          `- Admin uren per week: ${brief.admin_hours_weekly || "Niet ingevuld"}\n` +
          `- Handmatige data-overdracht: ${brief.manual_data_transfers || "Niet ingevuld"}`
      );
    }

    if (brief.top_frustrations || brief.should_be_automatic) {
      briefSections.push(
        `## Pijnpunten\n` +
          `- Top frustraties: ${brief.top_frustrations || "Niet ingevuld"}\n` +
          `- Wat faalt onder druk: ${brief.failure_under_pressure || "Niet ingevuld"}\n` +
          `- Klanten verloren door workflow: ${brief.lost_clients_due_to_workflow || "Niet ingevuld"}\n` +
          `- Moet automatisch zijn: ${brief.should_be_automatic || "Niet ingevuld"}`
      );
    }

    if (brief.growth_blockers || brief.breaks_at_2x_clients) {
      briefSections.push(
        `## Groei\n` +
          `- Groeiblokkers: ${brief.growth_blockers || "Niet ingevuld"}\n` +
          `- Wat breekt bij 2x klanten: ${brief.breaks_at_2x_clients || "Niet ingevuld"}\n` +
          `- Gedeeld platform nodig: ${brief.needs_shared_platform || "Niet ingevuld"}`
      );
    }

    if (brief.automation_priority || brief.budget_range) {
      briefSections.push(
        `## Prioriteiten\n` +
          `- #1 automatiseren: ${brief.automation_priority || "Niet ingevuld"}\n` +
          `- Gewenste timeline: ${brief.desired_timeline || "Niet ingevuld"}\n` +
          `- Budget: ${brief.budget_range || "Niet ingevuld"}\n` +
          `- Dealbreakers: ${brief.dealbreakers || "Niet ingevuld"}`
      );
    }

    if (
      (brief.selected_features && brief.selected_features.length > 0) ||
      brief.brand_colors ||
      brief.brand_notes
    ) {
      briefSections.push(
        `## Inspiratie & Features\n` +
          `- Geselecteerde features: ${brief.selected_features?.join(", ") || "Geen"}\n` +
          `- Inspiratie URLs: ${brief.inspiration_urls?.join(", ") || "Geen"}\n` +
          `- Merkkleuren: ${brief.brand_colors || "Niet ingevuld"}\n` +
          `- Stijlnotities: ${brief.brand_notes || "Niet ingevuld"}`
      );
    }

    if (brief.additional_notes) {
      briefSections.push(
        `## Extra notities\n${brief.additional_notes}`
      );
    }

    const briefText = briefSections.join("\n\n");

    // Call Claude API
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const claudeResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: `Je bent een business analyst bij Valck Studio. Hieronder staat de discovery brief van een klant. Schrijf een beknopte, professionele samenvatting in het Nederlands die:

1. Het bedrijf en hun situatie beschrijft (2-3 zinnen)
2. De belangrijkste pijnpunten en uitdagingen benoemt (bullet points)
3. De kansen en mogelijke oplossingsrichtingen schetst (bullet points)
4. Een aanbeveling geeft voor de scope van het project (2-3 zinnen)

Houd het concreet, vermijd jargon, en focus op wat voor de klant het belangrijkst is. Gebruik geen headers met ##, gebruik vetgedrukte tekst (**) voor secties.

---

${briefText}`,
            },
          ],
        }),
      }
    );

    if (!claudeResponse.ok) {
      const errorBody = await claudeResponse.text();
      console.error("Claude API error:", errorBody);
      return new Response(
        JSON.stringify({ error: "Failed to generate summary" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const claudeData = await claudeResponse.json();
    const summary =
      claudeData.content?.[0]?.text ?? "Kon geen samenvatting genereren.";

    // Store summary in database
    const { error: updateError } = await serviceSupabase
      .from("discovery_briefs")
      .update({
        ai_summary: summary,
        ai_summary_generated_at: new Date().toISOString(),
      })
      .eq("id", briefId);

    if (updateError) {
      console.error("DB update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save summary" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ summary, generated_at: new Date().toISOString() }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("generate-brief-summary error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
