import sys
import os

# Set up Python module search paths for Vercel Serverless
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "useless_project_temp", "backend")

for path in [backend_dir, root_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

from app.main import app  # type: ignore  # noqa: E402 — resolved via sys.path above
