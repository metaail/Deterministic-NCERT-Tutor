import { env } from '../lib/utils/env';

function main() {
    console.log("Environment Variables Diagnostic");
    console.log("--------------------------------");
    
    let allValid = true;

    const checks = [
        { name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', val: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
        { name: 'FIREBASE_CLIENT_EMAIL', val: env.FIREBASE_CLIENT_EMAIL },
        { name: 'FIREBASE_PRIVATE_KEY', val: env.FIREBASE_PRIVATE_KEY, isPem: true },
        { name: 'PINECONE_API_KEY', val: env.PINECONE_API_KEY },
        { name: 'GEMINI_API_KEY', val: env.GEMINI_API_KEY }
    ];

    for (const check of checks) {
        if (!check.val) {
            console.log(`❌ ${check.name} is missing.`);
            allValid = false;
        } else {
            if (check.isPem) {
                 const key = check.val as string;
                 const formatted = key.replace(/\\n/g, '\n');
                 if (formatted.includes('-----BEGIN PRIVATE KEY-----')) {
                     console.log(`✅ ${check.name} exists and has PEM header.`);
                 } else {
                     console.log(`❌ ${check.name} exists but is MISSING PEM header.`);
                     allValid = false;
                 }
            } else {
                console.log(`✅ ${check.name} exists.`);
            }
        }
    }

    console.log("--------------------------------");
    if (allValid) {
        console.log("Environment is VALID for ingestion.");
        process.exit(0);
    } else {
        console.log("Environment is INVALID. Please update your AI Studio secrets.");
        process.exit(1);
    }
}

main();
