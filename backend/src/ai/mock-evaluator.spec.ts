import { signalEvaluationSchema } from "@signalscout/shared";
import { MockEvaluator } from "./mock-evaluator";

describe("MockEvaluator", () => {
  const evaluator = new MockEvaluator();
  const base = {
    productDescription: "Outbound sales tooling",
    signalHypothesis: "Companies scaling sales need tooling",
    keywords: ["account executive"],
  };

  it("flags a GTM-relevant posting as a match and returns a valid evaluation", async () => {
    const result = await evaluator.evaluateSignal({
      ...base,
      posting: {
        company: "Acme",
        title: "Senior Account Executive",
        location: "London",
        description: "Own enterprise pipeline as we scale our sales team.",
      },
    });

    expect(() => signalEvaluationSchema.parse(result)).not.toThrow();
    expect(result.isMatch).toBe(true);
    expect(result.confidence).toBeGreaterThan(50);
    expect(result.category).not.toBe("not_a_match");
  });

  it("does not match an unrelated posting", async () => {
    const result = await evaluator.evaluateSignal({
      ...base,
      keywords: [],
      posting: {
        company: "Acme",
        title: "Facilities Technician",
        location: null,
        description: "Maintain building HVAC systems.",
      },
    });

    expect(result.isMatch).toBe(false);
    expect(result.category).toBe("not_a_match");
  });

  it("drafts outreach referencing the company and role", async () => {
    const draft = await evaluator.draftOutreach({
      productDescription: "Outbound sales tooling",
      tone: "consultative",
      company: "Acme",
      title: "Account Executive",
      category: "team_expansion",
      likelyNeed: "Enablement tooling",
      suggestedAngle: "Offer a quick win",
    });

    expect(draft.subject).toContain("Acme");
    expect(draft.body).toContain("Account Executive");
    expect(draft.followUp.length).toBeGreaterThan(0);
  });
});
