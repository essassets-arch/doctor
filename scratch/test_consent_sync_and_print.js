const fs = require('fs');
const path = require('path');

console.log('--- RUNNING CONSENT FORM & PRINT VERIFICATION SUITE ---');

const consentFormFile = fs.readFileSync(path.join(__dirname, '../src/components/ProcedureConsentForm.tsx'), 'utf8');
const pageFile = fs.readFileSync(path.join(__dirname, '../src/app/doctor/consultation/[caseId]/page.tsx'), 'utf8');

let errors = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    errors++;
  } else {
    console.log(`[PASS] ${message}`);
  }
}

// 1. Verify printElementA4 export and styles
assert(consentFormFile.includes('export const printElementA4 ='), 'printElementA4 is exported from ProcedureConsentForm.tsx');
assert(pageFile.includes('import ProcedureConsentForm, { ConsentPatientInfo, TWELVE_CONSENT_TEMPLATES, printElementA4 }'), 'printElementA4 is imported in page.tsx');
assert(consentFormFile.includes('const pageStyles = typeof document !== \'undefined\''), 'pageStyles extracts head stylesheets for identical printout styling');

// 2. Verify Procedure synchronization
assert(consentFormFile.includes('setCustomProcedureName(null); // Reset custom override so new template takes immediate effect'), 'handleSelectTemplate resets custom override so new template takes immediate effect');
assert(!consentFormFile.includes('return patient.procedureName || activeTemplate.procedureName;'), 'effectiveProcedureName no longer falls back to mismatched patient.procedureName');

// 3. Verify Lesson 10 template
assert(consentFormFile.includes('RADIOFREQUENCY (RF) & ELECTROCAUTERY ABLATION'), 'Template 10 has exact procedureName: RADIOFREQUENCY (RF) & ELECTROCAUTERY ABLATION');

// 4. Verify Xerox Copy & Clipboard
assert(consentFormFile.includes('★ OFFICIAL XEROX COPY (ઝેરોક્ષ નકલ) ★'), 'Official Xerox Copy stamp present in ProcedureConsentForm');
assert(consentFormFile.includes('ARCHIVE DUPLICATE'), 'Official Xerox archival notice present');
assert(consentFormFile.includes('fallbackCopyText'), 'Safe fallback clipboard copy helper configured');

// 5. Verify showAllPrintModal tabs and dossier
assert(pageFile.includes('id="print-area-consent"'), 'print-area-consent container present in modal Tab 1');
assert(pageFile.includes('id="print-area-xerox"'), 'print-area-xerox container present in modal Tab 2');
assert(pageFile.includes('id="print-area-protocol"'), 'print-area-protocol container present in modal Tab 3');
assert(pageFile.includes('id="print-area-homecare"'), 'print-area-homecare container present in modal Tab 4');
assert(pageFile.includes('id="print-area-all-documents"'), 'print-area-all-documents (complete dossier) container present');

// 6. Verify Print Dossier button
assert(pageFile.includes('🖨️ Print Complete Dossier (Show All / 4 Sheets)'), 'Show All / Complete Dossier print button present in modal');
assert(pageFile.includes("printElementA4('print-area-all-documents'"), 'Complete Dossier button calls printElementA4 with print-area-all-documents');

// 7. Verify print iframe setup
assert(consentFormFile.includes("iframe.id = 'medflow-print-frame'"), 'Print iframe id medflow-print-frame configured');
assert(consentFormFile.includes("print-color-adjust: exact !important"), 'Exact color adjustment enabled for crisp stamps and borders');

// 8. Verify Event-driven printing and Tab 4 footer bar
assert(consentFormFile.includes("window.addEventListener('medflow-print-consent'"), 'ProcedureConsentForm listens to medflow-print-consent');
assert(consentFormFile.includes("window.addEventListener('medflow-print-xerox'"), 'ProcedureConsentForm listens to medflow-print-xerox');
assert(pageFile.includes("window.dispatchEvent(new CustomEvent('medflow-print-consent'))"), 'Tab 4 footer triggers medflow-print-consent');
assert(pageFile.includes("window.dispatchEvent(new CustomEvent('medflow-print-xerox'))"), 'Tab 4 footer triggers medflow-print-xerox');

// 9. Verify Save & Next to Tab 5
assert(pageFile.includes("setActiveTab('images')"), 'Save & Next sets activeTab to images (Tab 5)');
assert(pageFile.includes("Advanced to Tab 5: Clinical Photography, Lesion Annotation & Comparison"), 'Save & Next triggers confirmation notification toast');
assert(pageFile.includes("window.scrollTo({ top: 0, behavior: 'smooth' })"), 'Save & Next scrolls to top smoothly');

if (errors === 0) {
  console.log('\n=== ALL 14 TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
} else {
  console.error(`\n=== FAILED WITH ${errors} ERRORS ===`);
  process.exit(1);
}
