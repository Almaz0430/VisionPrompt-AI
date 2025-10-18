# Higgsfield Prompt Builder Backend

Backend API for generating Higgsfield-compliant prompts via OpenAI. Built with Django and Django REST Framework.

## Quickstart

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# export the environment variables listed below
python manage.py migrate
python manage.py runserver
```

## Environment

Set the following variables (e.g. in `.env`) before running the server:

```
DJANGO_SECRET_KEY=<your-secret-key>
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
OPENAI_API_KEY=<chatgpt-api-key>
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_SECONDS=30
```

`.env.example` in the repo can be copied or used with tools like `direnv` to manage these values locally.

## API

`POST /api/generate-prompt/`

Payload (JSON or multipart):

```json
{
  "user_query": "Describe the concept to expand.",
  "goals": ["image_generation", "video_generation"],
  "image": "<optional file>"
}
```

Response (JSON):

```json
{
  "meta": {...},
  "prompts": {
    "image_generation": {...},
    "image_editing": {...},
    "video_generation": {...}
  }
}
```

All prompts comply with Higgsfield hackathon rules.

## Testing

```bash
python manage.py test
```

Key scenarios are mocked, so the tests do not call OpenAI.
