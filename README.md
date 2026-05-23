# NEET/JEE AI Reference Tutor - Production Guide

## Platform Overview
This platform securely ingests NCERT chapters and Past Year Questions (PYQs), extracts semantic text and structure, and acts as a specialized RAG Tutor.

## Setup Instructions

1. **Environment Variables**: Create a `.env.local` file in the root directory. You must provide:
   ```env
   # Firebase Admin SDK (MUST contain exact PEM format with headers)
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...rest of key...\n-----END PRIVATE KEY-----\n"
   
   # Pinecone Vector DB
   PINECONE_API_KEY="your-pinecone-api-key"
   
   # Google Gemini API
   GEMINI_API_KEY="your-gemini-api-key"
   ```
   **CRITICAL**: `FIREBASE_PRIVATE_KEY` must contain `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. Use `\n` to represent literal newlines in a single-line string if defined in certain platforms, or paste exactly as multiple lines in `.env.local`.

2. **Verify Environment**:
   Run the diagnostic script to ensure keys are loaded correctly:
   ```bash
   npx tsx scripts/checkEnv.ts
   ```

3. **Installation**:
   ```bash
   npm install
   ```

3. **Running Quality Assurance (QA) Tests**:
   The admin QA suite verifies verifier security, metadata constraints, intent logic, and PYQ constraints. It does not require real infrastructure.
   ```bash
   npx tsx scripts/test-qa.ts
   npx tsx scripts/test-retrieval.ts
   ```

4. **Running Linter and Type Checking**:
   ```bash
   npx tsc --noEmit
   npm run lint
   ```

5. **Starting the App**:
   ```bash
   npm run dev
   ```

6. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

## Production Readiness Checklist
- **Firebase Security**: Private keys strictly isolated from clients. Admin DB used for write-heavy functions safely.
- **Student Data Safety**: Students can ONLY view chapters and pyqs marked as `status: 'published'`. Vector metadata filter and lexical fallbacks both enforce this.
- **Payload Strictness**: Zod structures reject Image URLs or Base64 elements. Verifier blocks any `![image]` markdown from being relayed in chat.
- **Formulas**: Safely normalized to `\(` and `\[`.
- **Diagnostic Panel**: `/admin/system` accurately measures connectivity, Pinecone dimensions, namespace populations, and ingestion QA statuses.

## Known Limitations / Phase 8 Readiness
- Phase 8 may introduce streaming responses (SSE). Currently, tutoring waits for the Gemini payload to fully resolve before matching PYQs.
- Storage limits for PDF raw sources rest on the client disk. Future integration could use Google Cloud Storage.
