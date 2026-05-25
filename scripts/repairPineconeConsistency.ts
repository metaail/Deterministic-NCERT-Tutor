import { execSync } from 'child_process';

function main() {
  console.log("Starting Pinecone Consistency Repair...\n");

  console.log("1. Deleting orphan vectors...");
  execSync('npx -y tsx scripts/deleteOrphanVectors.ts', { 
    stdio: 'inherit', 
    env: { ...process.env, CONFIRM_DELETE: 'true' } 
  });

  console.log("\n2. Resyncing metadata...");
  execSync('npx -y tsx scripts/resyncChunkMetadata.ts', { 
    stdio: 'inherit' 
  });

  console.log("\nRepair complete.");
}

main();
