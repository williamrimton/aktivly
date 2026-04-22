import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get all recurring activities
  const { data: recurringActivities, error: fetchError } = await supabase
    .from("activities")
    .select("*")
    .eq("is_recurring", true)
    .is("parent_activity_id", null);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const createdEvents: string[] = [];

  for (const activity of recurringActivities || []) {
    // Calculate next occurrences within 7 days from now
    const startDate = new Date(activity.date);
    const endDate = activity.recurrence_end_date ? new Date(activity.recurrence_end_date) : null;
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Generate all future dates
    let candidate = new Date(startDate);
    const datesToCreate: string[] = [];

    while (candidate <= sevenDaysFromNow) {
      if (candidate >= now && (!endDate || candidate <= endDate)) {
        datesToCreate.push(candidate.toISOString().split("T")[0]);
      }
      if (activity.recurrence_type === "weekly") {
        candidate = new Date(candidate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else {
        candidate = new Date(candidate);
        candidate.setMonth(candidate.getMonth() + 1);
      }
    }

    // Check which dates already have child events
    for (const dateStr of datesToCreate) {
      const { data: existing } = await supabase
        .from("activities")
        .select("id")
        .eq("parent_activity_id", activity.id)
        .eq("date", dateStr)
        .maybeSingle();

      if (!existing) {
        // Create the child event
        const { data: newEvent, error: insertError } = await supabase
          .from("activities")
          .insert({
            user_id: activity.user_id,
            title: activity.title,
            description: activity.description,
            date: dateStr,
            time: activity.time,
            location: activity.location,
            max_participants: activity.max_participants,
            is_recurring: false,
            parent_activity_id: activity.id,
          })
          .select("id")
          .single();

        if (!insertError && newEvent) {
          createdEvents.push(newEvent.id);

          // Copy invitees as participants with pending status
          const { data: invitees } = await supabase
            .from("activity_invitees")
            .select("*")
            .eq("activity_id", activity.id);

          if (invitees && invitees.length > 0) {
            await supabase.from("participants").insert(
              invitees.map((inv) => ({
                activity_id: newEvent.id,
                name: inv.name,
                email: inv.email,
                status: "pending",
              }))
            );
          }
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ created: createdEvents.length, eventIds: createdEvents }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
