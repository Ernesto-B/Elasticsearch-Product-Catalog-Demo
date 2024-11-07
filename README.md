# Product Catalog Search App Using Elasticsearch

This project consists of two applications (`app.js` and `appAdvanced.js`) built using Node.js and Elasticsearch. Both apps enable users to add, search, and delete products in a product catalog. The advanced application (`appAdvanced.js`) includes custom synonym filtering to enhance search functionality, as well as fuzziness to allow for mispellings of search terms.

## Table of Contents

- [Product Catalog Search App Using Elasticsearch](#product-catalog-search-app-using-elasticsearch)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Usage](#usage)
  - [How Synonyms Works](#how-synonyms-works)

---

## Prerequisites
- Node.js
- Docker

## Usage

1. Clone the repository.
    ```bash
    git clone https://github.com/Ernesto-B/Elasticsearch-Product-Catalog-Demo.git
    cd Elasticsearch-Product-Catalog-Demo
    ```
2. Install dependencies:
   ```bash
   npm install
    ```
3. Start the Elasticsearch container:
   ```bash
   docker run --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.4.1
   ```
   - Normally Elasticsearch expects traffic coming from HTTP**S** requests, but for the purpose of this demo, we use HTTP requests. To allow HTTP requests for Elasticsearch, we include the `-e "xpack.security.enabled=false"` part of the command.
4. Run the application:
   ```bash
    node app.js
    ```
    or
    ```bash
    node appAdvanced.js
    ```
5. Call the endpoints using Postman or a similar tool.
   - If you have the VScode extension `Thunder Client`, you can use the `requests.rest` file to send requests to the server by clicking on the `Send Request` button. 

## Endpoints
1. **Add a product to the catalog:**
   - **URL:** `http://localhost:3000/products`
   - **Method:** `POST`
   - **Body:**
     ```json
     {
      "id": "2",
      "name": "24 Inch Panasonic Microwave Pro Max, Sleek Silver",
      "description": "A product for demonstration purposes",
      "price": 29.99,
      "category": "Tech"
     }
     ```
2. **Search for a product in the catalog:**
    - **URL:** `http://localhost:3000/products/search`
    - **Method:** `GET`
    - **Query Parameters:** 
      - `query` (optional): The name search query. If none given, will return all the products in the catalog.
      - `category` (optional): The category of the product.
    - **Example:** `http://localhost:3000/products/search?query=microwave`
3. **Delete a product from the catalog:**
    - **URL:** `http://localhost:3000/products/:id`
    - **Method:** `DELETE`
    - **Example:** `http://localhost:3000/products/2`

## Explanation of Search Queries
- For information on `app.js` line 50, refer to the following structure of the response object we get from the `GET` query:
  ```json
  {
    "hits": {
      "total": 2,
      "max_score": 1.0,
      "hits": [
        {
          "_index": "products",
          "_id": "1",
          "_score": 1.0,
          "_source": {
            "name": "Running Shoes",
            "category": "sports",
            "price": 79.99
          }
        },
        {
          "_index": "products",
          "_id": "2",
          "_score": 0.9,
          "_source": {
            "name": "Basketball Shoes",
            "category": "sports",
            "price": 99.99
          }
        }
      ]
    }
  }
  ```

- In Elasticsearch, `match` and `term` queries serve different purposes (found in the `GET /products/search` route):
    - **match**: The match query is used in the must clause to find documents with terms that match the input text. It tokenizes the text and considers analyzers, making it ideal for text fields where partial matches and fuzziness (minor misspellings) are allowed.
    - **term**: The term query, used in the filter clause, looks for exact matches and does not tokenize or analyze the input. It’s commonly used with keyword fields or exact values where we want precise filtering (e.g., category). Since there is no tokenizing or analyzing, it’s faster than the match query.

## How Synonyms Works
- **Synonym Filter**: The `synonym_filter` in `createIndexWithSynonyms` maps specific terms as synonyms. Specifically, it maps 'panasonic', 'samsung', and 'apple' as synonyms, and 'tv' and 'television' as synonyms:
  ```js
    filter: {
        synonym_filter: {
            type: 'synonym',
            synonyms: [
                "panasonic, samsung, apple",
                "tv, television",
                // More synonyms
            ]
        }
    },
  ```
- **Custom Analyzer**: The `custom_analyzer` in `createIndexWithSynonyms` uses the `synonym_filter` above to create a custom analyzer that tokenizes the text, converts it to lowercase, and applies the synonym filter:
  ```js
    custom_analyzer: {
        type: "custom",
        tokenizer: "standard",
        filter: ["lowercase", "synonym_filter"],
    }
    ```
- **How It Works in Search**: When searching with the `synonym_analyzer`, a search query with one synonym will also match other terms in the same synonym group, making the search more versatile.
