const SPREADSHEET_ID = '1trxugWBoe89HKANnnHhqi14tiLrx5Q37EBo4xdoKqLY';
const ORDER_SHEET_NAME = 'Form Responses 1';
const CONTACT_SHEET_NAME = 'Contact Form Responses';
const ADMIN_KEY_PROPERTY = 'ADMIN_KEY';
const ADMIN_HEADERS = ['Request Type', 'Pipeline Status', 'Status Updated', 'Status Note', 'Quoted Price'];
const ADMIN_FALLBACK_START_COLUMN = 21;

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrderSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(ORDER_SHEET_NAME) || spreadsheet.getActiveSheet();
}

function ensureAdminColumns(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), ADMIN_FALLBACK_START_COLUMN + ADMIN_HEADERS.length - 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(header) {
    return String(header || '').trim();
  });
  const firstAdminIndex = headers.indexOf(ADMIN_HEADERS[0]);
  const lastUsedIndex = headers.reduce(function(lastIndex, header, index) {
    return header ? index : lastIndex;
  }, -1);
  const startColumn = firstAdminIndex >= 0
    ? firstAdminIndex + 1
    : Math.max(lastUsedIndex + 2, ADMIN_FALLBACK_START_COLUMN);
  const headerRange = sheet.getRange(1, startColumn, 1, ADMIN_HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const needsHeaders = ADMIN_HEADERS.some((header, index) => currentHeaders[index] !== header);

  if (needsHeaders) {
    headerRange.setValues([ADMIN_HEADERS]);
  }

  return {
    requestType: startColumn,
    pipelineStatus: startColumn + 1,
    statusUpdated: startColumn + 2,
    statusNote: startColumn + 3,
    quotedPrice: startColumn + 4
  };
}

function requireAdminKey(data) {
  const configuredKey = PropertiesService.getScriptProperties().getProperty(ADMIN_KEY_PROPERTY);
  if (!configuredKey) {
    throw new Error('Admin key is not configured. Set the ADMIN_KEY script property in Apps Script.');
  }

  if (!data || data.key !== configuredKey) {
    throw new Error('Unauthorized');
  }
}

function dateToIso(value) {
  const date = parseSheetDate(value);
  if (!date) return '';

  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function parseSheetDate(value) {
  if (!value) return null;

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    const normalized = new Date(value);
    const year = normalized.getFullYear();

    if (year > 0 && year < 100) {
      normalized.setFullYear(2000 + year);
    }

    return normalized;
  }

  const stringValue = String(value).trim();
  const slashDate = stringValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slashDate) {
    const month = parseInt(slashDate[1], 10);
    const day = parseInt(slashDate[2], 10);
    let year = parseInt(slashDate[3], 10);
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(stringValue);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function displayValue(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'M/d/yyyy h:mm a');
  }

  return String(value);
}

function displayDate(value) {
  const date = parseSheetDate(value);
  if (!date) return displayValue(value);

  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'M/d/yyyy');
}

function displayTime(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'h:mm a');
  }

  const stringValue = String(value).trim();
  const timeMatch = stringValue.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!timeMatch) return stringValue;

  if (timeMatch[3]) {
    return `${parseInt(timeMatch[1], 10)}:${timeMatch[2]} ${timeMatch[3].toUpperCase()}`;
  }

  const hour24 = parseInt(timeMatch[1], 10);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const period = hour24 < 12 ? 'AM' : 'PM';
  return `${hour12}:${timeMatch[2]} ${period}`;
}

function sortValue(value) {
  const date = parseSheetDate(value);
  return date ? date.getTime() : 0;
}

function htmlEscape(value) {
  return String(value || '').replace(/[&<>"']/g, function(character) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character];
  });
}

function safeLinkValue(value) {
  return htmlEscape(String(value || '').replace(/[\r\n]/g, '').trim());
}

function publicErrorMessage(error) {
  if (error && String(error.message || error) === 'Unauthorized') {
    return 'Unauthorized.';
  }

  return 'Request could not be completed.';
}

