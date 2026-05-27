"""
seed_data.py
============
Populates the FAISS vector store with sample weekly summaries
for testing the historical search feature.

Usage:
    python seed_data.py

Make sure the backend server is running first:
    uvicorn main:app --reload
"""

import requests

BASE_URL = "http://localhost:8000"

# Sample weekly summaries representing different productivity patterns
# These cover a range of scenarios: coding-heavy, meeting-heavy,
# research weeks, low productivity, and sprint weeks
SAMPLE_SUMMARIES = [
    {
        "summary": "This week was highly productive with a strong focus on coding tasks. You completed 18 tasks across 5 days, logging 32 hours total. Most sessions had high focus, especially Monday and Tuesday where you shipped the authentication module. Wednesday showed a dip with low-focus meetings consuming most of the afternoon.",
        "suggestions": [
            "Block mornings for deep coding work to protect your peak focus hours.",
            "Batch all meetings into Tuesday and Thursday afternoons.",
            "Try a 25-minute Pomodoro technique on low-focus days.",
        ],
        "metrics": {
            "week_start": "2025-01-06",
            "week_end": "2025-01-12",
            "total_tasks": 18,
            "total_hours": 32.0,
            "focus_counts": {"high": 12, "medium": 4, "low": 2},
            "category_counts": {"Coding": 10, "Meeting": 4, "Research": 3, "Admin": 1},
            "tasks": []
        }
    },
    {
        "summary": "A meeting-heavy week with fragmented focus. You attended 9 meetings totaling 14 hours, leaving limited time for deep work. Despite the interruptions, you completed 3 design deliverables. Focus was predominantly medium and low. The lack of coding output suggests project momentum may slow next week.",
        "suggestions": [
            "Audit your recurring meetings and cancel ones with no clear agenda.",
            "Reserve at least 2 hours each morning as no-meeting focus blocks.",
            "Prepare meeting agendas in advance to cut meeting durations by 30%.",
            "Delegate admin tasks to free up creative bandwidth.",
        ],
        "metrics": {
            "week_start": "2025-01-13",
            "week_end": "2025-01-19",
            "total_tasks": 14,
            "total_hours": 22.5,
            "focus_counts": {"high": 2, "medium": 6, "low": 6},
            "category_counts": {"Meeting": 9, "Design": 3, "Admin": 2},
            "tasks": []
        }
    },
    {
        "summary": "An excellent research and writing week. You produced 4 technical documents and completed deep literature reviews for the ML pipeline project. Focus levels were consistently high, and you averaged 7 hours of logged work per day. This was one of your strongest output weeks in terms of written deliverables.",
        "suggestions": [
            "Continue the morning writing habit — your best writing happened before 10am.",
            "Consider publishing your research findings as a blog post.",
            "Schedule a review session at week end to consolidate notes.",
        ],
        "metrics": {
            "week_start": "2025-01-20",
            "week_end": "2025-01-26",
            "total_tasks": 16,
            "total_hours": 35.0,
            "focus_counts": {"high": 13, "medium": 2, "low": 1},
            "category_counts": {"Writing": 6, "Research": 7, "Coding": 2, "Admin": 1},
            "tasks": []
        }
    },
    {
        "summary": "A balanced week with good distribution across coding, design, and meetings. You completed 15 tasks including the dashboard UI refactor and API integration. Focus was mixed — mornings were high-focus, afternoons dropped to medium. Total hours were slightly below your weekly average.",
        "suggestions": [
            "Protect your high-focus morning window — avoid scheduling calls before noon.",
            "Use afternoon slots for code reviews and lighter tasks.",
            "Consider a weekly planning session every Monday morning.",
        ],
        "metrics": {
            "week_start": "2025-02-03",
            "week_end": "2025-02-09",
            "total_tasks": 15,
            "total_hours": 27.5,
            "focus_counts": {"high": 7, "medium": 6, "low": 2},
            "category_counts": {"Coding": 7, "Design": 4, "Meeting": 3, "Admin": 1},
            "tasks": []
        }
    },
    {
        "summary": "A challenging week with low productivity due to illness mid-week. Only 8 tasks were completed, with Wednesday and Thursday almost entirely missed. Despite this, you managed to ship a critical bug fix on Friday with high focus. Recovery weeks are normal — the important thing is returning to routine.",
        "suggestions": [
            "Build a lightweight task list for low-energy days.",
            "Consider async communication tools to stay updated on low-output days.",
            "Set a realistic goal for next week to rebuild momentum gradually.",
        ],
        "metrics": {
            "week_start": "2025-02-10",
            "week_end": "2025-02-16",
            "total_tasks": 8,
            "total_hours": 14.0,
            "focus_counts": {"high": 2, "medium": 3, "low": 3},
            "category_counts": {"Coding": 4, "Admin": 2, "Meeting": 2},
            "tasks": []
        }
    },
    {
        "summary": "A sprint week dominated by coding with 22 coding tasks completed across the frontend and backend. You logged 40 hours — your highest week this quarter. High focus was maintained for 80% of sessions. The team delivered the v2.0 release successfully. A textbook deep work week.",
        "suggestions": [
            "Document your sprint setup process to replicate this focus in future sprints.",
            "Schedule a lighter Friday after intense sprint weeks to avoid burnout.",
            "Share your velocity metrics with the team as a motivational benchmark.",
        ],
        "metrics": {
            "week_start": "2025-02-24",
            "week_end": "2025-03-02",
            "total_tasks": 26,
            "total_hours": 40.0,
            "focus_counts": {"high": 21, "medium": 4, "low": 1},
            "category_counts": {"Coding": 22, "Meeting": 2, "Research": 1, "Admin": 1},
            "tasks": []
        }
    },
]

def seed():
    print("🌱 Seeding vector store with sample weekly summaries...\n")
    for payload in SAMPLE_SUMMARIES:
        try:
            res = requests.post(f"{BASE_URL}/save-summary", json=payload)
            res.raise_for_status()
            print(f"✓ Saved week {payload['metrics']['week_start']} — {payload['metrics']['total_tasks']} tasks, {payload['metrics']['total_hours']}h")
        except Exception as e:
            print(f"✗ Failed to save week {payload['metrics']['week_start']}: {e}")

    print(f"\n✅ Done! {len(SAMPLE_SUMMARIES)} weeks seeded.")
    print("\nTry searching for:")
    print('  → "Show me weeks when I completed a lot of coding tasks"')
    print('  → "Find weeks with low focus and high hours"')
    print('  → "When did I have my most productive weeks?"')

if __name__ == "__main__":
    seed()