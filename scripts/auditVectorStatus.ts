import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../lib/utils/env';

async function main() {
  if (!env.PINECONE_API_KEY) process.exit(1);

  const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  const index = pc.Index('neet-jee-reference-tutor-dense');
  const namespaces = ['class11_PHY', 'class11_CHM', 'class11_BIO', 'class11_MTH', 'class12_PHY', 'class12_CHM', 'class12_BIO', 'class12_MTH'];

  let totalDrafts = 0;
  let totalPublished = 0;
  let invalidStatus = 0;

  for (const ns of namespaces) {
    const nsIndex = index.namespace(ns);
    let paginationToken: string | undefined = undefined;
    
    let drafts = 0;
    let published = 0;

    do {
        try {
            const listResults: any = await nsIndex.listPaginated({ limit: 100, paginationToken });
            const ids = (listResults.vectors || []).map((v:any) => v.id);
            if (ids.length > 0) {
              const fetchResponse: any = await nsIndex.fetch({ ids });
              for (const id of ids) {
                const status = fetchResponse.records[id]?.metadata?.status;
                if (status === 'draft') drafts++;
                else if (status === 'published') published++;
                else invalidStatus++;
              }
            }
            paginationToken = listResults.pagination?.next;
        } catch(e) { break; }
    } while (paginationToken);

    console.log(`Namespace: ${ns} | Drafts: ${drafts} | Published: ${published}`);
    totalDrafts += drafts;
    totalPublished += published;
  }

  console.log(`\nAudit Vector Status Complete`);
  console.log(`Total Drafts: ${totalDrafts}`);
  console.log(`Total Published: ${totalPublished}`);
  console.log(`Invalid Status: ${invalidStatus}`);
  
  if (invalidStatus > 0) {
    console.error("❌ Invalid statuses found!");
    process.exit(1);
  } else {
    console.log("✅ All vector statuses are canonical.");
  }
}

main().catch(console.error);
