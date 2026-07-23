# API CONTRACTS

## GET /portfolio
Response:
{
  "value": 10000,
  "score": 72
}

## GET /alerts
Response:
[
  {
    "type": "fund_under_cdi",
    "severity": "medium"
  }
]

## POST /goal/simulate
Request:
{
  "monthly": 500,
  "months": 60
}

Response:
{
  "projected": 42000
}
