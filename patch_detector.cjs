const fs = require('fs');
let code = fs.readFileSync('src/lib/contradiction-detector.ts', 'utf8');

const eventAllergiesCode = `
    // 3.5 Inspect manual events for Allergies
    for (const evt of input.events) {
      if (evt.eventType === 'Allergy') {
        const lower = (evt.title || '').toLowerCase();
        const reactionLower = (evt.description || '').toLowerCase();
        
        if (lower.includes('no known') || lower.includes('nkda') || lower.includes('none')) {
          if (!mentions.some((m) => m.documentId === evt.id && m.type === 'NKDA')) {
            mentions.push({
              type: 'NKDA',
              quote: 'Manual entry: ' + evt.title,
              documentId: evt.id, // Using event ID as placeholder
              documentFileName: 'Manual Entry',
              date: evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : '2023-01-01',
              pageNumber: 1,
              facilityName: evt.facilityName || 'User Entry',
              providerName: evt.providerName || 'User',
            });
          }
        } else if (lower.length > 0) {
          if (!mentions.some((m) => m.documentId === evt.id && m.type === 'SPECIFIC')) {
            mentions.push({
              type: 'SPECIFIC',
              allergyName: evt.title,
              reaction: evt.description || 'Reaction',
              quote: 'Manual entry: ' + evt.title + (evt.description ? ' - ' + evt.description : ''),
              documentId: evt.id,
              documentFileName: 'Manual Entry',
              date: evt.eventDate ? new Date(evt.eventDate).toISOString().split('T')[0] : '2023-01-01',
              pageNumber: 1,
              facilityName: evt.facilityName || 'User Entry',
              providerName: evt.providerName || 'User',
            });
          }
        }
      }
    }
`;

code = code.replace(/\/\/ 4\. Match NKDA against Specific Allergies/, eventAllergiesCode + '\n    // 4. Match NKDA against Specific Allergies');

fs.writeFileSync('src/lib/contradiction-detector.ts', code);
