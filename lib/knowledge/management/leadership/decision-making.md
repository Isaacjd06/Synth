---
id: decision-making
title: Decision Making
domain: management/leadership
level: foundational
tags: [leadership, decision-frameworks, critical-thinking, strategy]
summary: "Comprehensive frameworks and methodologies for making high-quality decisions in business contexts, including cognitive models, decision quality frameworks, and systematic approaches to reduce bias and improve outcomes."
last_reviewed: "2025-01-09"
reliability: "high"
related_topics: [cognitive-biases, systems-thinking, strategy]
---

# Decision Making

## Overview

Decision-making is the fundamental activity of leadership and management. The quality of your decisions—multiplied by the volume of decisions you make—determines the trajectory of your business. This document provides systematic frameworks for making better decisions faster, reducing cognitive bias, and avoiding common decision traps.

**Key Principle**: Good decision-making is not about always being right. It's about having a repeatable process that produces the best possible outcomes given available information, while accounting for uncertainty and bias.

## Why This Matters for Synth

Synth automates workflows, but decision points within those workflows still require judgment. Understanding decision-making frameworks helps you:

1. **Design better automation**: Identify which decisions can be automated (rules-based) vs. which require human judgment
2. **Set better decision criteria**: Encode clear decision rules into workflows
3. **Escalate appropriately**: Know when to pause automation and involve humans
4. **Measure decision quality**: Track not just outcomes but the quality of the decision process itself

---

## Decision Types and Speed-Quality Tradeoffs

Not all decisions deserve equal time and resources. Understanding decision types helps you allocate attention appropriately.

### Type 1 vs Type 2 Decisions (Jeff Bezos Framework)

**Type 1 Decisions (One-Way Doors)**:
- Difficult or impossible to reverse
- Require careful, deliberate analysis
- Examples: Hiring leadership, major acquisitions, core product architecture, raising funding terms
- Approach: Slow down, gather data, consult broadly, use formal frameworks

**Type 2 Decisions (Two-Way Doors)**:
- Easily reversible
- Can be made quickly by individuals or small groups
- Examples: Marketing copy changes, feature experiments, process tweaks, tool trials
- Approach: Make the decision quickly, learn from results, reverse if needed
- **Critical insight**: Most decisions are Type 2, but organizations often treat them like Type 1, creating bottlenecks and bureaucracy

### The Decision Matrix: Impact vs Uncertainty

|                     | **Low Uncertainty**          | **High Uncertainty**              |
|---------------------|------------------------------|-----------------------------------|
| **High Impact**     | Analyze deeply, then decide  | Reduce uncertainty first (experiments, research), then decide |
| **Low Impact**      | Decide quickly using heuristics | Decide quickly, learn from results |

**Practical Application**:
- High Impact + Low Uncertainty: "Should we migrate to a new database?" → Analyze performance data, cost projections, migration risks
- High Impact + High Uncertainty: "Should we enter a new market?" → Run small experiments, talk to customers, gather data before committing
- Low Impact + Low Uncertainty: "What time should we hold the team meeting?" → Just pick one
- Low Impact + High Uncertainty: "Should we try this new marketing channel?" → Run a small test quickly

---

## Core Decision-Making Frameworks

### 1. First Principles Thinking

First principles thinking involves breaking down problems to their fundamental truths and reasoning up from there, rather than reasoning by analogy or convention.

**Process**:

**Step 1: Identify and challenge assumptions**
- What do we assume to be true about this problem?
- Which assumptions are actually constraints we've inherited?
- Example: "We need to hire more salespeople to grow revenue" → Assumption: revenue growth requires proportional headcount growth

**Step 2: Break down to fundamental truths**
- What are the basic, proven facts?
- What cannot be reduced further?
- Example: Revenue = Number of customers × Average purchase value × Purchase frequency

**Step 3: Reason up from first principles**
- Given only fundamental truths, what solutions are possible?
- This often reveals unconventional approaches
- Example: Instead of hiring more salespeople, could we increase average purchase value through packaging? Increase frequency through subscription model?

**Business Applications**:
- **Product design**: "What job does the customer actually need done?" vs. "What features do competitors have?"
- **Pricing**: "What value do we create?" vs. "What do competitors charge?"
- **Operations**: "What's the minimum viable process?" vs. "How have we always done this?"

**Warning**: First principles thinking is time-intensive. Reserve it for important, non-obvious problems where conventional wisdom may be wrong.

