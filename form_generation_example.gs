// Form 1.1
function setupForm() {
  const form = FormApp.getActiveForm();
  const ss = SpreadsheetApp.openById('10eZDEJf7Yima91Y8ijVsuc0X7e7XsTn6FY2hfikPt-k');
  const resultsSheet = ss.getSheetByName("Results");
  const data = resultsSheet.getDataRange().getValues();

  // filter the data to include only rows for round Q1.1
  const annotatorA1Data = data.filter(row => row[5] === 'Q1.1');

  // retrieve the last processed row from the PropertiesService
  const properties = PropertiesService.getScriptProperties();
  let lastProcessedRow = parseInt(properties.getProperty('LAST_PROCESSED_ROW') || '0');

  const batchSize = 25; // nr of rows to process in each run (25)
  const endRow = Math.min(lastProcessedRow + batchSize, annotatorA1Data.length);

  // remove any existing items in the form (only during the first run)
  if (lastProcessedRow === 0) { 
    const items = form.getItems();
    items.forEach(item => form.deleteItem(item));

    form.setTitle('Image Annotation Questionnaire: 1.1');
    form.setDescription('Welcome to the questionnaire for my Artificial Intelligence Bachelor Thesis project at Vrije Universiteit Amsterdam. Your participation is greatly appreciated.\n\n\n\nThis survey aims to enhance our understanding of how prompt engineering affects spatial relationships (behind, in front of, left of, right of) between objects. You will evaluate a total of 75 images, each with four questions:\n\n1. Does the image accurately reflect the spatial relationship between the objects as specified in the query?\n2. Does the image contain all the objects specified in the query?\n3. Does the image contain any objects not specified in the query that do not naturally fit the described setting?\n4. Does the image contain any duplicates of the objects specified in the query? Ignore duplicates of other objects.\n\nWhen answering the first question, make sure to evaluate only based on the correctness of the spatial relation. The only thing that matters here is the position of the objects, you can ignore their colour, size, or surrounding environment. \n\nWhen answering the second question, please check whether the generated image contains all the objects mentioned in the query.\n\nWhen answering the third question, keep in mind that objects naturally part of the described setting are not considered additional. For example, in the query: "An apple is situated to the right of a shoe in a bathroom," a bathtub is not considered an additional object because it belongs in a bathroom. However, a guitar would be considered an additional object in this setting.\n\nA duplicate refers to an additional copy of an object specified in the query that appears again in the image. For example, if the query specifies "an apple and a shoe," a second apple or a second shoe in the image would be considered a duplicate. When answering the fourth question, focus only on duplicates of the objects specified in the query. For example, if the query mentions "an apple is situated to the right of a shoe, in a bathroom," verify if there are multiple apples or shoes in the image. Please ignore duplicates of objects that are not mentioned in the query. \n\nPlease answer the questions carefully. If you need to take a break at any point, feel free to do so. To help maintain focus, it is highly recommended to take a break of about two minutes after every 15 images. The entire evaluation takes approximately 35—45 minutes to complete.\n\nIf you have any questions or need further assistance, please contact me at abesovasara@gmail.com.\n\nThank you for your time and contribution! \n\nSara Abesová');
  }

  // process each row of data for annotator A1
  for (let i = lastProcessedRow; i < endRow; i++) {
    const row = annotatorA1Data[i];
    const [query, imageUrl] = row;
    const fileId = extractFileIdFromUrl(imageUrl);
    try {
      const imageBlob = DriveApp.getFileById(fileId).getBlob();

      const item = form.addImageItem();
      item.setImage(imageBlob);
      item.setTitle(`Query: ${query}`);

      // add multiple choice question about the spatial relations
      const mcq1 = form.addMultipleChoiceItem();
      mcq1.setTitle("Does the image accurately reflect the spatial relationship between the objects as specified in the query?")
          .setChoiceValues(['Yes', 'No'])
          .setRequired(true);

      // add multiple choice question about the presence of all objects 
      const mcq2 = form.addMultipleChoiceItem();
      mcq2.setTitle("Does the image contain all the objects specified in the query?")
          .setChoiceValues(['Yes', 'No'])
          .setRequired(true);

      // add multiple choice question about additional objects
      const mcq3 = form.addMultipleChoiceItem();
      mcq3.setTitle("Does the image contain any objects not specified in the query that do not naturally fit the described setting?") 
          .setChoiceValues(['Yes', 'No'])
          .setRequired(true);

      // add multiple choice question about duplicate objects
      const mcq4 = form.addMultipleChoiceItem();
      mcq4.setTitle("Does the image contain any duplicates of the objects specified in the query? Ignore duplicates of other objects.")
          .setChoiceValues(['Yes', 'No'])
          .setRequired(true);

      form.addPageBreakItem();
    } catch (e) {
      Logger.log("Failed to process image with URL: " + imageUrl + " Error: " + e.toString()); // check
    }
  }

  // update the last processed row
  if (endRow < annotatorA1Data.length) {
    properties.setProperty('LAST_PROCESSED_ROW', endRow);
    ScriptApp.newTrigger('setupForm')
      .timeBased()
      .after(1 * 60 * 1000) // after 60 seconds
      .create();
  } else {
    properties.deleteProperty('LAST_PROCESSED_ROW'); // reset when finished
  }

  Logger.log('Form URL: ' + form.getPublishedUrl());
}

function extractFileIdFromUrl(url) {
  const regex = /\/d\/(.+?)\//;
  const match = url.match(regex);
  return match ? match[1] : null;
}