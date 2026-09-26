---
name: study-planner
description: Build a day-by-day study plan around a student's lectures and labs before exams. Use when someone asks to plan their week, plan study time, or prepare for mid-sems or finals.
---

# Study planner

Use this when a student wants a study plan before exams.

## Steps

1. Get the whole week's timetable with `getTimetable` (day: "week"). It also lists the mid-sem exam dates.
2. Get the forecast with `getWeather` for Moratuwa. Rainy afternoons are better for library study than walking to a café.
3. Find the free slots: gaps between lectures, evenings, and weekends. Never schedule study over a lecture or lab.
4. Put the exam that comes first, and any subject the student says they're weak at, at the top.
5. Write the plan to `/output/plan.md` in the format below.

## Rules of thumb

- Study blocks are 50 minutes, with a 10 minute break. At most 4 blocks in a row.
- Every day before an exam, give that module at least 2 blocks, and do past papers the evening before.
- Keep one evening a week free. A burnt-out student learns nothing.
- Put mathematics practice in the morning, when people are freshest.

## Format for plan.md

```markdown
# Study plan: <dates>

## Exams
| Date | Time | Module |

## Day by day
### Monday <date>
- 16:30-17:20  DSA: revise sorting algorithms (library, it may rain)
- ...

## Tips for this week
- 2 or 3 short, specific tips
```
