# Product Requirement Document (PRD)

## Project Name: Temple Fund & Devotee Bulletin Ecosystem

**Document Version:** 1.0

**Date:** July 14, 2026

**Status:** Approved for Implementation

## 1. Executive Summary & Core Concept

This platform functions as a digital, interactive bulletin board designed to streamline temple operations, handle event-specific registrations, and track crowd-sourced material funding. It removes administrative friction by allowing devotees to register family details (_Sankalpam_), sponsor specific ritual materials, make QR-based payments, and automatically receive verified updates alongside direct communication tools to notify the temple priest (_poojari/pusari_).

## 2. Architecture & System Flow

### 2.1 End-User (Devotee) Journey

```
[ Homepage / Auto-Scroll Carousel ] ──(Click Poster)──> [ Jump & Expand Prayer Form ]
                                                                     │
[ Receipt Email & WhatsApp Link ] <── [ Success Screen + Upload Receipt ] <──┘
```

1. **Landing & Discovery:** Devotee lands on the homepage featuring a 5-second auto-scrolling hero carousel displaying active event posters.
    
2. **Targeted Redirection:** Clicking an event poster triggers a smooth anchor-scroll down to the corresponding bulletin grid card and automatically expands the participation form.
    
3. **Form Completion:** Devotee fills out contact info, builds an optional list of family members with _Natchatram_ and _Rasi_ parameters, and chooses optional material items to sponsor.
    
4. **Payment Action:** The UI calculates the total dynamically (Base Fee + Sponsored Materials). The devotee scans the integrated DuitNow / Touch 'n Go QR code, makes the payment via their banking app, and uploads the transaction screenshot.
    
5. **Pending Status Notification:** Devotee immediately receives a transactional email detailing their registration with a **STATUS: PENDING** badge.
    
6. **Approval & Activation:** Once the administrator verifies the bank ledger, the status updates to **APPROVED**. A confirmation email is dispatched containing an active dynamic WhatsApp link to forward details to the priest.
    

### 2.2 Administrator Workflow

```
[ Secure Login ] ──> [ Monitoring Dashboard ] ──> ├─> [ Manage Events & Upload Posters ]
                                                   ├─> [ Financial Audit Queue ] ──> [ Approve / Reject ]
                                                   └─> [ Donation Goals Tracking ]
```

1. **Event Creation:** Admin creates a prayer card, sets pricing, defines required material thresholds, and uploads a graphic asset to toggled display inside the top horizontal carousel.
    
2. **Verification Control:** Admin monitors incoming receipts via the Financial Audit queue.
    
3. **Automated Reconciliation:** Clicking `[ Approve ]` instantly shifts the public frontend material progress percentages, converts the devotee status to **APPROVED**, and fires out the final email communication.
    

## 3. Core Functional Features & Requirements

### 3.1 Top Auto-Scrolling Carousel

- **Interval:** 5 seconds hard-coded slide translation.
    
- **Behavior:** Infinite horizontal loop layout. Touch swipe support enabled for mobile browsers.
    
- **Navigation:** Click event links directly to the element ID anchor (`#evt-id`) of the matching bulletin card below.
    

### 3.2 Dynamic Language Localization

- **Mechanism:** Floating global selector switch in the header layer (**EN | தமிழ் | BM**).
    
- **Scope:** Translates static system components, validation warnings, labels, and administrative input forms seamlessly on the fly. User-generated content remains in its input state.
    

### 3.3 Dynamic Material Sponsorship System

- **Behavior:** Prevents over-sponsorship by pulling real-time target quantities. When an item hits 100%, the selection choice locks automatically on the devotee frontend form and displays a **[Filled]** indicator badge.
    

### 3.4 Interactive 3D Murti Render

- **Behavior:** Implemented via a lightweight WebGL element (`<model-viewer>` or basic `Three.js` footprint) positioned cleanly in the website header space, functioning as an interactive virtual darshan optimized for fast mobile load speeds.
    

## 4. Refined Database Schema & Data Models

To ensure compatibility with relational backend platforms (such as Supabase) or clean spreadsheet exports, the system data architecture is split into three main relational entities.

### Table A1: Main Event Setup (Admin Parent Table)

Defines the structure for creating individual bulletin board listings.

|**Column Field**|**Data Type**|**Constraint / UI Control**|**Description / Example**|
|---|---|---|---|
|`event_id`|UUID / String|Auto-generated, Primary Key|`EVT-2026-002`|
|`event_name`|Text|Required Text Input|Durga Abhishegam (Durga Asthami)|
|`featured_poster`|URL / Text|Image Drag & Drop Upload|Link to stored cloud file storage bucket|
|`show_in_carousel`|Boolean|Toggle Switch (True/False)|Controls insertion into top slider bar|
|`cost_per_pax`|Numeric|Decimal Input Field|`31.00`|
|`abhishegam_time`|Text|Text Input Field|`04:00 PM - 07:30 PM`|
|`pooja_start_time`|Time|Time Picker UI|`20:00:00`|
|`special_notes`|Text|Textarea Field|_Note: 7.30 PM is Sani time._|
|`status`|Dropdown|Options: Draft / Active / Archived|Controls visibility on frontend bulletin grid|