function buildOrderRequest(row, rowNumber, adminColumns) {
  const timestampSort = sortValue(row[0]);

  return {
    rowNumber: rowNumber,
    timestamp: displayValue(row[0]),
    timestampSort: timestampSort,
    name: displayValue(row[1]),
    email: displayValue(row[2]),
    phone: displayValue(row[3]),
    shape: displayValue(row[4]),
    layers: displayValue(row[5]),
    size: displayValue(row[6]),
    servings: displayValue(row[7]),
    flavors: displayValue(row[8]),
    extras: displayValue(row[9]),
    colors: displayValue(row[10]),
    message: displayValue(row[11]),
    occasion: displayValue(row[12]),
    eventDate: displayDate(row[14]),
    eventDateIso: dateToIso(row[14]),
    pickupTime: displayTime(row[15]),
    delivery: displayValue(row[16]),
    allergies: displayValue(row[19]),
    requestType: displayValue(row[adminColumns.requestType - 1]) || 'Order Request',
    status: displayValue(row[adminColumns.pipelineStatus - 1]) || 'New',
    statusUpdated: displayValue(row[adminColumns.statusUpdated - 1]),
    statusNote: displayValue(row[adminColumns.statusNote - 1]),
    quotedPrice: displayValue(row[adminColumns.quotedPrice - 1])
  };
}

function listOrderRequests(data) {
  requireAdminKey(data);

  const sheet = getOrderSheet();
  const adminColumns = ensureAdminColumns(sheet);

  const values = sheet.getDataRange().getValues();
  const requests = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0] && !row[1] && !row[2]) continue;

    requests.push(buildOrderRequest(row, i + 1, adminColumns));
  }

  requests.sort(function(a, b) {
    return (b.timestampSort - a.timestampSort) || (b.rowNumber - a.rowNumber);
  });

  return jsonResponse({status: 'success', requests: requests});
}

function updateOrderStatus(data) {
  requireAdminKey(data);

  const rowNumber = parseInt(data.rowNumber, 10);
  if (!rowNumber || rowNumber < 2) {
    throw new Error('Invalid row number.');
  }

  const sheet = getOrderSheet();
  const adminColumns = ensureAdminColumns(sheet);

  if (rowNumber > sheet.getLastRow()) {
    throw new Error('Request row not found.');
  }

  sheet.getRange(rowNumber, adminColumns.pipelineStatus, 1, 4).setValues([[
    data.status || 'New',
    new Date(),
    data.note || '',
    data.quotedPrice || ''
  ]]);

  const updatedRow = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  return jsonResponse({
    status: 'success',
    message: 'Status updated.',
    request: buildOrderRequest(updatedRow, rowNumber, adminColumns)
  });
}

// Helper function to format date from YYYY-MM-DD to M/D/YYYY
function formatDate(dateString) {
  if (!dateString) return '';
  try {
    // Parse the date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    return `${month}/${day}/${year}`;
  } catch (error) {
    return dateString; // Return original if parsing fails
  }
}