### 2. The OODA Loop (Boyd's Decision Cycle)

Developed by military strategist John Boyd, the OODA Loop is a framework for rapid decision-making in dynamic environments.

**Four Stages**:

**Observe**: Gather current information from multiple sources
- What's happening in the environment?
- What data is available?
- What are competitors/customers doing?

**Orient**: Analyze information in context
- How does this new information fit with existing knowledge?
- What patterns emerge?
- What are our biases and assumptions?
- **Critical stage**: Orientation is where most decision quality is won or lost

**Decide**: Select a course of action
- Based on observation and orientation, what's the best move?
- Make the decision explicit

**Act**: Execute the decision
- Implement quickly
- Begin observing results immediately to start the next loop

**Key Insight**: The side that can complete OODA loops faster than their opponent gains a decisive advantage. In business, this means you can out-iterate competitors.

**Applications**:
- **Product development**: Observe user behavior → Orient around user needs → Decide on features → Act by shipping → Observe usage data
- **Sales**: Observe prospect signals → Orient around their buying process → Decide on approach → Act with outreach → Observe response
- **Crisis response**: Especially valuable when situations are changing rapidly

**Synth Application**: OODA loops can be partially automated—Synth can handle Observe (data collection) and Act (execution), while humans focus on Orient and Decide.

### 3. Decision Quality Framework (Strategic Decisions Group)

A systematic framework for evaluating whether a decision is ready to be made.

**Six Elements of Decision Quality**:

1. **Appropriate Frame**: Are we solving the right problem?
   - Have we defined the decision clearly?
   - Are we asking the right question?
   - Example: "How do we reduce churn?" vs. "How do we increase customer lifetime value?" (different frames lead to different solutions)

