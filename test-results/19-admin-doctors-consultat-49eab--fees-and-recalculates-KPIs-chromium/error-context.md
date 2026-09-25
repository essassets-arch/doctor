# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 19-admin-doctors-consultation-fees.spec.ts >> Module I: Doctor Management & Consultation Fee Governance (/admin/doctors) >> 03. Quick Fee Decider Modal updates Dr. Raj Valaki consultation fees and recalculates KPIs
- Location: e2e\19-admin-doctors-consultation-fees.spec.ts:69:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Consultation fees for Dr\. Raj Valaki updated/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText(/Consultation fees for Dr\. Raj Valaki updated/i) with timeout 5000ms
  - waiting for getByText(/Consultation fees for Dr\. Raj Valaki updated/i)

```

```yaml
- alert
- complementary:
  - link "MEDFLOW ADMIN APEX":
    - /url: /admin/dashboard
  - button "Collapse Sidebar"
  - textbox "Search admin modules..."
  - text: CORE INTELLIGENCE
  - link "Executive Dashboard":
    - /url: /admin/dashboard
  - link "BI Reports & Analytics":
    - /url: /admin/reports
  - text: WORKFORCE & HRMS
  - link "Doctor Management":
    - /url: /admin/doctors
  - link "Staff & RBAC Accounts":
    - /url: /admin/staff
  - link "HRMS & Attendance":
    - /url: /admin/hrms
  - text: CLINICAL OPERATIONS
  - link "Patient Master Registry":
    - /url: /admin/patients
  - link "Appointments & Holidays":
    - /url: /admin/appointments
  - link "Automated Communications":
    - /url: /admin/notifications
  - text: FINANCIAL GOVERNANCE
  - link "Billing & Revenue Audit":
    - /url: /admin/billing
  - link "UPI & Payment QR":
    - /url: /admin/payment-management
  - link "Clinic Expense Vouchers":
    - /url: /admin/expenses
  - text: CLINICAL MASTERS
  - link "Procedure Master":
    - /url: /admin/procedures
  - link "Central Drug Formulary 3 Low":
    - /url: /admin/drugs
  - link "Diagnostic Lab Masters":
    - /url: /admin/lab
  - link "Legal Consent Templates":
    - /url: /admin/consent-forms
  - text: CYBER DEFENSE & SYSTEM
  - link "Security SOC & Lockdown 1 Threat":
    - /url: /admin/security-command-center
  - link "Clinic Settings & Rx":
    - /url: /admin/settings
  - link "Support & Diagnostics":
    - /url: /admin/support
  - text: KP Dr. Kalp Patel Medical Director • P1
  - link "Admin Settings":
    - /url: /admin/settings
- banner:
  - text: WORKFORCE & HRMS
  - heading "Doctor Management" [level=2]
  - button "Enter Fullscreen"
  - button "SA Superadmin Apex Director"
