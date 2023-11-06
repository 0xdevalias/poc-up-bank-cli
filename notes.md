# Notes

## `jq` helpers

We can use my `jq-filter-array` helper to filter the array of transactions using `--include` and `--exclude`:

- https://github.com/0xdevalias/dotfiles/blob/devalias/bin/jq-filter-array
  - eg. `jq-filter-array --include "telstra" --exclude "anz" "--extra-jq-script 'map(.attributes.description)' up-bank-202122fy-tagged-tax.json`

Or we could filter and map at the same time:

```shell
jq-filter-array --include "telstra" --exclude "anz" --extra-jq-script 'map({
  createdAt: .attributes.createdAt,
  description: .attributes.description,
  rawText: .attributes.rawText,
  value: .attributes.amount.value,
  currencyCode: .attributes.amount.currencyCode,
  foreignAmount: .attributes.foreignAmount,
})' up-bank-202122fy-tagged-tax.json
```

Or filter/map and then reduce the values into strings for easier skimming:

```shell
jq-filter-array --include "telstra" --exclude "anz" --extra-jq-script 'map({
  createdAt: .attributes.createdAt,
  description: .attributes.description,
  value: .attributes.amount.value,
  currencyCode: .attributes.amount.currencyCode,
} | join(", "))
' up-bank-202122fy-tagged-tax.json | jq -r '.[]'
```

And then maybe some `-r` raw output to make it even less verbose:

```shell
jq-filter-array -r --include "telstra" --exclude "anz" --extra-jq-script 'map({
  createdAt: .attributes.createdAt,
  description: .attributes.description,
  value: .attributes.amount.value,
  currencyCode: .attributes.amount.currencyCode,
} | join(", ")) | .[]
' up-bank-202122fy-tagged-tax.json
```

Then if we choose not to filter/exclude anything, we can group everything by description and make it really easily scannable:

```shell
jq-filter-array -r --extra-jq-script 'map({
  createdAt: .attributes.createdAt,
  description: .attributes.description,
  value: .attributes.amount.value,
  currencyCode: .attributes.amount.currencyCode,
}) | group_by(.description) | flatten | .[] | join(", ")
' up-bank-202122fy-tagged-tax.json
```

TODO: make this work: Using jq, how can I convert a string to a number, get the absolute value of that number, then add them all up

```shell
 | map(.value | tonumber | abs) | reduce .[] as $num (0; . + $num)
```

Example transaction object:

```json
{
  "type": "transactions",
  "id": "TRANSACTION-ID-PLACEHOLDER",
  "attributes": {
    "status": "SETTLED",
    "rawText": "Telstra Services, 132200",
    "description": "Telstra",
    "message": null,
    "isCategorizable": true,
    "holdInfo": {
      "amount": {
        "currencyCode": "AUD",
        "value": "-40.00",
        "valueInBaseUnits": -4000
      },
      "foreignAmount": null
    },
    "roundUp": null,
    "cashback": null,
    "amount": {
      "currencyCode": "AUD",
      "value": "-40.00",
      "valueInBaseUnits": -4000
    },
    "foreignAmount": null,
    "cardPurchaseMethod": {
      "method": "CARD_ON_FILE",
      "cardNumberSuffix": "2331"
    },
    "settledAt": "2022-06-22T04:48:22+10:00",
    "createdAt": "2022-06-21T08:35:28+10:00"
  },
  "relationships": {
    "account": {
      "data": {
        "type": "accounts",
        "id": "ACCOUNT-ID-PLACEHOLDER"
      },
      "links": {
        "related": "https://api.up.com.au/api/v1/accounts/ACCOUNT-ID-PLACEHOLDER"
      }
    },
    "transferAccount": {
      "data": null
    },
    "category": {
      "data": {
        "type": "categories",
        "id": "mobile-phone"
      },
      "links": {
        "self": "https://api.up.com.au/api/v1/transactions/TRANSACTION-ID-PLACEHOLDER/relationships/category",
        "related": "https://api.up.com.au/api/v1/categories/mobile-phone"
      }
    },
    "parentCategory": {
      "data": {
        "type": "categories",
        "id": "personal"
      },
      "links": {
        "related": "https://api.up.com.au/api/v1/categories/personal"
      }
    },
    "tags": {
      "data": [
        {
          "type": "tags",
          "id": "Tax"
        }
      ],
      "links": {
        "self": "https://api.up.com.au/api/v1/transactions/TRANSACTION-ID-PLACEHOLDER/relationships/tags"
      }
    }
  },
  "links": {
    "self": "https://api.up.com.au/api/v1/transactions/TRANSACTION-ID-PLACEHOLDER"
  }
}

```
