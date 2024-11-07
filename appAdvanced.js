const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch');

const app = express();
const PORT = 3000;

const esClient = new Client({ node: 'http://localhost:9200' });
app.use(bodyParser.json());


// Define the index with a custom analyzer
async function createIndexWithSynonyms() {
    await esClient.indices.create({
        index: 'products2',
        body: {
            settings: {
                analysis: {
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
                    analyzer: {
                        synonym_analyzer: {
                            type: 'custom',
                            tokenizer: 'standard',
                            filter: ['lowercase', 'synonym_filter']
                        }
                    }
                }
            },
            mappings: {
                properties: {
                    name: { type: 'text', analyzer: 'synonym_analyzer' },
                    description: { type: 'text', analyzer: 'synonym_analyzer' },
                    price: { type: 'float' },
                    category: { type: 'keyword' }
                }
            }
        }
    });
}

// Check if the index already exists, if not, create it
async function initializeIndex() {
    const indexExists = await esClient.indices.exists({ index: 'products2' });
    if (!indexExists) {
        await createIndexWithSynonyms();
        console.log("Index 'products2' created with synonyms.");
    } else {
        console.log("Index 'products2' already exists.");
    }
}
initializeIndex();


// Add new product
app.post('/products', async (req, res) => {
    const { id, name, description, price, category } = req.body;

    try {
        // Add new JSON doc to index (like a table) and make it searcheable. Updates if already exists
        const result = await esClient.index({
            index: 'products2',
            id: id,
            document: { name, description, price, category }
        });
        res.status(200).json({ message: 'Product added', result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// Search for products
app.get('/products/search', async (req, res) => {
    const { query, category } = req.query;

    try {
        const result = await esClient.search({
            index: 'products2',
            query: {
                bool: {
                    // must = the required conditions to match docs
                    must: query ? { match: { name: { query: query, fuzziness:"AUTO", analyzer:"synonym_analyzer"} } } : { match_all: {} },
                    // filter = filters results from the must query where the category matches.
                    // If no filter, no filtering is applied (as specified with the [] )
                    filter: category ? { term: { category } } : []
                }
            }
        });
        // extract only the document data part of each hit.
        res.status(200).json(result.hits.hits.map(hit => hit._source));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Delete a product by ID
app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await esClient.delete({
            index: 'products2',
            id: id
        });
        res.status(200).json({ message: 'Product deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});



app.listen(PORT, () => {
    console.log(`Product2 Catalog Search app listening at http://localhost:${PORT}`);
});
