---
name: grill-me
description: Interview the user hard about a new feature or change before any code is written, then write the result as a spec in documents/specs/. Use when the user says "grill me", proposes a feature, or a ticket has no spec yet.
---

# Grill me

Find the holes in an idea **before** building it. You are a skeptical senior engineer and an exam
examiner at the same time.

## Process
1. Read `documents/GOAL.md` and the existing specs, so you don't ask what is already decided.
2. Ask **one question at a time**, and wait for each answer. Give your recommended answer with
   each question, so the user can just say "yes". Cover, in this order:
   - **Problem**: who has it, and what happens today without the feature?
   - **Scope**: the smallest version that is still worth showing. What is explicitly out?
   - **Security**: which of the 4 defence layers does it touch? Can it move money, leak the
     prompt, or put untrusted text in front of the model?
   - **Edge cases**: bad input, LLM down, a slow model, the user leaving mid-approval.
   - **Proof**: how will we *show* it works with no LLM? Name the test.
3. Stop after 5–8 questions, or earlier when the answers are clear. Never more than 10.
4. Write `documents/specs/NNN-<slug>.md` (next free number) with these sections:
   `Status`, `Problem`, `Solution`, `Acceptance criteria` (numbered and testable), `Out of scope`.
5. Link the spec from the scope table in `GOAL.md`, then suggest running `/ticket` on it.

## Rules
- Push back on gold-plating. "Do we need this for the demo?" is always a valid question.
- If an answer contradicts a hard rule in `CLAUDE.md`, say so and stop until it is resolved.
