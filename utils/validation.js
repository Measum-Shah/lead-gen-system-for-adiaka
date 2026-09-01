import validator from 'validator';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} - { valid: boolean, message: string }
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' };
  }
  
  const trimmedEmail = email.trim();
  
  if (!validator.isEmail(trimmedEmail)) {
    return { valid: false, message: 'Invalid email format' };
  }
  
  return { valid: true, email: trimmedEmail.toLowerCase() };
};

/**
 * Validate and normalize phone number to E.164 format
 * @param {string} phone - Phone number to validate
 * @param {string} defaultCountry - Default country code (e.g., 'PK', 'US')
 * @returns {object} - { valid: boolean, message: string, phone: string }
 */
export const validateAndNormalizePhone = (phone, defaultCountry = 'PK') => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Phone number is required' };
  }
  
  const trimmedPhone = phone.trim();
  
  try {
    // Check if it's a valid phone number for the default country
    if (!isValidPhoneNumber(trimmedPhone, defaultCountry)) {
      return { valid: false, message: 'Invalid phone number format' };
    }
    
    // Parse and format to E.164
    const phoneNumber = parsePhoneNumber(trimmedPhone, defaultCountry);
    
    if (!phoneNumber) {
      return { valid: false, message: 'Unable to parse phone number' };
    }
    
    return { 
      valid: true, 
      phone: phoneNumber.format('E.164'),
      country: phoneNumber.country
    };
  } catch (error) {
    return { valid: false, message: 'Invalid phone number format' };
  }
};

/**
 * Validate name field
 * @param {string} name - Name to validate
 * @returns {object} - { valid: boolean, message: string }
 */
export const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Name is required' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters long' };
  }
  
  if (trimmedName.length > 100) {
    return { valid: false, message: 'Name must not exceed 100 characters' };
  }
  
  return { valid: true, name: trimmedName };
};

/**
 * Validate lead status
 * @param {string} status - Status to validate
 * @returns {object} - { valid: boolean, message: string }
 */
export const validateLeadStatus = (status) => {
  const validStatuses = ['new', 'contacted', 'followed_up', 'converted', 'lost'];
  
  if (!status || typeof status !== 'string') {
    return { valid: false, message: 'Status is required' };
  }
  
  if (!validStatuses.includes(status)) {
    return { 
      valid: false, 
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    };
  }
  
  return { valid: true, status };
};

/**
 * Validate date format (ISO 8601)
 * @param {string} date - Date string to validate
 * @returns {object} - { valid: boolean, message: string }
 */
export const validateDate = (date) => {
  if (!date) {
    return { valid: true, date: null }; // Date is optional
  }
  
  if (!validator.isISO8601(date)) {
    return { valid: false, message: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)' };
  }
  
  const parsedDate = new Date(date);
  
  if (isNaN(parsedDate.getTime())) {
    return { valid: false, message: 'Invalid date value' };
  }
  
  return { valid: true, date: parsedDate };
};

/**
 * Validate lead submission data (for webhook endpoint)
 * @param {object} data - Lead data to validate
 * @returns {object} - { valid: boolean, errors: array, data: object }
 */
export const validateLeadSubmission = (data) => {
  const errors = [];
  const validatedData = {};
  
  // Validate name
  const nameValidation = validateName(data.name);
  if (!nameValidation.valid) {
    errors.push(nameValidation.message);
  } else {
    validatedData.name = nameValidation.name;
  }
  
  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.push(emailValidation.message);
  } else {
    validatedData.email = emailValidation.email;
  }
  
  // Validate phone
  const defaultCountry = process.env.DEFAULT_COUNTRY_CODE || 'PK';
  const phoneValidation = validateAndNormalizePhone(data.phone, defaultCountry);
  if (!phoneValidation.valid) {
    errors.push(phoneValidation.message);
  } else {
    validatedData.phone = phoneValidation.phone;
  }
  
  // Optional source field
  if (data.source) {
    validatedData.source = data.source.trim();
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: validatedData
  };
};
