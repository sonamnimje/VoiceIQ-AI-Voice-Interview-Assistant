# run from repository root
cd "d:\Sonam Work\Project\VoiceIQ"

# 1. Check status
git status

# 2. Stage files (adjust file list as needed)
git add requirements.txt backend/requirements.txt generate_test_audio.py

# 3. Commit
git commit -m "chore: consolidate requirements and add test audio generator"

# 4. Ensure remote exists and push
git remote -v
# if remote missing, add it:
# git remote add origin https://github.com/sonamnimje/VoiceIQ-AI-Voice-Interview-Assistant.git

# 5. Push current branch
git push origin HEAD
# if first push for this branch:
# git push -u origin HEAD

# 6. Verify: open GitHub repo URL in browser or fetch latest
git fetch origin
git log --oneline origin/$(git rev-parse --abbrev-ref HEAD) -n 5
