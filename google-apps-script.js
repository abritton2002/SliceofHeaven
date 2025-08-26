// Helper function to format date from YYYY-MM-DD to M/D/YYYY
function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
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

function doPost(e) {
    try {
      // Parse the form data
      const data = e.parameter;
      const formType = data.formType || 'order'; // Default to order if not specified
      
      console.log('Form type received:', formType);
      console.log('Data received:', data);
      console.log('Raw post data:', e.postData);
      
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

  // Handle file uploads and create Google Drive links
  let photoLinks = '';
  if (data.photos && data.photos !== 'No photos uploaded') {
    try {
      // Create a Google Drive folder for this order
      const folderName = `Cake Order - ${data.name} - ${new Date().toISOString().split('T')[0]}`;
      let folder;
      
      try {
        // Try to find existing folder or create new one
        const folders = DriveApp.getFoldersByName(folderName);
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder(folderName);
        }
        
        const driveLinks = [];
        const fileCount = parseInt(data.file_count) || 0;
        
        console.log('Processing', fileCount, 'files');
        
        // Process uploaded files
        for (let i = 0; i < fileCount; i++) {
          const fileName = data[`file_${i}_name`];
          const fileSize = data[`file_${i}_size`];
          const fileType = data[`file_${i}_type`];
          
          console.log(`Processing file ${i}:`, fileName, fileSize, fileType);
          
          if (fileName && fileSize) {
            try {
              // Try to get file blob from different possible sources
              let fileBlob = null;
              
              // Method 1: Try to get base64 encoded file
              if (data[`file_${i}_base64`]) {
                try {
                  const base64Data = data[`file_${i}_base64`];
                  const mimeType = data[`file_${i}_type`] || 'image/jpeg';
                  
                  // Convert base64 to blob
                  const byteCharacters = Utilities.base64Decode(base64Data);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let j = 0; j < byteCharacters.length; j++) {
                    byteNumbers[j] = byteCharacters.charCodeAt(j);
                  }
                  const byteArray = Utilities.newUint8Array(byteNumbers);
                  fileBlob = Utilities.newBlob(byteArray, mimeType, fileName);
                  
                  console.log('Successfully converted base64 to blob for:', fileName);
                } catch (base64Error) {
                  console.error('Error converting base64 to blob:', base64Error);
                }
              }
              // Method 2: Try to get from form data (fallback)
              else if (data[`file_${i}`]) {
                fileBlob = data[`file_${i}`];
                console.log('Got file blob from form data');
              }
              
              if (fileBlob) {
                // Create the actual image file in Google Drive
                const file = folder.createFile(fileBlob);
                file.setName(fileName);
                const driveLink = file.getUrl();
                driveLinks.push(`${fileName}: ${driveLink}`);
                console.log('Successfully created file in Drive:', driveLink);
              } else {
                // Fallback: Create a placeholder file with order information
                const fileContent = `Inspiration Photo for ${data.name}'s ${data.occasion} cake\n\nOrder Details:\n- Shape: ${data.shape}\n- Size: ${data.size}\n- Layers: ${data.layers}\n- Colors: ${data.colors}\n- Message: ${data.message}\n\nCustomer uploaded: ${fileName} (${fileSize}KB)\n\nPlease ask customer to send the actual image via text or email.`;
                const file = folder.createFile(fileName + '.txt', fileContent, MimeType.PLAIN_TEXT);
                const driveLink = file.getUrl();
                driveLinks.push(`${fileName}: ${driveLink}`);
                console.log('Created placeholder file:', driveLink);
              }
            } catch (fileError) {
              console.error('Error processing file:', fileError);
              driveLinks.push(`${fileName} (${fileSize}KB) - Error processing file`);
            }
          }
        }
        
        photoLinks = driveLinks.join(' | ');
        
      } catch (driveError) {
        console.error('Error creating Drive folder:', driveError);
        photoLinks = data.photos; // Fallback to original data
      }
    } catch (error) {
      console.error('Error processing photos:', error);
      photoLinks = data.photos; // Fallback to original data
    }
  }

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
    photoLinks || data.photos || '', // Inspiration Photos with Drive links
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
    
    <h3>📸 INSPIRATION PHOTOS:</h3>
    <p><strong>Photos:</strong> ${data.photos}</p>
    ${photoLinks && photoLinks !== data.photos ? `<p><strong>Google Drive Links:</strong> ${photoLinks}</p>` : ''}
    <p><em>Note: Customer uploaded inspiration photos. Check the Google Drive links above for order details and request actual images from customer.</em></p>
    
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
      
      // Parse the event date and time
      const eventDate = new Date(data.eventDate);
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
