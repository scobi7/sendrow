import { Nanum_Pen_Script } from "next/font/google";

/** Handwritten notes on the homepage only. Nothing else uses this face. */
export const penScript = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
