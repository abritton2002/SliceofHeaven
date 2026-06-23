const SPREADSHEET_ID = '1trxugWBoe89HKANnnHhqi14tiLrx5Q37EBo4xdoKqLY';
const ORDER_SHEET_NAME = 'Form Responses 1';
const CONTACT_SHEET_NAME = 'Contact Form Responses';
const ADMIN_KEY_PROPERTY = 'ADMIN_KEY';
const ADMIN_HEADERS = ['Request Type', 'Pipeline Status', 'Status Updated', 'Status Note', 'Quoted Price'];
const ADMIN_START_COLUMN = 21;

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
  const headerRange = sheet.getRange(1, ADMIN_START_COLUMN, 1, ADMIN_HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const needsHeaders = ADMIN_HEADERS.some((header, index) => currentHeaders[index] !== header);

  if (needsHeaders) {
    headerRange.setValues([ADMIN_HEADERS]);
  }
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

function listOrderRequests(data) {
  requireAdminKey(data);

  const sheet = getOrderSheet();
  ensureAdminColumns(sheet);

  const values = sheet.getDataRange().getValues();
  const requests = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0] && !row[1] && !row[2]) continue;

    const timestampSort = sortValue(row[0]);

    requests.push({
      rowNumber: i + 1,
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
      requestType: displayValue(row[20]) || 'Order Request',
      status: displayValue(row[21]) || 'New',
      statusUpdated: displayValue(row[22]),
      statusNote: displayValue(row[23]),
      quotedPrice: displayValue(row[24])
    });
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
  ensureAdminColumns(sheet);

  if (rowNumber > sheet.getLastRow()) {
    throw new Error('Request row not found.');
  }

  sheet.getRange(rowNumber, 22, 1, 4).setValues([[
    data.status || 'New',
    new Date(),
    data.note || '',
    data.quotedPrice || ''
  ]]);

  return jsonResponse({status: 'success', message: 'Status updated.'});
}

function setAdminKey(key) {
  const generatedKey = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
  const adminKey = key || generatedKey;

  PropertiesService.getScriptProperties().setProperty(ADMIN_KEY_PROPERTY, String(adminKey));
  return adminKey;
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
    return jsonResponse({status: 'error', message: error.toString()});
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

      console.log('Form type received:', formType);
      console.log('Data received:', data);
      console.log('Raw post data:', e.postData);
      console.log('Post data contents:', e.postData ? e.postData.contents : 'none');
      console.log('Post data length:', e.postData ? e.postData.contents.length : 'none');
      console.log('Available parameter keys:', Object.keys(data));
      
      // Handle file uploads if present
      if (e.postData && e.postData.contents) {
        console.log('Post data contents length:', e.postData.contents.length);
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
      // Return error response
      return jsonResponse({status: 'error', message: error.toString()});
    }
}

function handleOrderForm(data, e) {
  const targetSheet = getOrderSheet();
  ensureAdminColumns(targetSheet);
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
    data.allergies || '', // Allergies / Dietary Restrictions
    requestType, // Request Type
    initialStatus, // Pipeline Status
    new Date(), // Status Updated
    '', // Status Note
    '' // Quoted Price
  ];

  // Add the row to the sheet
  targetSheet.appendRow(row);

  // Send email notification
  const emailSubject = `${requestType} - ${data.name}`;
  const emailBody = `
    <h2>NEW ${requestType.toUpperCase()}!</h2>
    
    <h3>👤 CUSTOMER INFO:</h3>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
    <p><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>
    
    <h3>🍰 CAKE DETAILS:</h3>
    <p><strong>Shape:</strong> ${data.shape}</p>
    <p><strong>Servings:</strong> ${data.servings} people</p>
    <p><strong>Layers:</strong> ${data.layers} layers</p>
    <p><strong>Size:</strong> ${data.size} inches</p>
    <p><strong>Flavors:</strong> ${data.flavors}</p>
    <p><strong>Extras:</strong> ${data.extras}</p>
    
    <h3>🎨 DESIGN:</h3>
    <p><strong>Colors:</strong> ${data.colors}</p>
    <p><strong>Message:</strong> "${data.message}"</p>
    <p><strong>Occasion:</strong> ${data.occasion}</p>
    
    <h3>⚠️ ALLERGIES / DIETARY RESTRICTIONS:</h3>
    <p><strong>Allergies:</strong> ${data.allergies || 'None specified'}</p>
    
    <h3>📅 EVENT INFO:</h3>
    <p><strong>Event Date:</strong> ${data.eventDate}</p>
    <p><strong>Pickup Time:</strong> ${data.pickupTime}</p>
    <p><strong>Delivery:</strong> ${data.delivery}</p>

    <hr>
    <h3>📱 TEXT CUSTOMER: <a href="tel:${data.phone}">${data.phone}</a></h3>
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
          <h2 style="color: #333; margin-bottom: 20px;">Thank You, ${data.name}!</h2>
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
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">${data.occasion}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid rgba(0,0,0,0.1);">Event Date:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">${data.eventDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid rgba(0,0,0,0.1);">Pickup Time:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">${data.pickupTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid rgba(0,0,0,0.1);">Cake:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">${data.size}, ${data.layers} layers, ${data.shape}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid rgba(0,0,0,0.1);">Flavors:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">${data.flavors}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; border-bottom: 1px solid rgba(0,0,0,0.1);">Message:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.1);">"${data.message}"</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Delivery:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold;">${data.delivery}</td>
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
      
      console.log('Calendar event created:', event.getTitle());
      
    } catch (calendarError) {
      console.error('Error creating calendar event:', calendarError);
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
  const emailSubject = `❓ New Inquiry - ${data.name}`;
  const emailBody = `
    <h2>❓ NEW INQUIRY ALERT!</h2>
    
    <h3>👤 CUSTOMER INFO:</h3>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
    <p><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>
    
    <h3>❓ INQUIRY DETAILS:</h3>
    <p><strong>Inquiry Type:</strong> ${data.inquiryType}</p>
    <p><strong>Message:</strong></p>
    <p>${data.message}</p>
    
    ${data.cakeImage ? `
    <h3>🍰 REFERENCED CAKE:</h3>
    <p><strong>Cake:</strong> ${data.cakeTitle}</p>
    <p><strong>Image:</strong> ${data.cakeImage}</p>
    ` : ''}
    
    <hr>
    <h3>📧 REPLY TO: <a href="mailto:${data.email}">${data.email}</a></h3>
    <h3>📱 CALL: <a href="tel:${data.phone}">${data.phone}</a></h3>
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
