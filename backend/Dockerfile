FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    gcc g++ libgomp1 libffi-dev libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-compile Stan model for Prophet (avoids first-request timeout)
RUN python -c "from prophet import Prophet; Prophet()"

COPY . .

EXPOSE 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
