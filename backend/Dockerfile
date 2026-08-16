FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Build the local SQLite demo DB into the image so the container is
# runnable standalone; override DATABASE_URL (see infra/docker-compose.yml)
# to point at Postgres instead.
RUN python db/create_demo_db.py

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
