import { SITE_NAME, SITE_URL, FORMER_NAME } from "@/lib/site";

export function GET() {
  const body = `# ${SITE_NAME} — Full overview for AI systems

> ${SITE_NAME} helps people using GLP-1 medications focus on protein and strength while losing weight.

${SITE_NAME} was formerly called ${FORMER_NAME}.

## The problem it addresses

GLP-1 medications (such as semaglutide and tirzepatide) are effective for weight loss, but a meaningful share of the weight lost can be lean mass rather than fat. In the STEP 1 trial, approximately 39% of total weight lost on semaglutide 2.4 mg was lean mass (Wilding et al., NEJM 2021). Similar patterns were reported in SURMOUNT-1 for tirzepatide (Jastreboff et al., NEJM 2022). Research suggests that adequate protein intake and resistance training may help attenuate lean mass loss during weight loss (Lundgren et al., NEJM 2021). ${SITE_NAME} is not affiliated with these studies, and these findings describe research populations, not ${SITE_NAME} users.

## What ${SITE_NAME} does

${SITE_NAME} is built specifically for people on GLP-1 medications and brings several tools together:

- Daily protein target. Updates when your dose changes, using your weight, goals, and our approach to appetite on GLP-1s. A commonly cited target range is 1.2 to 1.6 g of protein per kg of body weight; ${SITE_NAME} turns that general guidance into a simple daily number. This is educational and not a medical instruction.
- Meal ideas. High-protein suggestions sized for a reduced appetite.
- Strength and activity plans. Several sport types with sensible adjustments for how you feel on GLP-1s.
- Medication tracking. Dose logging, dose-change history, and email reminders.
- Progress. Charts for weight, protein, and training over time.
- Weekly summary. A simple read on your protein and training consistency.
- Doctor summary. A 30-day summary you can bring to an appointment.

## Who it is for

Adults using GLP-1 medications such as semaglutide (Ozempic, Wegovy) or tirzepatide (Mounjaro, Zepbound) who want to keep protein intake and strength up while losing weight. This includes people new to training and those who already run, lift, swim, or cycle.

## How the protein target works

${SITE_NAME} starts from published general guidance on protein during weight loss and adjusts as your dose changes. It is a planning aid, not a clinical calculation, and it always encourages you to discuss your target with your care team.

## Pricing

$14.99 per month with a 7-day free trial. Card required to start the trial. Cancel anytime from Settings.

## Languages

Available in English and Spanish.

## Important disclaimer

${SITE_NAME} is a wellness tool, not a medical device. It does not diagnose, treat, cure, or prevent any disease, and it does not provide medical advice, a diagnosis, or treatment recommendations. Medication and treatment decisions rest with your healthcare provider. Always consult your provider before changing your diet, exercise, or medication.

## Trademarks

Ozempic, Wegovy, Mounjaro, and Zepbound are trademarks of their respective owners. ${SITE_NAME} is not affiliated with them.

## Links

- Website (English): ${SITE_URL}/en
- Sitio (Español): ${SITE_URL}/es
- Terms: ${SITE_URL}/en/legal/terms
- Privacy: ${SITE_URL}/en/legal/privacy
- Cookies: ${SITE_URL}/en/legal/cookies
- Refund: ${SITE_URL}/en/legal/refund
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
