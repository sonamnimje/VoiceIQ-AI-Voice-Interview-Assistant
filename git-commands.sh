cd "d:\Sonam Work\Project\VoiceIQ"

# add the backend requirements file and root pointer (if not already staged)
git add backend/requirements.txt requirements.txt

# commit
git commit -m "chore: add backend/requirements.txt for deploy"

# push
git push origin HEAD
