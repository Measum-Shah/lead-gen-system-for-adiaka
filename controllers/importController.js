import Lead from '../models/Lead.js';
import * as xlsx from 'xlsx';

/**
 * Preview uploaded CSV/XLSX
 */
export const previewImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON, getting raw rows
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (data.length === 0) {
      return res.status(400).json({ success: false, message: 'Empty file' });
    }

    const headers = data[0] || [];
    // Provide a few rows of preview
    const previewRows = data.slice(1, 4);

    res.json({
      success: true,
      headers,
      previewRows
    });
  } catch (error) {
    console.error('Error previewing file:', error);
    res.status(500).json({ success: false, message: 'Failed to process file' });
  }
};

/**
 * Import Leads
 * Accepts formData with `file` and `mapping` (JSON string)
 */
export const importLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    if (!req.body.mapping) {
      return res.status(400).json({ success: false, message: 'Column mapping required' });
    }

    const mapping = JSON.parse(req.body.mapping);
    if (!mapping.email) {
      return res.status(400).json({ success: false, message: 'Email column must be mapped' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length < 2) {
      return res.status(400).json({ success: false, message: 'File has no data rows' });
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Build map from header name to index
    const headerToIndex = {};
    headers.forEach((h, i) => {
      if (h) headerToIndex[h.trim()] = i;
    });

    const firstNameIdx = mapping.firstName ? headerToIndex[mapping.firstName] : -1;
    const lastNameIdx = mapping.lastName ? headerToIndex[mapping.lastName] : -1;
    const emailIdx = headerToIndex[mapping.email];
    const phoneIdx = mapping.phone ? headerToIndex[mapping.phone] : -1;

    let imported = 0;
    let duplicatesSkipped = 0;
    let invalidRows = 0;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    for (const row of rows) {
      const email = emailIdx >= 0 ? (row[emailIdx] || '').toString().trim().toLowerCase() : '';
      const fName = firstNameIdx >= 0 ? (row[firstNameIdx] || '').toString().trim() : '';
      const lName = lastNameIdx >= 0 ? (row[lastNameIdx] || '').toString().trim() : '';
      
      let name = [fName, lName].filter(Boolean).join(' ') || 'Unknown';
      let phone = phoneIdx >= 0 ? (row[phoneIdx] || '').toString().trim() : '';

      if (!email || !emailRegex.test(email)) {
        invalidRows++;
        continue;
      }

      // Format USA phone number (starts with 1) to E.164 (+1...)
      if (phone) {
        let digits = phone.replace(/(?!^\+)[^\d]/g, '');
        if (digits.length === 10) {
          phone = '+1' + digits;
        } else if (digits.startsWith('1') && digits.length === 11) {
          phone = '+' + digits;
        } else if (!digits.startsWith('+')) {
          phone = '+' + digits;
        }
      } else {
        // Phone is required by the Lead model, provide dummy if empty to prevent validation failure
        phone = '+10000000000';
      }

      // Check for duplicates
      const existing = await Lead.findOne({ email });
      if (existing) {
        duplicatesSkipped++;
        continue;
      }

      // Create imported lead
      const newLead = new Lead({
        name,
        email,
        phone,
        leadType: 'imported',
        campaignStatus: 'followup1_pending',
        importedAt: new Date(),
        followup1DueAt: twoDaysFromNow
      });
      await newLead.save();
      imported++;
    }

    res.json({
      success: true,
      summary: {
        totalRows: rows.length,
        imported,
        duplicatesSkipped,
        invalidRows
      }
    });

  } catch (error) {
    console.error('Error importing leads:', error);
    res.status(500).json({ success: false, message: 'Import failed: ' + error.message });
  }
};
