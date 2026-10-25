import { WEATHER, cropFor, plotStage } from "@/lib/data";
import { computeWaterBalance, type BalancePoint } from "@/lib/et";
import type { Plot } from "@/lib/types";

/**
 * Local adapter around the FAO-56 engine so UI components don't need to know
 * how the weather series or crop coefficients are resolved.
 */
export function waterBalanceFor(plot: Plot, weather = WEATHER): BalancePoint[] {
  const crop = cropFor(plot);
  const stage = plotStage(plot);
  return computeWaterBalance(plot, crop, weather, stage.kc);
}