2. **Creative Alternatives**: Have we generated meaningful options?
   - Do we have at least 3 viable alternatives?
   - Have we considered unconventional approaches?
   - Avoid false dichotomies (it's not always A or B)

3. **Meaningful Information**: Do we have the right information?
   - What information is relevant to this decision?
   - What's the cost of getting more information vs. the value of that information?
   - When is more data just procrastination?

4. **Clear Values**: What are we optimizing for?
   - What are our criteria for success?
   - How do we trade off competing values? (e.g., speed vs. quality, growth vs. profitability)
   - Make trade-offs explicit

5. **Sound Reasoning**: Is our logic valid?
   - Do our conclusions follow from our information?
   - Have we checked for logical fallacies?
   - Have we considered second-order effects?

6. **Commitment to Action**: Will we actually follow through?
   - Do stakeholders buy in to the decision?
   - Are resources allocated?
   - Is there clarity on who does what by when?

**Usage**: Before making a major decision, score each element 1-10. If any element scores below 7, that's where you need more work before deciding.

### 4. Expected Value Decision-Making

For decisions with quantifiable outcomes and probabilities, expected value provides a systematic approach.

**Formula**:
```
Expected Value = Σ (Probability of Outcome × Value of Outcome)
```

**Example**: Should we invest in a new feature?

**Scenario 1**: Feature succeeds (30% probability)
- Revenue impact: +$500k/year
- Value: $500k × 0.30 = $150k

**Scenario 2**: Feature performs moderately (50% probability)
- Revenue impact: +$100k/year
- Value: $100k × 0.50 = $50k

**Scenario 3**: Feature fails (20% probability)
- Revenue impact: $0
- Value: $0 × 0.20 = $0

**Development cost**: $120k

**Expected Value**: $150k + $50k + $0 - $120k = **$80k positive**

**Decision**: Proceed with the feature (positive expected value)

**Limitations**:
- Requires probability estimates (often subjective)
- Doesn't account for risk tolerance (a 1% chance of losing everything is very different from a 1% chance of losing $100)
- Doesn't capture strategic value beyond the numbers
- Best used as one input among many, not the sole decision criterion

**Advanced Technique: Monte Carlo Simulation**

For complex decisions with multiple uncertain variables, run thousands of simulations to see the distribution of possible outcomes. This reveals not just expected value but also the range of likely results and tail risks.

### 5. Pre-Mortem Technique (Gary Klein)

A pre-mortem helps identify risks before making a decision by imagining failure.

**Process**:

**Step 1: Assume the decision has been made and implemented**

**Step 2: Fast-forward 6-12 months and imagine complete failure**
- "It's six months from now. Our decision was a complete disaster. What happened?"

**Step 3: Generate reasons for failure**
- Each person writes down all the reasons the decision could have failed
- No filtering—write everything that comes to mind

**Step 4: Share and discuss**
- Go around the room, each person shares one reason
- Continue until all reasons are captured

**Step 5: Prioritize risks and create mitigations**
- Which failure modes are most likely?
- Which would be most damaging?
- How can we reduce these risks before proceeding?

**Why This Works**:
- Overcoming optimism bias: Groups often get overly confident about decisions
- Psychological safety: Framing failure as hypothetical makes it safe to voice concerns
- Prospective hindsight: Research shows people are better at generating reasons for outcomes when imagining looking back from the future

**When to Use**:
- Before committing to major initiatives
- Before launches, fundraising rounds, key hires
- When the team seems overly confident

### 6. The Eisenhower Matrix (Urgent-Important Matrix)

A framework for prioritizing decisions and tasks based on urgency and importance.

|                     | **Urgent**                          | **Not Urgent**                      |
|---------------------|-------------------------------------|-------------------------------------|
| **Important**       | **Do First** (Q1)<br>Crises, deadlines, pressing problems | **Schedule** (Q2)<br>Strategic planning, prevention, skill development, relationship building |
| **Not Important**   | **Delegate** (Q3)<br>Interruptions, some emails, some meetings | **Eliminate** (Q4)<br>Time wasters, busy work, some emails |

**Key Insights**:
- **Quadrant 2 (Important but Not Urgent) is where high performers live**: This is strategic work that prevents Q1 crises
- Most people spend too much time in Q1 (firefighting) and Q3/Q4 (reactive work)
- The goal is to minimize Q1 by investing in Q2

**Common Trap**: Mistaking urgency for importance. Just because something is screaming for attention doesn't mean it matters.

**Application to Decisions**:
- Q1 decisions: Make them quickly with available information
- Q2 decisions: These are your most important decisions—allocate adequate time
- Q3 decisions: Can someone else make this decision?
- Q4 decisions: Should we even be spending time on this decision?

---

## Cognitive Models: How Humans Actually Decide

### System 1 vs System 2 Thinking (Daniel Kahneman)

**System 1 (Fast Thinking)**:
- Automatic, intuitive, effortless
- Pattern recognition, heuristics
- Operates constantly in the background
- Examples: Recognizing faces, driving on an empty road, detecting hostility in a voice
- **Strengths**: Fast, efficient, good for familiar situations
- **Weaknesses**: Prone to biases, can't handle complex calculations, relies on stereotypes

**System 2 (Slow Thinking)**:
- Deliberate, analytical, effortful
- Requires conscious attention and working memory
- Examples: Calculating 17 × 24, evaluating complex arguments, comparing multiple options across dimensions
- **Strengths**: Logical, can handle complexity, can override System 1
- **Weaknesses**: Slow, tiring, limited capacity

**Implications for Decision-Making**:

1. **System 1 is usually in charge**: We use intuition and heuristics for most decisions, then rationalize them with System 2
2. **System 2 is lazy**: It often accepts System 1's suggestions without scrutiny
3. **Design decisions for the appropriate system**:
   - Routine, time-sensitive decisions → Design for System 1 (clear rules, defaults, checklists)
   - Novel, important decisions → Force System 2 engagement (structured analysis, diverse input, written reasoning)

### Recognition-Primed Decision Model (Gary Klein)

Klein studied expert decision-makers (firefighters, ER nurses, military commanders) and found they rarely compare options. Instead:

**The Process**:
1. **Pattern Recognition**: Expert recognizes situation as similar to past experiences
2. **Mental Simulation**: Expert mentally simulates typical action for this pattern
3. **Evaluation**: If simulation seems workable, execute; if not, modify or try next pattern

**Key Finding**: Experts don't make decisions by comparing options. They rapidly recognize patterns and select the first workable option.

**Implications**:
- **Expertise matters**: Pattern recognition only works if you have relevant experience
- **Fast decisions can be good decisions**: When you have domain expertise
- **Build pattern libraries**: Document patterns and outcomes to accelerate pattern recognition for your team
- **Beware overconfidence**: Patterns from one domain may not apply to another

**When to Use Recognition-Primed Decisions**:
- You have deep domain expertise
- The situation is time-sensitive
- The situation fits familiar patterns
- The cost of trying and adjusting is low

**When NOT to Use**:
- You're outside your domain expertise
- The situation is genuinely novel
- Stakes are very high and irreversible
- Time allows for systematic analysis

---

## Group Decision-Making

### Decision-Making Modes

**1. Command (Autocratic)**:
- Leader makes decision with little to no input
- **When to use**: Crisis situations, time-critical decisions, when expertise is concentrated in one person
- **Downside**: No diverse input, low buy-in from team

**2. Consultative**:
- Leader gathers input from team, then makes decision
- **When to use**: Most business decisions, when leader has decision authority but wants input
- **Advantage**: Balances speed with input diversity and some degree of buy-in

**3. Consensus**:
- Group discusses until everyone agrees (or at least can live with the decision)
- **When to use**: Decisions that require broad buy-in, values-based decisions, when no clear authority exists
- **Downside**: Slow, can lead to watered-down compromises, vocal minorities can block

**4. Democratic (Vote)**:
- Majority rules
- **When to use**: When consensus isn't possible and no clear authority exists
- **Downside**: Creates winners and losers, 49% may strongly disagree

**Best Practice**: **Explicitly state which mode you're using** at the start of the discussion. "I'm going to make this decision, but I want everyone's input first" (consultative) vs. "We need to reach consensus on this as a team" (consensus).

### Avoiding Groupthink

Groupthink occurs when the desire for harmony overrides critical evaluation of alternatives.

**Symptoms of Groupthink**:
- Illusion of invulnerability ("we can't fail")
- Collective rationalization (dismissing warnings)
- Belief in inherent morality ("we're the good guys")
- Stereotyping outsiders
- Direct pressure on dissenters
- Self-censorship
- Illusion of unanimity (silence = agreement)
- Self-appointed "mindguards" who shield the group from dissenting information

**Prevention Strategies**:

1. **Assign a Devil's Advocate**: Someone explicitly argues against the prevailing view (rotate this role)
2. **Separate idea generation from evaluation**: Brainstorm options without judging, then evaluate separately
3. **Invite outside experts**: Bring in people with no stake in the current consensus
4. **Break into subgroups**: Have smaller groups work independently, then compare
5. **Anonymous input**: Use written submissions or tools like anonymous voting to reduce social pressure
6. **Leader speaks last**: If the leader states their view first, others will anchor on it

### The Delphi Method (Structured Expert Consensus)

A systematic approach to group decision-making that avoids groupthink and dominant personalities.

**Process**:

**Round 1**: Each expert independently provides their judgment/estimate
**Round 2**: Share anonymized Round 1 results with all experts
**Round 3**: Each expert revises their judgment, knowing others' views
**Round 4+**: Repeat until consensus emerges or positions stabilize

**Benefits**:
- Avoids dominant personalities
- Allows experts to update views without losing face
- Documents reasoning at each stage
- Produces probabilistic ranges, not false precision

**When to Use**: Forecasting, complex technical decisions, when expertise is distributed across team members

---

## Decision-Making Tools and Techniques

### Decision Trees

Visual representation of decisions, outcomes, and probabilities.

**Components**:
- **Decision nodes** (squares): Points where you choose between alternatives
- **Chance nodes** (circles): Points where outcomes are uncertain
- **End nodes** (triangles): Final outcomes with values

**When to Use**:
- Sequential decisions (where early choices affect later options)
- Quantifiable outcomes and probabilities
- Comparing alternatives with different risk profiles

**Limitations**:
- Can become complex quickly
- Requires probability estimates
- Doesn't capture qualitative factors well

### Weighted Decision Matrix (Multi-Criteria Decision Analysis)

Systematic approach for comparing options across multiple criteria.

**Process**:

**Step 1: List criteria and assign weights**
- What factors matter for this decision?
- How important is each factor? (weights should sum to 100%)

Example criteria for choosing a vendor:
- Cost (30%)
- Features (25%)
- Reliability (20%)
- Support quality (15%)
- Integration ease (10%)

**Step 2: Score each option on each criterion** (e.g., 1-10 scale)

| Criterion        | Weight | Vendor A | Vendor B | Vendor C |
|------------------|--------|----------|----------|----------|
| Cost             | 30%    | 7        | 9        | 6        |
| Features         | 25%    | 9        | 7        | 8        |
| Reliability      | 20%    | 8        | 8        | 9        |
| Support Quality  | 15%    | 6        | 8        | 7        |
| Integration Ease | 10%    | 9        | 5        | 8        |

**Step 3: Calculate weighted scores**
- Vendor A: (7×0.30) + (9×0.25) + (8×0.20) + (6×0.15) + (9×0.10) = 7.75
- Vendor B: (9×0.30) + (7×0.25) + (8×0.20) + (8×0.15) + (5×0.10) = 7.85
- Vendor C: (6×0.30) + (8×0.25) + (9×0.20) + (7×0.15) + (8×0.10) = 7.55

**Step 4: Compare and decide**

**Best Practice**: Don't let the matrix make the decision for you. If the numbers point to Vendor B but your gut says Vendor A, ask yourself: "What am I not capturing in the criteria? What intangible factor matters that I haven't quantified?"

### The 10/10/10 Rule (Suzy Welch)

A tool for gaining perspective on decisions by considering multiple time horizons.

**Ask yourself**:
- How will I feel about this decision 10 minutes from now?
- How will I feel about it 10 months from now?
- How will I feel about it 10 years from now?

**Purpose**:
- Separates emotional reactions (10 minutes) from longer-term consequences
- Helps identify decisions that feel hard now but won't matter long-term
- Highlights decisions that seem easy now but have long-term implications

**Examples**:
- **Firing an underperformer**: 10 min = uncomfortable; 10 months = relieved; 10 years = won't remember
- **Turning down a lucrative but misaligned client**: 10 min = anxious about revenue; 10 months = proud of saying no; 10 years = grateful for staying true to values

---

## Decision Journals and Learning from Decisions

Most people don't get better at decisions over time because they don't track decision quality separately from outcomes.

### Why Outcomes ≠ Decision Quality

- **Good decisions can have bad outcomes** (due to luck/uncertainty)
- **Bad decisions can have good outcomes** (also due to luck)
- If you only learn from outcomes, you'll reinforce both good and bad decision processes randomly

**Example**:
- You launch a product without adequate market research (bad process), but a competitor exits the market unexpectedly and you succeed (good outcome)
- Learning: "My gut instincts are great!" (wrong lesson)
- Reality: You got lucky; repeating this process will lead to failures

### Decision Journal Template

For important decisions, record:

**1. Context**:
- Date of decision
- What decision are we making?
- What information do we have?
- What's uncertain?

**2. Alternatives Considered**:
- What options did we evaluate?
- What did we choose?

**3. Rationale**:
- Why did we choose this option?
- What assumptions are we making?
- What are the expected outcomes?

**4. Probabilities (if applicable)**:
- What do we think will happen?
- What's our confidence level?

**5. Review (6-12 months later)**:
- What actually happened?
- Was our reasoning sound, given what we knew then?
- What would we do differently?
- What did we learn?

**Key Insight**: Judge decisions based on the process and information available at the time, not the outcome. A good decision is one that used sound reasoning with available information, even if results were disappointing.

---

## Common Decision Traps and Mitigations

### 1. Analysis Paralysis
**Trap**: Endless information gathering and analysis without deciding
**Causes**: Fear of making wrong decision, perfectionism, unclear decision criteria
**Mitigation**:
- Set a decision deadline
- Identify the minimum information needed to reach 70-80% confidence
- Ask: "What additional information would actually change my decision?"
- Use the Type 2 framework: If reversible, decide faster

### 2. Sunk Cost Fallacy
**Trap**: Continuing a course of action because of past investment, even when it's no longer optimal
**Causes**: Loss aversion, ego protection, public commitment
**Mitigation**:
- Ask: "If we were starting fresh today, knowing what we know now, would we make this choice?"
- Focus on future costs and benefits, ignore past investments
- Separate decision-making from resource allocation decisions

### 3. Anchoring
**Trap**: Over-relying on the first piece of information encountered
**Causes**: Insufficient adjustment from initial anchor
**Mitigation**:
- Generate your own estimates before hearing others'
- Consider multiple reference points, not just one
- Ask: "What if the opposite were true?"

### 4. Confirmation Bias
**Trap**: Seeking information that confirms pre-existing beliefs, ignoring contradictory evidence
**Causes**: Cognitive ease, identity protection
**Mitigation**:
- Assign someone to argue against your preferred option
- Actively seek disconfirming evidence
- Ask: "What would have to be true for the opposite decision to be correct?"

### 5. Recency Bias
**Trap**: Overweighting recent events in decision-making
**Causes**: Availability heuristic (recent events are more memorable)
**Mitigation**:
- Look at longer time horizons of data
- Ask: "Is this recent event representative or an outlier?"
- Use base rates, not just recent examples

### 6. Availability Bias
**Trap**: Overestimating the likelihood of events that are easy to recall
**Causes**: Vivid, emotional, or recent events are more memorable than abstract statistics
**Mitigation**:
- Seek statistical base rates, not just memorable examples
- Ask: "What's the actual frequency of this event, not just my recall of it?"

### 7. HiPPO (Highest Paid Person's Opinion)
**Trap**: Deferring to senior person's opinion without critical evaluation
**Causes**: Power dynamics, risk aversion, efficiency (it's faster to just agree)
**Mitigation**:
- Senior person speaks last in discussions
- Separate idea generation from idea evaluation
- Create psychological safety for dissent
- Use data and evidence, not just opinions

---

## Decision-Making for Different Contexts

### Strategic Decisions (Rare, High-Impact)
- **Frequency**: Quarterly to annually
- **Examples**: Market entry, major pivots, acquisitions
- **Approach**:
  - Use full Decision Quality Framework
  - Gather diverse perspectives
  - Run pre-mortems
  - Document reasoning in decision journal
  - Allocate weeks to months for analysis

### Tactical Decisions (Regular, Medium-Impact)
- **Frequency**: Weekly to monthly
- **Examples**: Hiring, pricing changes, feature prioritization
- **Approach**:
  - Use OODA Loop or weighted decision matrix
  - Consultative decision-making mode
  - Allocate days to weeks
  - Balance analysis with action

### Operational Decisions (Frequent, Lower-Impact)
- **Frequency**: Daily
- **Examples**: Task prioritization, minor process adjustments
- **Approach**:
  - Use Eisenhower Matrix
  - Recognition-primed decisions (expertise-based)
  - Create clear decision rules/criteria
  - Default to Type 2 (reversible) approach
  - Decide in minutes to hours

---

## Internal Check

### Areas Where Evidence Is Weaker or Context-Dependent
- Expected value calculations and probability estimates are illustrative examples; actual probabilities in business decisions are often highly subjective
- The specific numerical thresholds (e.g., "70-80% confidence", "3 viable alternatives", "score below 7") are practical guidelines rather than empirically validated optimal values
- Effectiveness of group decision-making modes varies significantly by organizational culture, team dynamics, and decision context
- The relative performance of System 1 vs System 2 thinking depends heavily on domain expertise and decision complexity
- Time allocation recommendations (e.g., "days to weeks" for tactical decisions) are general guidelines that vary by industry, company stage, and decision stakes
- The applicability of recognition-primed decision models depends on having relevant past experience in similar contexts
- Weighted decision matrix scoring inherently involves subjective judgments even when attempting to be systematic

### Confirmation: No Fabricated Sources
All frameworks and techniques described are established methodologies from published works and documented business practices. Sources include Jeff Bezos (Type 1/Type 2 framework from Amazon leadership principles), John Boyd (OODA Loop from military strategy literature), Strategic Decisions Group (Decision Quality Framework from decision analysis field), Gary Klein (Recognition-Primed Decision Model and pre-mortem technique from published research), Daniel Kahneman (System 1/System 2 from Nobel Prize-winning behavioral economics research), Suzy Welch (10/10/10 Rule from published work), and the Eisenhower Matrix (widely used prioritization framework). No case studies, statistics, or company examples were fabricated. Framework descriptions are based on original source material and widely accepted interpretations.

### Confidence Levels by Section
- Decision Types and Speed-Quality Tradeoffs: HIGH - Type 1/Type 2 framework is well-documented
- First Principles Thinking: HIGH - established problem-solving methodology with clear applications
- OODA Loop: HIGH - documented military strategy framework with proven business applications
- Decision Quality Framework: HIGH - established framework from decision analysis field
- Expected Value Decision-Making: MEDIUM-HIGH - methodology is sound but requires subjective probability estimates
- Pre-Mortem Technique: HIGH - research-backed technique with documented effectiveness
- Eisenhower Matrix: HIGH - widely validated prioritization framework
- Cognitive Models (System 1/System 2): HIGH - based on extensive psychological research
- Group Decision-Making: HIGH - established organizational behavior principles
- Decision-Making Tools: MEDIUM-HIGH - tools are proven but effectiveness varies by application
- Decision Journals: MEDIUM-HIGH - principle is sound but limited empirical research on specific format
- Common Decision Traps: HIGH - well-documented cognitive biases with established mitigations
- Overall: HIGH (8.5/10) - comprehensive synthesis of established frameworks with practical applications

---

## FILE COMPLETE

**Status:** Ready to save to `/lib/knowledge/management/leadership/decision-making.md`
