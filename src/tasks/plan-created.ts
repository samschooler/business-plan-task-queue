import { createClient } from "@supabase/supabase-js";
import { requestOverview } from "../functions/request-overview";
import { requestMission } from "../functions/request-mission";
import { requestTargetAudience } from "../functions/request-target-audiance";
import { requestMarketNeed } from "../functions/request-market-need";
import { requestCoreProductFeatures } from "../functions/request-core-product-features";
import { requestCoreRevenueModel } from "../functions/request-core-revenue-model";
import { requestRevenueProjection } from "../functions/request-revenue-projection";
import { requestCompanySentence } from "../functions/request-company-sentence";

export default async function async(payload: {
  short_code: string;
  prompt: string;
}) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { short_code } = payload;

  const { data, error } = await supabase
    .from("plan")
    .select("prompt")
    .eq("short_code", short_code)
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  if (!data || !data.prompt) {
    console.log("no prompt found");
    throw new Error("no prompt found");
  }

  const overview = await requestOverview(data.prompt);

  if (!overview) {
    return;
  }

  await supabase.from("plan").update({ overview }).eq("short_code", short_code);

  const companySentence = await requestCompanySentence(overview);

  await supabase
    .from("plan")
    .update({ name: companySentence })
    .eq("short_code", short_code);

  const mission = await requestMission(overview);

  await supabase.from("plan").update({ mission }).eq("short_code", short_code);

  const targetAudience = await requestTargetAudience(overview);

  await supabase
    .from("plan")
    .update({ target_audience: targetAudience })
    .eq("short_code", short_code);

  const marketNeed = await requestMarketNeed(overview);

  await supabase
    .from("plan")
    .update({ market_need: marketNeed })
    .eq("short_code", short_code);

  const coreProductFeatures = await requestCoreProductFeatures(overview);

  await supabase
    .from("plan")
    .update({ core_product_features: coreProductFeatures })
    .eq("short_code", short_code);

  const coreRevenueModel = await requestCoreRevenueModel(overview);

  await supabase
    .from("plan")
    .update({ core_revenue_model: coreRevenueModel })
    .eq("short_code", short_code);

  const revProjection = await requestRevenueProjection(coreRevenueModel);

  await supabase
    .from("plan")
    .update({ revenue_projection: revProjection })
    .eq("short_code", short_code);
}