- main:
  - text: Physician Workforce & Tariff Governance • Multi-Specialty Clinical Roster
  - heading "Doctor Management & Consultation Fee Governance" [level=1]
  - paragraph: Decide and configure consultation tariffs (First Visit, Review Follow-Up, Emergency Walk-in, Teleconsult), OPD room allocations, slot durations, and active duty roster for all hospital physicians.
  - button "Export Tariff Matrix"
  - button "+ Onboard New Doctor"
  - text: Active Duty Roster 5 Active Across 6 total hospital physicians Avg OPD Consultation Fee ₹725 Standard OPD First Visit Tariff Clinic Fee Range ₹600 – ₹1000 General to Specialist Tier Avg Follow-Up Review ₹425 7 to 10-Day Free Grace Period Specialities Covered 6 Disciplines Multi-Speciality Practice Apex
  - 'textbox "Search by Doctor Name, Specialty, Qualification, Room, or Reg #..."'
  - combobox:
    - option "All Specialities (6)" [selected]
    - option "Dermatology & Cosmetology"
    - option "Internal & General Medicine"
    - option "Obstetrics & Gynecology"
    - option "Orthopedics & Joint Care"
    - option "Cardiology & Critical Care"
    - option "Aesthetic Dermatology & Laser"
  - combobox:
    - option "Sort by Name (A-Z)" [selected]
    - option "Consultation Fee (High to Low)"
    - option "Consultation Fee (Low to High)"
    - option "Sort by Speciality"
  - text: "Roster Filter:"
  - button "All Doctors 6"
  - button "Active on Duty 5"
  - button "On Leave / Off 1"
  - text: Showing
  - strong: "6"
  - text: of 6 Doctors
  - button "Cards"
  - button "Tariff Matrix"
  - text: "AS Dr. Anita Soni Internal & General Medicine MBBS, MD (General Medicine) • Reg: G-39102"
  - button "ACTIVE"
  - text: "Cabin 2 (Room 102) 15 Mins / Slot Schedule: Mon–Sat: 10:00 AM – 02:00 PM & 05:00 PM – 08:00 PM Consultation Fee Tariffs"
  - button "Decide Fees"
  - text: FIRST VISIT OPD
  - strong: ₹650
  - text: FOLLOW-UP REVIEW
  - strong: ₹400
  - text: Free within 7d EMERGENCY / WALK-IN
  - strong: ₹900
  - text: TELECONSULTATION
  - strong: ₹500
  - text: +91 98251 00002
  - button "Edit Profile"
  - button "Remove Doctor"
  - text: "KP Dr. Kalp Patel Cardiology & Critical Care MBBS, MD (Med), FCCP (USA) • Reg: G-29001"
  - button "ACTIVE"
  - text: "Apex Director Suite (Room 100) 20 Mins / Slot Schedule: Tue, Thu, Sat: 09:00 AM – 01:00 PM Consultation Fee Tariffs"
  - button "Decide Fees"
  - text: FIRST VISIT OPD
  - strong: ₹1000
  - text: FOLLOW-UP REVIEW
  - strong: ₹600
  - text: Free within 14d EMERGENCY / WALK-IN
  - strong: ₹1500
  - text: TELECONSULTATION
  - strong: ₹850
  - text: +91 98251 00005
  - button "Edit Profile"
  - button "Remove Doctor"
  - text: "PM Dr. Priya Mehta Obstetrics & Gynecology MBBS, MS (OBGYN), DGO • Reg: G-44189"
  - button "ACTIVE"
  - text: "Cabin 3 (Room 103) 15 Mins / Slot Schedule: Mon–Sat: 10:00 AM – 01:00 PM Consultation Fee Tariffs"
  - button "Decide Fees"
  - text: FIRST VISIT OPD
  - strong: ₹600
  - text: FOLLOW-UP REVIEW
  - strong: ₹350
  - text: Free within 10d EMERGENCY / WALK-IN
  - strong: ₹1000
  - text: TELECONSULTATION
  - strong: ₹500
  - text: +91 98251 00003
  - button "Edit Profile"
  - button "Remove Doctor"
  - text: "RV Dr. Raj Valaki Dermatology & Cosmetology MBBS, MD (Dermatology), DNB • Reg: G-48291"
  - button "ACTIVE"
  - text: "Cabin 1 (Room 101) 15 Mins / Slot Schedule: Mon–Sat: 09:00 AM – 01:00 PM & 04:00 PM – 08:00 PM Consultation Fee Tariffs"
  - button "Decide Fees"
  - text: FIRST VISIT OPD
  - strong: ₹600
  - text: FOLLOW-UP REVIEW
  - strong: ₹300
  - text: Free within 7d EMERGENCY / WALK-IN
  - strong: ₹800
  - text: TELECONSULTATION
  - strong: ₹450
  - text: +91 98251 00001
  - button "Edit Profile"
  - button "Remove Doctor"
  - text: "SJ Dr. Sarah Jenkins Aesthetic Dermatology & Laser MD (Aesthetic Derm), Dip. Cosmetology (UK) • Reg: G-56199"
  - button "ON LEAVE"
  - text: "Laser Suite (Room 105) 20 Mins / Slot Schedule: Mon–Fri: 11:00 AM – 04:00 PM Consultation Fee Tariffs"
  - button "Decide Fees"
  - text: FIRST VISIT OPD
  - strong: ₹800
  - text: FOLLOW-UP REVIEW
  - strong: ₹500
  - text: Free within 7d EMERGENCY / WALK-IN
  - strong: ₹1200
  - text: TELECONSULTATION
  - strong: ₹700
  - text: +91 98251 00006
  - button "Edit Profile"
  - button "Remove Doctor"
  - text: "SK Dr. Suresh Kumar Orthopedics & Joint Care MBBS, MS (Ortho), Fellowship Arthroscopy • Reg: G-51042"
  - button "ACTIVE"
  - text: "Cabin 4 (Room 104) 20 Mins / Slot Schedule: Mon, Wed, Fri: 09:00 AM – 02:00 PM Consultation Fee Tariffs"
  - button "Decide Fees"
  - text: FIRST VISIT OPD
  - strong: ₹700
  - text: FOLLOW-UP REVIEW
  - strong: ₹400
  - text: Free within 7d EMERGENCY / WALK-IN
  - strong: ₹1200
  - text: TELECONSULTATION
  - strong: ₹600
  - text: +91 98251 00004
  - button "Edit Profile"
  - button "Remove Doctor"
