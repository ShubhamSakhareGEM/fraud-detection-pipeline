#!/bin/bash

NORMAL_LEFT=$1
HACKER_LEFT=$2

if [ -z "$NORMAL_LEFT" ] || [ -z "$HACKER_LEFT" ]; then
  echo "Usage: ./traffic.sh  "
  echo "Example: ./traffic.sh 40 10"
  exit 1
fi

TOTAL=$((NORMAL_LEFT + HACKER_LEFT))
echo "🚀 Firing $TOTAL total transactions ($NORMAL_LEFT normal, $HACKER_LEFT hacker)..."

for (( i=1; i<=TOTAL; i++ )); do
  TOTAL_LEFT=$((NORMAL_LEFT + HACKER_LEFT))
  RAND=$(( RANDOM % TOTAL_LEFT ))

  # Weighted random selection based on remaining transactions
  if [ $RAND -lt $NORMAL_LEFT ]; then
    # Normal Transaction (Random user, high amount)
    USER_ID="user-$(( (RANDOM % 1000) + 1 ))"
    AMOUNT=$(( (RANDOM % 90) + 10 )).00
    NORMAL_LEFT=$((NORMAL_LEFT - 1))
    ICON="✅"
  else
    # Hacker Transaction (Same user testing stolen cards, low amount)
    USER_ID="user-hacker-999"
    AMOUNT=$(( (RANDOM % 5) + 1 )).00
    HACKER_LEFT=$((HACKER_LEFT - 1))
    ICON="🚨"
  fi

  # Fire the payload
  curl -s -X POST http://localhost:3000/api/transactions \
    -H "Content-Type: application/json" \
    -d "{\"id\": \"tx-sim-$i\", \"user_id\": \"$USER_ID\", \"amount\": $AMOUNT}" > /dev/null
  
  echo "$ICON Sent Tx: $i | User: $USER_ID | Amount: \$$AMOUNT"
  sleep 0.5
done

echo "🏁 Traffic simulation complete!"