### Table A2: Material Funding Items (Dynamic Sub-Items Child Table)

Tracks the raw itemized materials tied by relationship constraints to a primary parent event.

|**Column Field**|**Data Type**|**Constraint / UI Control**|**Description / Example**|
|---|---|---|---|
|`item_id`|UUID / String|Auto-generated, Primary Key|`MAT-00941`|
|`event_id`|UUID / String|Foreign Key linking Table A1|`EVT-2026-002`|
|`material_name`|Text|Text Input Box|_Paal_ (Milk)|
|`target_quantity`|Numeric|Integer/Decimal Input|`20`|
|`unit_type`|Dropdown|Options: Liters / KG / Bottles|Liters|
|`qty_received`|Numeric|Calculated Value (ReadOnly field)|`15` (Increments on Admin approval)|
|`funding_status`|Dropdown|Calculated: Open / Filled|Auto-switches to **Filled** when qty reaches target|

### Table B: Devotee Submission Log & Financial Audit Ledger

Stores the structural transaction input generated by end-user interactions.

|**Column Field**|**Data Type**|**Constraint / UI Control**|**Description / Example**|
|---|---|---|---|
|`receipt_id`|UUID / String|Auto-generated, Primary Key|`REC-99422`|
|`created_at`|Timestamp|Auto-generated on Submission|`14/07/2026 14:30:22`|
|`event_id`|UUID / String|Foreign Key linking Table A1|`EVT-2026-002`|
|`devotee_name`|Text|Required Text Input|Kunalan A/L Thamudaran|
|`devotee_whatsapp`|Text|Validation matching international layout|`+60123456789`|
|`devotee_email`|Text|Email Address Standard Layout|`kunalan@email.com`|
|`primary_natchatram`|Dropdown|Optional (27 Astro options list)|Anusham|
|`primary_rasi`|Dropdown|Optional (12 Zodiac options list)|Viruchigam|
|`family_json`|JSONB / Text|Expandable array of map items|`[{"name": "Ambiga", "natchatram": "Aswini", "rasi": "Mesham"}]`|
|`sponsored_items`|JSONB / Text|Structured Checklist Array|`[{"item_id": "MAT-00941", "qty_given": 5}]`|
|`total_amount_paid`|Numeric|Dynamically calculated float value|`31.00`|
|`payment_proof`|URL / Text|Image Upload Attachment|Link to uploaded transaction receipt image|
|`admin_approval`|Dropdown|UI Toggle Control|**Pending / Approved / Rejected**|

## 5. Automated Communication Specifications

### 5.1 System Transactional Emails

#### Template 1: Instant Submission Confirmation (Fired instantly upon submission)

- **Subject:** Prayer Registration Received [Ref: `{{receipt_id}}`]
    
- **Status Badge:** PENDING ADMIN VERIFICATION
    
- **Core Body:** Summary of the primary registrant, dynamic sub-table rendering family configurations, chosen material items, and an explicit statement informing the devotee that the deposit ledger is being verified.
    

#### Template 2: Admin Approved Notification (Fired when Admin sets status toggle to Approved)

- **Subject:** Prayer Confirmed & Approved! [Ref: `{{receipt_id}}`]
    
- **Status Badge:** CONFIRMED / VERIFIED
    
- **Core Action Button:** Displays a distinct green interactive element embedded in the email body frame that redirects natively into the WhatsApp routing engine.
    

### 5.2 Dynamic Priest WhatsApp Layout Routing

- **API Structure URL:** `[https://wa.me/](https://wa.me/){{priest_phone}}?text={{url_encoded_string}}`
    
- **Output Message Layout Template:**
    

Plaintext

```
🛕 *Temple Prayer & Material Sponsorship* 🛕
----------------------------------------
*Event:* {{TableA1.event_name}}
*Reference ID:* {{TableB.receipt_id}}

📋 *Sankalpam Details:*
• 1. {{TableB.devotee_name}} ({{TableB.primary_natchatram}} / {{TableB.primary_rasi}})
{{#each TableB.family_json}}
• {{this.index}}. {{this.name}} ({{this.natchatram}} / {{this.rasi}})
{{/each}}

🎁 *Material Contributions Sponsored:*
{{#each TableB.sponsored_items}}
• {{this.material_name}}: {{this.qty_given}} {{this.unit_type}}
{{/each}}

💰 *Payment Details:*
• Amount Transferred: RM {{TableB.total_amount_paid}}
• Verification Status: Verified & Confirmed by Admin

📎 _Please attach your payment screenshot along with this message._
----------------------------------------
```

## 6. Non-Functional & Security Requirements

- **Mobile Responsiveness:** Forms must use responsive, single-column container adjustments when rendered on dynamic viewport dimensions under 768px wide.
    
- **Audit Trail Security:** Deletion of any entry in Table B from the front-end dashboard is strictly forbidden; records can only be shifted into an `Archived` context state to preserve permanent financial auditing transparency.