// Helper function to format time to match existing format (H:MM:SS AM/PM)
function formatTime(timeString) {
  if (!timeString) return '';
  try {
    // Handle both "1:30 PM" and "13:30" formats
    let time = timeString.trim();
    if (!time.includes(':')) {
      return timeString;
    }
    
    // If it already has AM/PM, just add :00 seconds if missing
    if (time.includes('AM') || time.includes('PM')) {
      if (!time.includes(':00')) {
        // Insert :00 before AM/PM
        time = time.replace(/(\d+:\d+)\s*(AM|PM)/, '$1:00 $2');
      }
      return time;
    }
    
    // If it's 24-hour format, convert to 12-hour with seconds
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes}:00 ${period}`;
  } catch (error) {
    return timeString; // Return original if parsing fails
  }
}

// Required doGet function for Google Apps Script web apps
function doGet(e) {
  try {
    const data = e.parameter || {};

    if (data.action === 'adminList') {
      return listOrderRequests(data);
    }

    return jsonResponse({
      status: 'success', 
      message: 'Slice of Heaven Cakes API is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in doGet:', error);
    return jsonResponse({status: 'error', message: publicErrorMessage(error)});
  }
}

function doPost(e) {
    try {
      // Parse the form data
      const data = e.parameter;
      const formType = data.formType || 'order'; // Default to order if not specified

      if (data.action === 'updateStatus') {
        return updateOrderStatus(data);
      }

      if (formType === 'order') {
        return handleOrderForm(data, e);
      } else if (formType === 'contact') {
        return handleContactForm(data);
      } else {
        // Fallback to order form for backward compatibility
        return handleOrderForm(data, e);
      }
      
    } catch (error) {
      console.error('Error in doPost:', error);
      return jsonResponse({status: 'error', message: publicErrorMessage(error)});
    }
}

function handleOrderForm(data, e) {
  const targetSheet = getOrderSheet();
  const adminColumns = ensureAdminColumns(targetSheet);
  const requestType = data.requestIntent === 'order' ? 'Order Request' : 'Quote Request';
  const initialStatus = data.requestIntent === 'order' ? 'New Order' : 'New Quote';

  // Create a row with the form data matching Google Sheet column order based on Odalys's correct data
  const row = [
    new Date(), // Timestamp
    data.name || '', // Name
    data.email || '', // Email
    data.phone || '', // Phone Number
    data.shape || '', // Cake Shape
    data.layers || '', // How many layers? (Column 4)
    data.size || '', // What size? (Column 5)
    data.servings || '', // Number of desired servings (Column 6)
    data.flavors || '', // Flavor and Filling
    data.extras || '', // Enhancements
    data.colors || '', // Colors
    data.message || '', // What would you like your cake to say?
    data.occasion || '', // Occasion
    '', // Inspiration Photos (blank column for sheet alignment)
    formatDate(data.eventDate) || '', // Date Needed
    formatTime(data.pickupTime) || '', // Preferred Pick-Up Time
    data.delivery || '', // Will you need it delivered?
    data.pricingAck || '', // Pricing acknowledgment
    data.termsAck || '', // Terms acknowledgment
    data.allergies || '' // Allergies / Dietary Restrictions
  ];

  // Add the row to the sheet
  targetSheet.appendRow(row);
  const appendedRow = targetSheet.getLastRow();
  targetSheet.getRange(appendedRow, adminColumns.requestType, 1, ADMIN_HEADERS.length).setValues([[
    requestType,
    initialStatus,
    new Date(),
    '',
    ''
  ]]);

  const emailFields = {
    name: htmlEscape(data.name),
    email: safeLinkValue(data.email),
    phone: safeLinkValue(data.phone),
    shape: htmlEscape(data.shape),
    servings: htmlEscape(data.servings),
    layers: htmlEscape(data.layers),
    size: htmlEscape(data.size),
    flavors: htmlEscape(data.flavors),
    extras: htmlEscape(data.extras),
    colors: htmlEscape(data.colors),
    message: htmlEscape(data.message),
    occasion: htmlEscape(data.occasion),
    allergies: htmlEscape(data.allergies || 'None specified'),
    eventDate: htmlEscape(data.eventDate),
    pickupTime: htmlEscape(data.pickupTime),
    delivery: htmlEscape(data.delivery),
    requestType: htmlEscape(requestType)
  };

  // Send email notification
  const emailSubject = `${requestType} - ${data.name}`;
  const emailBody = `
    <h2>NEW ${emailFields.requestType.toUpperCase()}!</h2>
    
    <h3>👤 CUSTOMER INFO:</h3>
    <p><strong>Name:</strong> ${emailFields.name}</p>
    <p><strong>Email:</strong> <a href="mailto:${emailFields.email}">${emailFields.email}</a></p>
    <p><strong>Phone:</strong> <a href="tel:${emailFields.phone}">${emailFields.phone}</a></p>
    
    <h3>🍰 CAKE DETAILS:</h3>
    <p><strong>Shape:</strong> ${emailFields.shape}</p>
    <p><strong>Servings:</strong> ${emailFields.servings} people</p>
    <p><strong>Layers:</strong> ${emailFields.layers} layers</p>
    <p><strong>Size:</strong> ${emailFields.size} inches</p>
    <p><strong>Flavors:</strong> ${emailFields.flavors}</p>
    <p><strong>Extras:</strong> ${emailFields.extras}</p>
    
    <h3>🎨 DESIGN:</h3>
    <p><strong>Colors:</strong> ${emailFields.colors}</p>
    <p><strong>Message:</strong> "${emailFields.message}"</p>
    <p><strong>Occasion:</strong> ${emailFields.occasion}</p>
    
    <h3>⚠️ ALLERGIES / DIETARY RESTRICTIONS:</h3>
    <p><strong>Allergies:</strong> ${emailFields.allergies}</p>
    
    <h3>📅 EVENT INFO:</h3>
    <p><strong>Event Date:</strong> ${emailFields.eventDate}</p>
    <p><strong>Pickup Time:</strong> ${emailFields.pickupTime}</p>
    <p><strong>Delivery:</strong> ${emailFields.delivery}</p>

    <hr>
    <h3>📱 TEXT CUSTOMER: <a href="tel:${emailFields.phone}">${emailFields.phone}</a></h3>
  `;

  // Send the email to yourself
  MailApp.sendEmail({
    to: "sliceofheaven.cakes7@gmail.com",
    subject: emailSubject,
    htmlBody: emailBody
  });

  // Send confirmation email to customer
  if (data.email) {
    const customerEmailSubject = `${data.requestIntent === 'order' ? 'Order Request' : 'Quote Request'} Received - Slice of Heaven Vintage Cakes`;
    const customerEmailBody = `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #E6F3FF;">
          <h1 style="color: #206692; margin: 0; font-size: 28px;">Slice of Heaven</h1>
          <p style="color: #666; font-style: italic; margin: 5px 0;">Vintage Cakes</p>
        </div>

        <div style="padding: 30px 0;">
          <h2 style="color: #333; margin-bottom: 20px;">Thank You, ${emailFields.name}!</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            I've received your ${data.requestIntent === 'order' ? 'cake order request' : 'cake quote request'} and I'm excited to create something special for you.
            I'll review your details and get back to you within <strong>24 hours</strong>.
          </p>
        </div>

        <div style="background: #E6F3FF; padding: 25px; border-radius: 12px; margin: 20px 0;">
          <h3 style="color: #206692; margin-top: 0;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid rgba(0,0,0,0.1);">Occasion:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">${emailFields.occasion}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid rgba(0,0,0,0.1);">Event Date:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">${emailFields.eventDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid rgba(0,0,0,0.1);">Pickup Time:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">${emailFields.pickupTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid rgba(0,0,0,0.1);">Cake:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">${emailFields.size}, ${emailFields.layers} layers, ${emailFields.shape}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid rgba(0,0,0,0.1);">Flavors:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">${emailFields.flavors}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid rgba(0,0,0,0.1);">Message:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">"${emailFields.message}"</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Delivery:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold;">${emailFields.delivery}</td>
            </tr>
          </table>
        </div>

        <div style="padding: 20px 0; border-top: 1px solid #eee;">
          <h3 style="color: #333; margin-bottom: 15px;">What's Next?</h3>
          <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
            <li>I'll review your details and contact you within 24 hours</li>
            <li>If you are ready to book, a 50% non-refundable deposit will be required to secure your date</li>
            <li>Final payment is due 24 hours before pickup</li>
          </ul>
        </div>

        <div style="text-align: center; padding: 30px 0; border-top: 2px solid #E6F3FF; margin-top: 20px;">
          <p style="color: #666; margin-bottom: 10px;">Questions? Just reply to this email!</p>
          <p style="color: #206692; font-style: italic; font-size: 18px;">Sweet regards,<br>Slice of Heaven Vintage Cakes</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            <a href="https://sliceofheavenvintagecakes.com" style="color: #206692;">sliceofheavenvintagecakes.com</a> |
            <a href="https://instagram.com/_sliceofheavencakes_" style="color: #206692;">@_sliceofheavencakes_</a>
          </p>
        </div>
      </div>
    `;

    MailApp.sendEmail({
      to: data.email,
      subject: customerEmailSubject,
      htmlBody: customerEmailBody,
      replyTo: "sliceofheaven.cakes7@gmail.com"
    });
  }

  // Create calendar event for order requests only. Quote requests stay visible in the admin dashboard calendar.
  if (data.requestIntent === 'order' && data.eventDate && data.pickupTime && data.pickupTime !== 'Not sure yet') {
    try {
      // Get the default calendar
      const calendar = CalendarApp.getDefaultCalendar();
      
      // Parse the event date and time (avoiding timezone shift)
      const [year, month, day] = data.eventDate.split('-').map(num => parseInt(num, 10));
      const eventDate = new Date(year, month - 1, day); // month is 0-indexed
      const pickupTime = data.pickupTime;
      
      // Convert pickup time to 24-hour format for the calendar
      let [time, period] = pickupTime.split(' ');
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours);
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      // Set the pickup time on the event date
      eventDate.setHours(hours, parseInt(minutes || 0), 0, 0);
      
      // Create end time (30 minutes later)
      const endTime = new Date(eventDate);
      endTime.setMinutes(endTime.getMinutes() + 30);
      
      // Create calendar event
      const eventTitle = `🍰 ${data.name} - ${data.occasion} Cake Pickup`;
      const eventDescription = `
CUSTOMER: ${data.name}
PHONE: ${data.phone}
OCCASION: ${data.occasion}

CAKE DETAILS:
• ${data.shape} shape, ${data.size} inches
• ${data.layers} layers, serves ${data.servings}
• Flavors: ${data.flavors}
• Extras: ${data.extras}
• Colors: ${data.colors}
• Message: "${data.message}"
• Allergies: ${data.allergies || 'None specified'}

DELIVERY: ${data.delivery}
PHOTOS: ${data.photos}

Order received: ${new Date().toLocaleString()}
      `.trim();
      
      const event = calendar.createEvent(
        eventTitle,
        eventDate,
        endTime,
        {
          description: eventDescription,
          location: data.delivery.includes('Yes') ? 'DELIVERY' : 'PICKUP'
        }
      );
      
    } catch (calendarError) {
      console.error('Error creating calendar event.');
      // Don't fail the whole request if calendar fails
    }
  }

  // Return success response
  return jsonResponse({status: 'success', message: `${requestType} submitted successfully!`});
}

function handleContactForm(data) {
  // You'll need to create a separate sheet for contact form responses
  // For now, let's use the same sheet but add a prefix to distinguish
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CONTACT_SHEET_NAME);
  
  // If contact sheet doesn't exist, create it
  let targetSheet = sheet;
  if (!targetSheet) {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    targetSheet = spreadsheet.insertSheet(CONTACT_SHEET_NAME);
    
    // Add headers for contact form
    const headers = [
      'Timestamp',
      'Name',
      'Email',
      'Phone',
      'Inquiry Type',
      'Message',
      'Cake Image',
      'Cake Title'
    ];
    targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Create a row with the contact form data
  const row = [
    new Date(), // Timestamp
    data.name || '', // Name
    data.email || '', // Email
    data.phone || '', // Phone
    data.inquiryType || '', // Inquiry Type
    data.message || '', // Message
    data.cakeImage || '', // Cake Image (if from gallery)
    data.cakeTitle || '' // Cake Title (if from gallery)
  ];

  // Add the row to the sheet
  targetSheet.appendRow(row);

  // Send email notification for contact form
  const contactFields = {
    name: htmlEscape(data.name),
    email: safeLinkValue(data.email),
    phone: safeLinkValue(data.phone),
    inquiryType: htmlEscape(data.inquiryType),
    message: htmlEscape(data.message),
    cakeImage: safeLinkValue(data.cakeImage),
    cakeTitle: htmlEscape(data.cakeTitle)
  };
  const emailSubject = `❓ New Inquiry - ${data.name}`;
  const emailBody = `
    <h2>❓ NEW INQUIRY ALERT!</h2>
    
    <h3>👤 CUSTOMER INFO:</h3>
    <p><strong>Name:</strong> ${contactFields.name}</p>
    <p><strong>Email:</strong> <a href="mailto:${contactFields.email}">${contactFields.email}</a></p>
    <p><strong>Phone:</strong> <a href="tel:${contactFields.phone}">${contactFields.phone}</a></p>
    
    <h3>❓ INQUIRY DETAILS:</h3>
    <p><strong>Inquiry Type:</strong> ${contactFields.inquiryType}</p>
    <p><strong>Message:</strong></p>
    <p>${contactFields.message}</p>
    
    ${data.cakeImage ? `
    <h3>🍰 REFERENCED CAKE:</h3>
    <p><strong>Cake:</strong> ${contactFields.cakeTitle}</p>
    <p><strong>Image:</strong> ${contactFields.cakeImage}</p>
    ` : ''}
    
    <hr>
    <h3>📧 REPLY TO: <a href="mailto:${contactFields.email}">${contactFields.email}</a></h3>
    <h3>📱 CALL: <a href="tel:${contactFields.phone}">${contactFields.phone}</a></h3>
  `;

  // Send the email
  MailApp.sendEmail({
    to: "sliceofheaven.cakes7@gmail.com",
    subject: emailSubject,
    htmlBody: emailBody
  });

  // Return success response
  return jsonResponse({status: 'success', message: 'Inquiry submitted successfully!'});
}
