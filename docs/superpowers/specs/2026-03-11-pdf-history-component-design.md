# PDF History Component Design

## Problem

- `pdfUrl` is a plain text field showing a raw path — not clickable, not user-friendly
- Multiple PDF generations create multiple media entries, but only the latest is tracked
- DownloadPdfButton never appeared because `pdfUrl` was never set (now fixed, but architecture is still fragile)

## Solution

Replace the `pdfUrl` text field with a `generatedPdfs` relationship (hasMany) to the media collection, and add a custom `PdfHistory` sidebar component.

## Data Model

- Remove `pdfUrl` (text) from invoices and quotes collections
- Add `generatedPdfs` (relationship, hasMany) to configured media collection
  - `admin: { readOnly: true, position: 'sidebar' }`
  - Managed programmatically by hooks/endpoints only

## Components

### PdfHistory (new)

- Sidebar UI component
- Reads `generatedPdfs` from form state
- Fetches related media docs for filenames/URLs
- Renders ordered list (most recent first):
  - Clickable full URL link (`{serverURL}/api/{mediaCollection}/file/{filename}`) — opens in new tab
  - Delete button per entry: removes media doc + unlinks from relationship array
- Shows empty state when no PDFs exist

### DownloadPdfButton (modified)

- Reads `generatedPdfs` from form state
- Gets the first (most recent) entry
- Links to its full URL for download
- Hidden when `generatedPdfs` is empty

### GeneratePdfButton (unchanged)

- Keeps the save-first hint message
- No changes needed

## Hook/Endpoint Changes

### generate-pdf.ts (afterChange hook)

- After uploading PDF to media: push new media doc ID to `generatedPdfs` array (instead of setting `pdfUrl`)
- Read existing `generatedPdfs` array, prepend new ID, update document

### generate-pdf.ts (endpoint)

- Same change: push new media doc ID to `generatedPdfs` array

## Removed

- `pdfUrl` field from invoices and quotes collections
- `pdfUrl` references in hooks and endpoints
