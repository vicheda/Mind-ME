# Mock Syllabus Files for Testing

## MOCK_SYLLABUS.txt
A comprehensive syllabus with 25+ tasks using various formats:
- Different date formats: "March 15, 2026", "3/17/2026", "15 March", "03/31/2026"
- Various task types: assignments, exams, quizzes, projects, labs
- Hour estimates: (~4 hours), (~2 hours), etc.
- Different keywords: due, submit, scheduled, on

## How to Test

1. Open the app at http://localhost:3000
2. Click "📋 Parse Syllabus" button
3. Copy and paste the contents of MOCK_SYLLABUS.txt
4. Click "Parse" to extract tasks
5. Review the parsed results and select which to add
6. Choose a project and click "Add Selected"

## Expected Results

The parser should extract:
- 25+ tasks with proper titles
- Deadlines in various formats
- Hour estimates (defaults to 2 hours if not specified)
- Tasks should be scheduled with distributed sessions

## Quick Test Snippet

For a quick test, try this short snippet:

```
Assignment 1 due March 20, 2026 (~6 hours)
Midterm exam on April 3
Final project due April 28 (~12 hours)
Quiz 1 - March 25
Lab Exercise due 3/30/2026 (~3 hours)
```

This will create 5 tasks with a mix of formats.
