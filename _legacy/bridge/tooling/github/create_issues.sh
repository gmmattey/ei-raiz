#!/bin/bash

FILES=(
"docs/backlog/03_user_stories.md"
"docs/backlog/04_technical_stories.md"
"docs/backlog/05_doc_and_repo_tasks.md"
)

for file in "${FILES[@]}"; do
  awk '/## /{if(x)print x; x="";} {x=x"\n"$0;} END{print x;}' "$file" | while read -r block
  do
    title=$(echo "$block" | head -n 1 | sed 's/## //')
    body=$(echo "$block" | tail -n +2)

    gh issue create \
      --title "$title" \
      --body "$body" \
      --label "enhancement"
  done
done
