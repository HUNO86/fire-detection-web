FROM python:3.10-slim

WORKDIR /code

RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN useradd -m -u 1000 user

COPY --chown=user:user . .

USER user

CMD ["python", "app.py"]