- button "Staff Intercom (0)"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Module I: Doctor Management & Consultation Fee Governance (/admin/doctors)', () => {
  4   | 
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/admin/doctors');
  7   |     await page.waitForLoadState('networkidle');
  8   |   });
  9   | 
  10  |   test('01. Doctors page loads with 5 Governance KPIs, consultation fee tariffs, and action bar', async ({ page }) => {
  11  |     // 1. Verify header
  12  |     await expect(page.locator('main h1').filter({ hasText: /Doctor Management/i })).toBeVisible();
  13  |     await expect(page.getByText(/Physician Workforce & Tariff Governance/i)).toBeVisible();
  14  | 
  15  |     // 2. Verify 5 KPI cards
  16  |     await expect(page.getByText('Active Duty Roster').first()).toBeVisible();
  17  |     await expect(page.getByText(/Avg OPD Consultation Fee/i).first()).toBeVisible();
  18  |     await expect(page.getByText('Clinic Fee Range').first()).toBeVisible();
  19  |     await expect(page.getByText(/Avg Follow-Up Review/i).first()).toBeVisible();
  20  |     await expect(page.getByText(/Specialities Covered/i).first()).toBeVisible();
  21  | 
  22  |     // 3. Verify primary action buttons
  23  |     await expect(page.getByText('+ Onboard New Doctor')).toBeVisible();
  24  |     await expect(page.getByText(/Export Tariff Matrix/i)).toBeVisible();
  25  | 
  26  |     // 4. Verify initial doctor cards (Dr. Raj Valaki, Dr. Anita Soni, etc.)
  27  |     await expect(page.getByText('Dr. Raj Valaki')).toBeVisible();
  28  |     await expect(page.getByText('Dr. Anita Soni')).toBeVisible();
  29  |     await expect(page.getByText('Dr. Priya Mehta')).toBeVisible();
  30  | 
  31  |     // 5. Verify Consultation Fee Tariffs breakdown on Dr. Raj Valaki's card (id: doc-1)
  32  |     const rajCard = page.locator('[data-testid="doctor-card-doc-1"]');
  33  |     await expect(rajCard).toBeVisible();
  34  |     await expect(rajCard.getByText('Consultation Fee Tariffs')).toBeVisible();
  35  |     await expect(rajCard.getByText('FIRST VISIT OPD')).toBeVisible();
  36  |     await expect(rajCard.getByText('FOLLOW-UP REVIEW')).toBeVisible();
  37  |     await expect(rajCard.getByText('EMERGENCY / WALK-IN')).toBeVisible();
  38  |     await expect(rajCard.getByText('TELECONSULTATION')).toBeVisible();
  39  |   });
  40  | 
  41  |   test('02. Dual View toggle switches between Card Grid and Tariff Matrix Table', async ({ page }) => {
  42  |     // Initial view should be Cards
  43  |     const cardsBtn = page.locator('[data-testid="view-mode-cards"]');
  44  |     const tableBtn = page.locator('[data-testid="view-mode-table"]');
  45  | 
  46  |     await expect(cardsBtn).toBeVisible();
  47  |     await expect(tableBtn).toBeVisible();
  48  | 
  49  |     // Switch to Tariff Matrix table view
  50  |     await tableBtn.click();
  51  | 
  52  |     // Verify table elements
  53  |     await expect(page.locator('table')).toBeVisible();
  54  |     await expect(page.locator('th').filter({ hasText: /Doctor & Speciality/i })).toBeVisible();
  55  |     await expect(page.locator('th').filter({ hasText: /OPD First Visit/i })).toBeVisible();
  56  |     await expect(page.locator('th').filter({ hasText: /Follow-Up Fee/i })).toBeVisible();
  57  |     await expect(page.locator('th').filter({ hasText: /Emergency Fee/i })).toBeVisible();
  58  |     await expect(page.locator('th').filter({ hasText: /Teleconsult Fee/i })).toBeVisible();
  59  |     await expect(page.locator('th').filter({ hasText: /Grace Window/i })).toBeVisible();
  60  | 
  61  |     // Row for Dr. Raj Valaki in table
  62  |     await expect(page.locator('[data-testid="doctor-row-doc-1"]')).toBeVisible();
  63  | 
  64  |     // Switch back to Cards view
  65  |     await cardsBtn.click();
  66  |     await expect(page.locator('[data-testid="doctor-card-doc-1"]')).toBeVisible();
  67  |   });
  68  | 
  69  |   test('03. Quick Fee Decider Modal updates Dr. Raj Valaki consultation fees and recalculates KPIs', async ({ page }) => {
  70  |     // Click "Decide Fees" button on Dr. Raj Valaki's card
  71  |     const feeDecideBtn = page.locator('[data-testid="decide-fees-btn-doc-1"]');
  72  |     await expect(feeDecideBtn).toBeVisible();
  73  |     await feeDecideBtn.click();
  74  | 
  75  |     // Verify Modal appears
  76  |     await expect(page.getByText('Consultation Fee Decider')).toBeVisible();
  77  |     await expect(page.getByText(/Decide Fees for Dr\. Raj Valaki/i)).toBeVisible();
  78  | 
  79  |     // Locate +₹50 stepper button and click it to bump fee
  80  |     const stepUp50Btn = page.locator('button').filter({ hasText: '+₹50' }).first();
  81  |     await expect(stepUp50Btn).toBeVisible();
  82  |     await stepUp50Btn.click(); // +50
  83  |     await stepUp50Btn.click(); // +50
  84  | 
  85  |     // Save and commit fees
  86  |     const saveBtn = page.locator('button').filter({ hasText: /Save & Apply Consultation Fees/i });
  87  |     await expect(saveBtn).toBeVisible();
  88  |     await saveBtn.click();
  89  | 
  90  |     // Verify toast notification
> 91  |     await expect(page.getByText(/Consultation fees for Dr\. Raj Valaki updated/i)).toBeVisible();
      |                                                                                    ^ Error: expect(locator).toBeVisible() failed
  92  |   });
  93  | 
  94  |   test('04. Onboard New Doctor modal adds physician with specific consultation tariffs', async ({ page }) => {
  95  |     // Click "+ Onboard New Doctor"
  96  |     await page.getByText('+ Onboard New Doctor').click();
  97  | 
  98  |     // Verify Onboarding Modal opened
  99  |     await expect(page.getByText('Add New Physician to Roster')).toBeVisible();
  100 |     await expect(page.getByText(/Decide Consultation Fees & Tariffs/i)).toBeVisible();
  101 | 
  102 |     // Fill form
  103 |     await page.locator('input[placeholder*="Rajesh Patel"]').fill('Dr. Vikram Seth');
  104 |     await page.locator('input[placeholder*="Dermatology"]').fill('Neurology');
  105 |     await page.locator('input[placeholder*="MBBS"]').fill('MBBS, MD, DM (Neurology)');
  106 |     await page.locator('input[placeholder*="G-48291"]').fill('MCI-99482');
  107 |     await page.locator('input[placeholder*="Cabin 1"]').fill('OPD-305');
  108 | 
  109 |     // Save doctor
  110 |     const saveDoctorBtn = page.locator('button').filter({ hasText: /Save & Add Physician/i });
  111 |     await saveDoctorBtn.click();
  112 | 
  113 |     // Verify notification
  114 |     await expect(page.getByText(/Dr\. Vikram Seth successfully added to hospital roster/i)).toBeVisible();
  115 | 
  116 |     // Verify Dr. Vikram Seth appears in the roster
  117 |     await expect(page.getByText('Dr. Vikram Seth')).toBeVisible();
  118 |     await expect(page.getByText('Neurology')).first().toBeVisible();
  119 |     await expect(page.getByText('OPD-305')).first().toBeVisible();
  120 |   });
  121 | 
  122 |   test('05. Doctor status toggle switches between Active and On Leave', async ({ page }) => {
  123 |     // Find status button for Dr. Anita Soni (id: doc-2)
  124 |     const statusToggle = page.locator('[data-testid="toggle-status-btn-doc-2"]');
  125 |     await expect(statusToggle).toBeVisible();
  126 | 
  127 |     // Click to toggle status
  128 |     await statusToggle.click();
  129 | 
  130 |     // Verify status changed toast
  131 |     await expect(page.getByText(/Status updated to/i)).toBeVisible();
  132 |   });
  133 | 
  134 |   test('06. Real-time search and specialty filters filter doctors list', async ({ page }) => {
  135 |     // Search for "Anita"
  136 |     const searchInput = page.locator('input[placeholder*="Search by Doctor Name"]');
  137 |     await searchInput.fill('Anita');
  138 | 
  139 |     // Dr. Anita Soni should be visible, Dr. Raj Valaki should not be
  140 |     await expect(page.getByText('Dr. Anita Soni')).toBeVisible();
  141 |     await expect(page.locator('[data-testid="doctor-card-doc-1"]')).not.toBeVisible();
  142 | 
  143 |     // Clear search
  144 |     await searchInput.clear();
  145 |     await expect(page.locator('[data-testid="doctor-card-doc-1"]')).toBeVisible();
  146 | 
  147 |     // Filter by Specialty "Obstetrics & Gynecology"
  148 |     const specialtySelect = page.locator('select').filter({ hasText: /All Specialities/i });
  149 |     await specialtySelect.selectOption('Obstetrics & Gynecology');
  150 | 
  151 |     // Only Dr. Priya Mehta (Obstetrics & Gynecology) should be shown
  152 |     await expect(page.getByText('Dr. Priya Mehta')).toBeVisible();
  153 |     await expect(page.locator('[data-testid="doctor-card-doc-1"]')).not.toBeVisible();
  154 |   });
  155 | 
  156 |   test('07. Responsive viewport testing with zero horizontal overflow', async ({ page }) => {
  157 |     const viewports = [
  158 |       { width: 375, height: 667, name: 'Mobile' },
  159 |       { width: 768, height: 1024, name: 'Tablet' },
  160 |       { width: 1280, height: 800, name: 'Desktop' },
  161 |     ];
  162 | 
  163 |     for (const vp of viewports) {
  164 |       await page.setViewportSize({ width: vp.width, height: vp.height });
  165 |       await page.waitForTimeout(300);
  166 | 
  167 |       // Verify no horizontal page blowout
  168 |       const hasOverflow = await page.evaluate(() => {
  169 |         return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
  170 |       });
  171 |       expect(hasOverflow).toBeFalsy();
  172 | 
  173 |       // Main header and at least one doctor card should be visible
  174 |       await expect(page.locator('main h1').filter({ hasText: /Doctor Management/i })).toBeVisible();
  175 |       await expect(page.getByText('Dr. Raj Valaki')).toBeVisible();
  176 |     }
  177 |   });
  178 | 
  179 | });
  180 | 
```