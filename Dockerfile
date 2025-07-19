FROM python:3.13.5-alpine3.21
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

