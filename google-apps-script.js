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
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success', 
      message: 'Slice of Heaven Cakes API is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    try {
      // Parse the form data
      const data = e.parameter;
      const formType = data.formType || 'order'; // Default to order if not specified
      
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
      return ContentService
        .createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
}

function handleOrderForm(data, e) {
  // Your actual Google Sheet ID for orders
  const sheet = SpreadsheetApp.openById('1trxugWBoe89HKANnnHhqi14tiLrx5Q37EBo4xdoKqLY').getSheetByName('Form Responses 1');

  // If the sheet doesn't exist, get the active sheet
  const targetSheet = sheet || SpreadsheetApp.openById('1trxugWBoe89HKANnnHhqi14tiLrx5Q37EBo4xdoKqLY').getActiveSheet();

  // Create a row with the form data matching Google Sheet column order based on Odalys's correct data
  const row = [
    new Date(), // Timestamp
    data.name || '', // Name
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
    data.termsAck || '' // Terms acknowledgment
  ];

  // Add the row to the sheet
  targetSheet.appendRow(row);

  // Send email notification
  const emailSubject = `🍰 New Cake Order - ${data.name}`;
  const emailBody = `
    <h2>🍰 NEW ORDER ALERT!</h2>
    
    <h3>👤 CUSTOMER INFO:</h3>
    <p><strong>Name:</strong> ${data.name}</p>
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
    
    <h3>📅 EVENT INFO:</h3>
    <p><strong>Event Date:</strong> ${data.eventDate}</p>
    <p><strong>Pickup Time:</strong> ${data.pickupTime}</p>
    <p><strong>Delivery:</strong> ${data.delivery}</p>

    <hr>
    <h3>📱 TEXT CUSTOMER: <a href="tel:${data.phone}">${data.phone}</a></h3>
  `;

  // Send the email
  MailApp.sendEmail({
    to: "sliceofheaven.cakes7@gmail.com",
    subject: emailSubject,
    htmlBody: emailBody
  });

  // Create calendar event
  if (data.eventDate && data.pickupTime) {
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
  return ContentService
    .createTextOutput(JSON.stringify({status: 'success', message: 'Order submitted successfully!'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleContactForm(data) {
  // You'll need to create a separate sheet for contact form responses
  // For now, let's use the same sheet but add a prefix to distinguish
  const sheet = SpreadsheetApp.openById('1trxugWBoe89HKANnnHhqi14tiLrx5Q37EBo4xdoKqLY').getSheetByName('Contact Form Responses');
  
  // If contact sheet doesn't exist, create it
  let targetSheet = sheet;
  if (!targetSheet) {
    const spreadsheet = SpreadsheetApp.openById('1trxugWBoe89HKANnnHhqi14tiLrx5Q37EBo4xdoKqLY');
    targetSheet = spreadsheet.insertSheet('Contact Form Responses');
    
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
  return ContentService
    .createTextOutput(JSON.stringify({status: 'success', message: 'Inquiry submitted successfully!'}))
    .setMimeType(ContentService.MimeType.JSON);
}
