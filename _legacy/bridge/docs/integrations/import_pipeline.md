# Import Pipeline

## Objective
Define how portfolio data is ingested and processed.

## Flow
1. upload file
2. parse file
3. normalize data
4. generate preview
5. confirm import
6. persist positions
7. store import history

## Supported inputs (initial)
- PDF
- CSV (future)

## Output structure
- positions[]
  - asset_name
  - type
  - value
  - institution

## Preview rules
- user must confirm before saving
- invalid rows must be flagged

## Error handling
- unreadable file
- partial parsing
- unsupported format

## Fallback
- manual entry when parsing fails

## Rule
Parsing must be isolated from business logic.
