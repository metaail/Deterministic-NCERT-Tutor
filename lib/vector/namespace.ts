export function getNamespace(classLevel: string, subjectCode: string): string {
  const cl = classLevel.replace('Class ', 'class'); // "class11" or "class12"
  let sub = 'PHY';
  switch (subjectCode) {
    case '042': sub = 'PHY'; break;
    case '043': sub = 'CHM'; break;
    case '044': sub = 'BIO'; break;
    case '041': sub = 'MTH'; break;
  }
  return `${cl}_${sub}`;
}
