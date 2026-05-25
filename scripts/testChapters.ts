import { getPublishedChapters } from '../lib/chat/getPublishedChapters';

async function main() {

  const chapters = await getPublishedChapters();
  console.log('Chapters count:', chapters.length);
  if (chapters.length > 0) {
    console.log('Sample chapter ID:', chapters[0].id);
    console.log('Sample createdAt:', chapters[0].createdAt, 'type:', typeof chapters[0].createdAt);
    console.log('Sample updatedAt:', chapters[0].updatedAt, 'type:', typeof chapters[0].updatedAt);
  }
}

main().catch(console.error);
