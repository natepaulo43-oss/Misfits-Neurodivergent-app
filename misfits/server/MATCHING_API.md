# Mentor–Student Matching Engine

Deterministic, explainable matching that runs entirely on structured onboarding data and can be swapped for ML later without breaking the contract.

## HTTP Endpoint

```
POST /match
Content-Type: application/json
```

### Request Body

```json
{
  "student_profile": {
    "fullName": "Jordan Lee",
    "age": 17,
    "gradeLevel": "high_school",
    "timezone": "America/Los_Angeles",
    "supportGoals": ["academic_support", "career_guidance"],
    "learningStyles": ["visual"],
    "communicationMethods": ["text", "video"],
    "meetingFrequency": "weekly",
    "mentorTraits": ["patient", "structured"],
    "guidanceStyle": "step_by_step",
    "neurodivergence": "adhd",
    "availabilitySlots": ["tue_evening", "thu_evening"]
  },
  "mentor_profiles": [
    {
      "id": "mentor-123",
      "fullName": "Dr. Aisha Smith",
      "timezone": "America/Los_Angeles",
      "focusAreas": ["academic_support", "executive_functioning"],
      "communicationMethods": ["text", "video"],
      "availabilitySlots": ["tue_evening"],
      "mentoringApproach": ["structured_guidance"],
      "menteeAgeRange": ["high_school", "college"],
      "neurodivergenceExperience": "experienced",
      "maxMentees": 4,
      "currentMentees": 2,
      "isActive": true
    }
  ],
  "options": {
    "weights": {
      "supportGoals": 35,
      "communication": 25,
      "availability": 15,
      "mentoringStyle": 15,
      "neuroExperience": 10
    },
    "threshold": 65,
    "minResults": 3,
    "maxResults": 5
  }
}
```

### Response Body

```json
{
  "matches": [
    {
      "mentor_id": "mentor-123",
      "mentor_name": "Dr. Aisha Smith",
      "compatibility_score": 88.7,
      "match_reasons": [
        "Aligned support goals and mentor expertise",
        "Matching communication preferences",
        "Compatible availability and time zones",
        "Mentoring style fits requested guidance",
        "Experienced supporting neurodivergent students"
      ],
      "breakdown": {
        "supportGoals": 100,
        "communication": 100,
        "availability": 85,
        "mentoringStyle": 100,
        "neuroExperience": 100
      }
    }
  ],
  "metadata": {
    "weights": {
      "supportGoals": 35,
      "communication": 25,
      "availability": 15,
      "mentoringStyle": 15,
      "neuroExperience": 10
    },
    "threshold": 65,
    "disclaimer": null,
    "total_considered": 1,
    "total_returned": 1
  }
}
```

If the best score is below the configured threshold (defaults to `60`), `metadata.disclaimer` explains that the list shows the best available options even though the preferred compatibility floor was not met.

## Matching Logic Overview

1. **Hard filters** – mentors must have compatible availability, accept the student’s age band, and be active + below capacity.
2. **Weighted scoring** (0–100):
   - Support goal alignment – 40%
   - Communication preference match – 20%
   - Availability & time zone – 15%
   - Mentoring style / guidance preference – 15%
   - Neurodivergence experience preference – 10%
3. **Explainability** – reasons are generated when a component tops 60/100 (aligned goals, matching communication, etc.).
4. **Tie-breaking** – a deterministic micro-jitter derived from `mentor_id` keeps rankings stable while preventing perpetual ordering bias.

> All weights are configurable via `options.weights`. Values are normalized so you can supply any scale (e.g., 0–1, 0–100).

## Extending the Engine

- **Extra signals**: add new component calculators in `matchingEngine.js`, then include them in `computeComponentBreakdown` and weight normalization.
- **Feedback loops**: log accepted matches and future satisfaction surveys alongside `metadata` to power ML later. The rule-based structure and explicit breakdown make it straightforward to train a model using these same features.
- **Availability schema**: currently `availabilitySlots` is a simple array token (e.g., `"tue_evening"`). When a scheduling service is introduced, update the overlap helpers without affecting the public API.

## Edge Cases & Safeguards

- Missing data (e.g., no student time zone) produces neutral scores instead of failing the request.
- If a mentor omits capacity fields, they default to “available” so early data gaps don’t block matches.
- `minResults`/`maxResults` defaults to `3–5`, ensuring students always see a short list even with tight filters.
- The request payload is JSON-in / JSON-out, keeping it trivial to call from mobile, web, or future cron jobs that pre-compute matches.
