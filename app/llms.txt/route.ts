import { SITE_NAME, SITE_URL, FORMER_NAME } from "@/lib/site";

export function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_NAME} helps people using GLP-1 medications focus on protein and strength while losing weight.

${SITE_NAME} was formerly called ${FORMER_NAME}.

## What ${SITE_NAME} does

${SITE_NAME} is a wellness app built specifically for people on GLP-1 medications. It brings together:

- A daily protein target that updates when your dose changes, based on your weight, goals, and our approach to appetite on GLP-1s.
- Meal ideas sized for a reduced appetite, high in protein.
- Simple strength and activity plans across several sport types.
- Medication tracking with dose history and email reminders.
- Progress charts and a weekly summary of your protein and training consistency.
- A 30-day summary you can bring to your doctor.

## Who it is for

Adults using GLP-1 medications such as semaglutide (Ozempic, Wegovy) or tirzepatide (Mounjaro, Zepbound) who want to keep protein intake and strength up while losing weight.

## Approach

Research suggests that adequate protein intake together with resistance training supports lean mass during weight loss. A commonly cited target range is 1.2 to 1.6 g of protein per kg of body weight. ${SITE_NAME} turns general guidance into a simple daily plan. Talk to your care team about what is right for you.

## Pricing

$14.99 per month with a 7-day free trial. Cancel anytime.

## Important

${SITE_NAME} is a wellness tool, not a medical device. It does not diagnose, treat, cure, or prevent any disease, and it does not provide medical advice. Always talk to your healthcare provider about your GLP-1 medication and your nutrition and exercise plans.

## Links

- Website (English): ${SITE_URL}/en
- Sitio (Español): ${SITE_URL}/es
- Terms: ${SITE_URL}/en/legal/terms
- Privacy: ${SITE_URL}/en/legal/privacy
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
