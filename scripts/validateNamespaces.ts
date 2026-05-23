import { getPineconeClient, INDEX_NAME_DENSE } from '../lib/vector/client';

async function main() {
    console.log("Validating Pinecone Namespaces...");

    const pc = getPineconeClient();
    if (!pc) {
        console.error("Pinecone not configured.");
        process.exit(1);
    }

    const index = pc.Index(INDEX_NAME_DENSE);
    try {
        const stats = await index.describeIndexStats();
        console.log(`Total Dimensions: ${stats.dimension}`);
        console.log(`Total Vectors: ${stats.totalRecordCount}`);

        console.log("\nNamespaces:");
        if (stats.namespaces) {
             for (const [ns, nStats] of Object.entries(stats.namespaces)) {
                  console.log(`- [${ns || 'default'}]: ${nStats.recordCount} vectors`);
                  
                  // Ensure namespace represents subject codes (3 uppercase letters usually in our context)
                  if (ns && !/^[A-Z]{3}$/.test(ns)) {
                       console.warn(`  ⚠️ Warning: Namespace '${ns}' does not match expected subject format.`);
                  }
             }
        } else {
             console.log("No namespaces populated.");
        }
    } catch(e) {
        console.error("Failed to fetch pinecone stats:", e);
        process.exit(1);
    }

    process.exit(0);
}

main();
