/**
 * Plan Verification Script
 * 
 * Run this to verify all plan configurations are correct.
 * This is a TypeScript file that can be imported and used for testing.
 */

import { PLANS, getPlanConfig, isIntegrationAllowed, hasPlanFeature } from "./plans";

interface VerificationResult {
  plan: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Verify all plan configurations
 */
export function verifyAllPlans(): VerificationResult[] {
  const results: VerificationResult[] = [];

  // Verify Starter Plan
  const starterResult = verifyPlan("starter", {
    maxActiveWorkflows: 3,
    maxMonthlyRuns: 5000,
    allowedIntegrations: "basic",
    supportTier: "email",
    executionLogRetention: "7_days",
    customWebhooks: false,
    teamCollaboration: false,
    whiteLabel: false,
    apiAccess: false,
    customIntegrations: false,
  });
  results.push(starterResult);

  // Verify Pro Plan
  const proResult = verifyPlan("pro", {
    maxActiveWorkflows: 10,
    maxMonthlyRuns: 25000,
    allowedIntegrations: "all",
    supportTier: "priority",
    executionLogRetention: "30_days",
    customWebhooks: true,
    teamCollaboration: true,
    whiteLabel: false,
    apiAccess: false,
    customIntegrations: false,
  });
  results.push(proResult);

  // Verify Agency Plan
  const agencyResult = verifyPlan("agency", {
    maxActiveWorkflows: 40,
    maxMonthlyRuns: 100000,
    allowedIntegrations: "all+custom",
    supportTier: "dedicated",
    executionLogRetention: "90_days",
    customWebhooks: true,
    teamCollaboration: true,
    whiteLabel: true,
    apiAccess: true,
    customIntegrations: true,
  });
  results.push(agencyResult);

  // Verify integration access
  verifyIntegrationAccess(results);

  return results;
}

/**
 * Verify a single plan's configuration
 */
function verifyPlan(
  planName: "starter" | "pro" | "agency",
  expected: {
    maxActiveWorkflows: number;
    maxMonthlyRuns: number;
    allowedIntegrations: "basic" | "all" | "all+custom";
    supportTier: "email" | "priority" | "dedicated";
    executionLogRetention: "7_days" | "30_days" | "90_days";
    customWebhooks: boolean;
    teamCollaboration: boolean;
    whiteLabel: boolean;
    apiAccess: boolean;
    customIntegrations: boolean;
  }
): VerificationResult {
  const result: VerificationResult = {
    plan: planName,
    passed: true,
    errors: [],
    warnings: [],
  };

  const plan = PLANS[planName];
  const limits = plan.limits;

  // Verify limits
  if (limits.maxActiveWorkflows !== expected.maxActiveWorkflows) {
    result.errors.push(
      `maxActiveWorkflows: expected ${expected.maxActiveWorkflows}, got ${limits.maxActiveWorkflows}`
    );
    result.passed = false;
  }

  if (limits.maxMonthlyRuns !== expected.maxMonthlyRuns) {
    result.errors.push(
      `maxMonthlyRuns: expected ${expected.maxMonthlyRuns}, got ${limits.maxMonthlyRuns}`
    );
    result.passed = false;
  }

  if (limits.allowedIntegrations !== expected.allowedIntegrations) {
    result.errors.push(
      `allowedIntegrations: expected "${expected.allowedIntegrations}", got "${limits.allowedIntegrations}"`
    );
    result.passed = false;
  }

  if (limits.supportTier !== expected.supportTier) {
    result.errors.push(
      `supportTier: expected "${expected.supportTier}", got "${limits.supportTier}"`
    );
    result.passed = false;
  }

  if (limits.executionLogRetention !== expected.executionLogRetention) {
    result.errors.push(
      `executionLogRetention: expected "${expected.executionLogRetention}", got "${limits.executionLogRetention}"`
    );
    result.passed = false;
  }

  // Verify features
  if (limits.customWebhooks !== expected.customWebhooks) {
    result.errors.push(
      `customWebhooks: expected ${expected.customWebhooks}, got ${limits.customWebhooks}`
    );
    result.passed = false;
  }

  if (limits.teamCollaboration !== expected.teamCollaboration) {
    result.errors.push(
      `teamCollaboration: expected ${expected.teamCollaboration}, got ${limits.teamCollaboration}`
    );
    result.passed = false;
  }

  if (limits.whiteLabel !== expected.whiteLabel) {
    result.errors.push(
      `whiteLabel: expected ${expected.whiteLabel}, got ${limits.whiteLabel}`
    );
    result.passed = false;
  }

  if (limits.apiAccess !== expected.apiAccess) {
    result.errors.push(
      `apiAccess: expected ${expected.apiAccess}, got ${limits.apiAccess}`
    );
    result.passed = false;
  }

  if (limits.customIntegrations !== expected.customIntegrations) {
    result.errors.push(
      `customIntegrations: expected ${expected.customIntegrations}, got ${limits.customIntegrations}`
    );
    result.passed = false;
  }

  // Verify pricing
  const expectedPrices = { starter: 49, pro: 149, agency: 399 };
  if (plan.price !== expectedPrices[planName]) {
    result.errors.push(
      `price: expected $${expectedPrices[planName]}, got $${plan.price}`
    );
    result.passed = false;
  }

  return result;
}

/**
 * Verify integration access logic
 */
function verifyIntegrationAccess(results: VerificationResult[]): void {
  // Starter should only allow basic
  if (isIntegrationAllowed("starter", "basic") !== true) {
    results[0].errors.push("Starter should allow basic integrations");
    results[0].passed = false;
  }
  if (isIntegrationAllowed("starter", "advanced") !== false) {
    results[0].errors.push("Starter should NOT allow advanced integrations");
    results[0].passed = false;
  }
  if (isIntegrationAllowed("starter", "custom") !== false) {
    results[0].errors.push("Starter should NOT allow custom integrations");
    results[0].passed = false;
  }

  // Pro should allow basic and advanced
  if (isIntegrationAllowed("pro", "basic") !== true) {
    results[1].errors.push("Pro should allow basic integrations");
    results[1].passed = false;
  }
  if (isIntegrationAllowed("pro", "advanced") !== true) {
    results[1].errors.push("Pro should allow advanced integrations");
    results[1].passed = false;
  }
  if (isIntegrationAllowed("pro", "custom") !== false) {
    results[1].errors.push("Pro should NOT allow custom integrations");
    results[1].passed = false;
  }

  // Agency should allow all
  if (isIntegrationAllowed("agency", "basic") !== true) {
    results[2].errors.push("Agency should allow basic integrations");
    results[2].passed = false;
  }
  if (isIntegrationAllowed("agency", "advanced") !== true) {
    results[2].errors.push("Agency should allow advanced integrations");
    results[2].passed = false;
  }
  if (isIntegrationAllowed("agency", "custom") !== true) {
    results[2].errors.push("Agency should allow custom integrations");
    results[2].passed = false;
  }
}

/**
 * Print verification results
 */
export function printVerificationResults(results: VerificationResult[]): void {
  console.log("\n=== Plan Verification Results ===\n");

  results.forEach((result) => {
    const status = result.passed ? "✅ PASSED" : "❌ FAILED";
    console.log(`${result.plan.toUpperCase()} Plan: ${status}`);

    if (result.errors.length > 0) {
      console.log("  Errors:");
      result.errors.forEach((error) => console.log(`    - ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log("  Warnings:");
      result.warnings.forEach((warning) => console.log(`    - ${warning}`));
    }

    console.log();
  });

  const allPassed = results.every((r) => r.passed);
  if (allPassed) {
    console.log("✅ All plans verified successfully!");
  } else {
    console.log("❌ Some plans have errors. Please fix them.");
  }
}

// If running directly (for testing)
if (require.main === module) {
  const results = verifyAllPlans();
  printVerificationResults(results);
  
  // Exit with error code if any failed
  const allPassed = results.every((r) => r.passed);
  process.exit(allPassed ? 0 : 1);
}

