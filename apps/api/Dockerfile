FROM python:3.12-slim AS base

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM base AS final

RUN addgroup --system app && adduser --system --ingroup app app

COPY --chown=app:app . .

RUN chmod +x entrypoint.sh

USER app

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
